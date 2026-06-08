// Serwerowe pobieranie danych profilu zalogowanego gracza (komponenty serwerowe).
// UWAGA: tylko po stronie serwera — czyta sesję (auth) i bazę (Prisma).
// Na tym etapie „oglądany profil" = profil zalogowanego usera (własny).
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Login GitHub zalogowanego gracza (lub null). cache() dedupuje wywołanie auth()
// w obrębie jednego żądania — layout, sidebar i strona pytają o to samo raz.
export const getViewerLogin = cache(async (): Promise<string | null> => {
  const session = await auth();
  return session?.user?.login ?? null;
});

// Questy gracza (repozytoria questowe) — od najnowszego. Brak loginu → pusto.
export async function getUserQuests(login: string | null) {
  if (!login) return [];
  return prisma.quest.findMany({
    where: { user: { githubLogin: login } },
    orderBy: { date: "desc" },
  });
}

// Liczba questów gracza — licznik przy zakładce „Repositories".
export async function getUserQuestCount(login: string | null): Promise<number> {
  if (!login) return 0;
  return prisma.quest.count({ where: { user: { githubLogin: login } } });
}

// Statystyki gracza (jeden wiersz) — currentStreak/longestStreak/totalQuests/points.
// Brak wiersza → null (UI pokazuje zera).
export async function getUserStats(login: string | null) {
  if (!login) return null;
  return prisma.stats.findFirst({ where: { user: { githubLogin: login } } });
}

// Ukończenia gracza (źródło kalendarza) — rosnąco po dacie.
export async function getUserCompletions(login: string | null) {
  if (!login) return [];
  return prisma.completion.findMany({
    where: { user: { githubLogin: login } },
    select: { date: true, descriptionOfWork: true },
    orderBy: { date: "asc" },
  });
}

// Data dołączenia gracza do TEJ strony (NERD) — users.createdAt z naszej bazy,
// a NIE data założenia konta GitHub. Brak wiersza w users → null.
export async function getUserJoinedAt(login: string | null): Promise<Date | null> {
  if (!login) return null;
  const u = await prisma.user.findUnique({
    where: { githubLogin: login },
    select: { createdAt: true },
  });
  return u?.createdAt ?? null;
}

// Zdobyte osiągnięcia gracza — od najwcześniej odblokowanego.
export async function getUserAchievements(login: string | null) {
  if (!login) return [];
  return prisma.achievement.findMany({
    where: { user: { githubLogin: login } },
    orderBy: { unlockedAt: "asc" },
  });
}
