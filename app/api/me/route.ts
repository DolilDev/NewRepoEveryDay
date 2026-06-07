// GET /api/me — dane zalogowanego gracza do dashboardu:
//  - stats: statystyki gry (streak, punkty…) lub null, gdy gracz nie ma jeszcze wiersza,
//  - projects: repozytoria questowe (z tabeli quests), od najnowszego.
// Tylko publiczne dane — token GitHub nie opuszcza serwera.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getServerAuth(req);
  if (!auth?.login) {
    return NextResponse.json({ stats: null, projects: [] });
  }

  const user = await prisma.user.findUnique({
    where: { githubLogin: auth.login },
    include: {
      stats: true,
      quests: { orderBy: { date: "desc" }, take: 50 },
    },
  });

  // Gracz zalogowany, ale bez żadnego wygenerowanego questa → czysty stan pusty.
  if (!user) {
    return NextResponse.json({ stats: null, projects: [] });
  }

  const stats = user.stats
    ? {
        currentStreak: user.stats.currentStreak,
        longestStreak: user.stats.longestStreak,
        totalQuests: user.stats.totalQuests,
        points: user.stats.points,
      }
    : null;

  const projects = user.quests.map((q) => ({
    id: q.id,
    name: q.repoName,
    title: q.title,
    repoUrl: q.repoUrl ?? "",
  }));

  return NextResponse.json({ stats, projects });
}
