// GET /api/me — the signed-in player's data for the dashboard:
//  - stats: game stats (streak, points…) or null when the player has no row yet,
//  - projects: quest repositories (from the quests table), most recent first.
// Public data only — the GitHub token never leaves the server.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { getFolderLanguages } from "@/lib/repo-language";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getServerAuth(req);
  if (!auth?.login) {
    return NextResponse.json({ stats: null, projects: [] });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { githubLogin: auth.login },
      include: {
        stats: true,
        quests: { orderBy: { date: "desc" }, take: 50 },
      },
    });

    // Player signed in but with no generated quest → a clean empty state.
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

    // The language of each quest folder derived from the container repo tree (colored dot).
    const langMap = await getFolderLanguages(auth.login);
    const projects = user.quests.map((q) => ({
      id: q.id,
      name: q.folderName ?? "(no folder)",
      title: q.title,
      folderUrl: q.folderUrl ?? "",
      language: q.folderName ? (langMap.get(q.folderName) ?? null) : null,
    }));

    return NextResponse.json({ stats, projects });
  } catch (e) {
    console.error("[api/me] Failed to fetch player data:", e);
    return NextResponse.json({ stats: null, projects: [] }, { status: 500 });
  }
}
