// POST /api/quest/submit — submitting and evaluating today's quest (Stage B).
// Flow: fetch material from the repo (part 1) → evaluate with the model (part 2) → on pass
// a cascade in a single transaction: status PASSED, completion, stats (part 3) and achievements.
// The GitHub token and the OpenAI key are used ONLY server-side — they never return to the browser.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { cetDayStart } from "@/lib/date";
import { collectFolderMaterial } from "@/lib/quest-review";
import { CONTAINER_REPO, regenerateContainerReadme } from "@/lib/container";
import { evaluateQuest } from "@/lib/openai";

export const runtime = "nodejs";

// Minimum interval between consecutive evaluations of the same quest.
const EVAL_COOLDOWN_MS = 30_000;

export async function POST(req: Request) {
  const auth = await getServerAuth(req);
  if (!auth?.login) {
    return NextResponse.json(
      { error: "You are not signed in. Sign in with GitHub." },
      { status: 401 },
    );
  }
  const { accessToken, login } = auth;

  try {
    // This user's today's quest (in CET).
    const quest = await prisma.quest.findFirst({
      where: { user: { githubLogin: login }, date: cetDayStart() },
    });
    if (!quest) {
      return NextResponse.json(
        { error: "You have no quest to submit today. Generate a quest first." },
        { status: 400 },
      );
    }
    // A passed quest is already closed — we do not evaluate it again.
    if (quest.status === "PASSED") {
      return NextResponse.json({ passed: true, alreadyCompleted: true });
    }

    // A quest must have a folder assigned (the container repo model). The old format
    // without a folder has nothing to evaluate — after the data cleanup these no longer exist.
    if (!quest.folderName) {
      return NextResponse.json(
        { error: "This quest has no folder assigned. Generate a new quest." },
        { status: 400 },
      );
    }

    // Per-quest rate limit: each evaluation pulls the repo tree from GitHub and calls OpenAI,
    // so we block spam (cooldown in the database — resilient to serverless/cold-start).
    // We stamp the marker BEFORE the costly operations so that every attempt counts.
    if (quest.lastEvaluatedAt) {
      const elapsed = Date.now() - quest.lastEvaluatedAt.getTime();
      if (elapsed < EVAL_COOLDOWN_MS) {
        const wait = Math.ceil((EVAL_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Too fast — wait ${wait} s before the next evaluation.` },
          { status: 429 },
        );
      }
    }
    await prisma.quest.update({
      where: { id: quest.id },
      data: { lastEvaluatedAt: new Date() },
    });

    // PART 1: material ONLY from the quest folder in the container repo
    // (QUEST.md = the starting state, the rest of the files in the folder = the user's work).
    const collected = await collectFolderMaterial(
      accessToken,
      login,
      CONTAINER_REPO,
      quest.folderName,
    );
    if (!collected.ok) {
      return NextResponse.json({ error: collected.error }, { status: 502 });
    }

    // A folder with only QUEST.md → a failed verdict WITHOUT calling OpenAI.
    if (!collected.hasUserWork) {
      return NextResponse.json({
        passed: false,
        missing: ["No work was added — the quest folder contains only QUEST.md."],
        reasoning: "There is no user contribution in the quest folder yet.",
      });
    }

    // PART 2: model evaluation.
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

    // PART 4 (rejection): the quest STAYS PENDING — it can be fixed and submitted again.
    // We add perCriterion so the frontend can show per-criterion details with evidence.
    if (!verdict.passed) {
      return NextResponse.json({
        passed: false,
        missing: verdict.missing,
        reasoning: verdict.reasoning,
        perCriterion: verdict.perCriterion,
      });
    }

    // PART 3: the cascade on pass — everything in a single transaction.
    const today = cetDayStart();
    const yesterday = new Date(today.getTime() - 86_400_000);

    const summary = await prisma.$transaction(async (tx) => {
      // 1) Quest status → PASSED.
      await tx.quest.update({
        where: { id: quest.id },
        data: { status: "PASSED" },
      });

      // 2) An entry in the completions log (the source of the heatmap and streak).
      // repoUrl now points to the quest folder in the container repo.
      await tx.completion.create({
        data: {
          userId: quest.userId,
          questId: quest.id,
          date: today,
          repoUrl: quest.folderUrl,
          descriptionOfWork: verdict.descriptionOfWork || null,
        },
      });

      // 3) Streak computed in CET: the previous completion before today.
      const prevStats = await tx.stats.findUnique({
        where: { userId: quest.userId },
      });
      const lastCompletion = await tx.completion.findFirst({
        where: { userId: quest.userId, date: { lt: today } },
        orderBy: { date: "desc" },
      });

      let currentStreak: number;
      if (!lastCompletion) {
        currentStreak = 1; // first completed quest
      } else if (lastCompletion.date.getTime() === yesterday.getTime()) {
        currentStreak = (prevStats?.currentStreak ?? 0) + 1; // continuity
      } else {
        currentStreak = 1; // there was a gap → reset
      }

      const longestStreak = Math.max(prevStats?.longestStreak ?? 0, currentStreak);
      const totalQuests = (prevStats?.totalQuests ?? 0) + 1;
      const pointsAwarded = 100 + 10 * currentStreak; // flat 100 + streak bonus
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

      // 4) Achievements. The (userId, type) pair is unique — createMany with
      // skipDuplicates grants only the missing ones and does not duplicate (rows are permanent).
      const earned = ["first_quest"]; // every pass = the first quest is satisfied
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

    // Part 6: refresh the quest list in the container README (this quest's status → ✅).
    // Best-effort — the pass is already saved, so a README error does not undo it.
    await regenerateContainerReadme(accessToken, login);

    return NextResponse.json({
      passed: true,
      descriptionOfWork: verdict.descriptionOfWork,
      pointsAwarded: summary.pointsAwarded,
      points: summary.points,
      currentStreak: summary.currentStreak,
      longestStreak: summary.longestStreak,
    });
  } catch (e) {
    // Full error only to the server logs — a generic message to the client (without leaking
    // OpenAI / GitHub / Prisma details).
    console.error("[quest/submit] Evaluation failed:", e);
    return NextResponse.json(
      { error: "Evaluation failed. Please try again in a moment." },
      { status: 500 },
    );
  }
}
