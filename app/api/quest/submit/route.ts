// POST /api/quest/submit — oddawanie i ocena dzisiejszego questa (Etap B).
// Przepływ: pobierz materiał z repo (cz.1) → oceń modelem (cz.2) → przy zaliczeniu
// kaskada w jednej transakcji: status PASSED, completion, stats (cz.3) i osiągnięcia.
// Token GitHub i klucz OpenAI używane WYŁĄCZNIE serwerowo — nie wracają do przeglądarki.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { cetDayStart } from "@/lib/date";
import { collectRepoMaterial } from "@/lib/quest-review";
import { evaluateQuest } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await getServerAuth(req);
  if (!auth?.login) {
    return NextResponse.json(
      { error: "Nie jesteś zalogowany. Zaloguj się przez GitHub." },
      { status: 401 },
    );
  }
  const { accessToken, login } = auth;

  try {
    // Dzisiejszy quest (wg CET) tego użytkownika.
    const quest = await prisma.quest.findFirst({
      where: { user: { githubLogin: login }, date: cetDayStart() },
    });
    if (!quest) {
      return NextResponse.json(
        { error: "Nie masz dziś questa do zgłoszenia. Najpierw wygeneruj quest." },
        { status: 400 },
      );
    }
    // Zaliczony quest jest już zamknięty — nie oceniamy ponownie.
    if (quest.status === "PASSED") {
      return NextResponse.json({ passed: true, alreadyCompleted: true });
    }

    // CZĘŚĆ 1: materiał z repo (QUEST.md = stan startowy, reszta = praca usera).
    const collected = await collectRepoMaterial(accessToken, login, quest.repoName);
    if (!collected.ok) {
      return NextResponse.json({ error: collected.error }, { status: 502 });
    }

    // Repo z samym QUEST.md → werdykt niezaliczony BEZ wołania OpenAI.
    if (!collected.hasUserWork) {
      return NextResponse.json({
        passed: false,
        missing: ["Nie dodano żadnej pracy — repozytorium zawiera tylko QUEST.md."],
        reasoning: "W repozytorium nie ma jeszcze żadnego wkładu użytkownika.",
      });
    }

    // CZĘŚĆ 2: ocena modelu.
    const criteria = Array.isArray(quest.criteria)
      ? quest.criteria.filter((c): c is string => typeof c === "string")
      : [];
    const verdict = await evaluateQuest(
      {
        title: quest.title,
        instructions: quest.instructions,
        openPart: quest.openPart,
        criteria,
      },
      collected.material,
    );

    // CZĘŚĆ 4 (odrzucenie): quest ZOSTAJE PENDING — można poprawić i zgłosić ponownie.
    if (!verdict.passed) {
      return NextResponse.json({
        passed: false,
        missing: verdict.missing,
        reasoning: verdict.reasoning,
      });
    }

    // CZĘŚĆ 3: kaskada przy zaliczeniu — wszystko w jednej transakcji.
    const today = cetDayStart();
    const yesterday = new Date(today.getTime() - 86_400_000);

    const summary = await prisma.$transaction(async (tx) => {
      // 1) Status questa → PASSED.
      await tx.quest.update({
        where: { id: quest.id },
        data: { status: "PASSED" },
      });

      // 2) Wpis w dzienniku ukończeń (źródło heatmapy i streaka).
      await tx.completion.create({
        data: {
          userId: quest.userId,
          questId: quest.id,
          date: today,
          repoUrl: quest.repoUrl,
          descriptionOfWork: verdict.descriptionOfWork || null,
        },
      });

      // 3) Streak liczony wg CET: poprzednie ukończenie sprzed dziś.
      const prevStats = await tx.stats.findUnique({
        where: { userId: quest.userId },
      });
      const lastCompletion = await tx.completion.findFirst({
        where: { userId: quest.userId, date: { lt: today } },
        orderBy: { date: "desc" },
      });

      let currentStreak: number;
      if (!lastCompletion) {
        currentStreak = 1; // pierwszy ukończony quest
      } else if (lastCompletion.date.getTime() === yesterday.getTime()) {
        currentStreak = (prevStats?.currentStreak ?? 0) + 1; // ciągłość
      } else {
        currentStreak = 1; // była przerwa → reset
      }

      const longestStreak = Math.max(prevStats?.longestStreak ?? 0, currentStreak);
      const totalQuests = (prevStats?.totalQuests ?? 0) + 1;
      const pointsAwarded = 100 + 10 * currentStreak; // stała 100 + bonus za streak
      const points = (prevStats?.points ?? 0) + pointsAwarded;

      await tx.stats.upsert({
        where: { userId: quest.userId },
        update: { currentStreak, longestStreak, totalQuests, points },
        create: {
          userId: quest.userId,
          currentStreak,
          longestStreak,
          totalQuests,
          points,
        },
      });

      // 4) Osiągnięcia. Para (userId, type) jest unikalna — createMany ze
      // skipDuplicates przyznaje tylko brakujące i nie duplikuje (wiersze trwałe).
      const earned = ["first_quest"]; // każde zaliczenie = pierwszy quest spełniony
      if (currentStreak >= 7) earned.push("streak_7");
      if (currentStreak >= 30) earned.push("streak_30");
      if (currentStreak >= 100) earned.push("streak_100");
      if (totalQuests >= 10) earned.push("quests_10");
      if (totalQuests >= 50) earned.push("quests_50");
      await tx.achievement.createMany({
        data: earned.map((type) => ({ userId: quest.userId, type })),
        skipDuplicates: true,
      });

      return { currentStreak, longestStreak, totalQuests, points, pointsAwarded };
    });

    return NextResponse.json({
      passed: true,
      descriptionOfWork: verdict.descriptionOfWork,
      pointsAwarded: summary.pointsAwarded,
      points: summary.points,
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Nieznany błąd serwera.";
    return NextResponse.json(
      { error: `Ocena nie powiodła się: ${message}` },
      { status: 500 },
    );
  }
}
