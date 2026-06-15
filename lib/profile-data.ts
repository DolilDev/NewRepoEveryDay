// Server-side fetching of the logged-in player's profile data (server components).
// NOTE: server-side only — reads the session (auth) and the database (Prisma).
// At this stage, "viewed profile" = the logged-in user's profile (their own).
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GitHub login of the logged-in player (or null). cache() dedupes the auth() call
// within a single request — the layout, sidebar, and page ask for the same thing once.
export const getViewerLogin = cache(async (): Promise<string | null> => {
  const session = await auth();
  return session?.user?.login ?? null;
});

// The player's quests (quest repositories) — most recent first. No login → empty.
export async function getUserQuests(login: string | null) {
  if (!login) return [];
  return prisma.quest.findMany({
    where: { user: { githubLogin: login } },
    orderBy: { date: "desc" },
  });
}

// The player's quest count — counter next to the "Repositories" tab.
export async function getUserQuestCount(login: string | null): Promise<number> {
  if (!login) return 0;
  return prisma.quest.count({ where: { user: { githubLogin: login } } });
}

// The player's stats (a single row) — currentStreak/longestStreak/totalQuests/points.
// No row → null (the UI shows zeros).
export async function getUserStats(login: string | null) {
  if (!login) return null;
  return prisma.stats.findFirst({ where: { user: { githubLogin: login } } });
}

// The player's completions (the calendar's source) — ascending by date.
export async function getUserCompletions(login: string | null) {
  if (!login) return [];
  return prisma.completion.findMany({
    where: { user: { githubLogin: login } },
    select: { date: true, descriptionOfWork: true },
    orderBy: { date: "asc" },
  });
}

// The date the player joined THIS site (NERD) — users.createdAt from our database,
// NOT the GitHub account creation date. No row in users → null.
export async function getUserJoinedAt(login: string | null): Promise<Date | null> {
  if (!login) return null;
  const u = await prisma.user.findUnique({
    where: { githubLogin: login },
    select: { createdAt: true },
  });
  return u?.createdAt ?? null;
}

// The player's earned achievements — earliest unlocked first.
export async function getUserAchievements(login: string | null) {
  if (!login) return [];
  return prisma.achievement.findMany({
    where: { user: { githubLogin: login } },
    orderBy: { unlockedAt: "asc" },
  });
}
