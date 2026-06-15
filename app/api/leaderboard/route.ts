// GET /api/leaderboard — global player leaderboard from the database.
// All users with their stats included, sorted in descending order by
// currentStreak (tie-break: totalQuests, then points). Players without a stats
// row land here with zeros — that's fine. Also returns meLogin (the login of
// the signed-in user) so the UI can highlight their row. Public data — no tokens.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getServerAuth(req);
  const meLogin = auth?.login ?? null;

  try {
    const users = await prisma.user.findMany({ include: { stats: true } });

    const players = users
      .map((u) => ({
        id: u.id,
        name: u.githubName ?? u.githubLogin,
        login: u.githubLogin,
        avatarUrl: u.avatarUrl,
        profileUrl: u.profileUrl ?? `https://github.com/${u.githubLogin}`,
        currentStreak: u.stats?.currentStreak ?? 0,
        longestStreak: u.stats?.longestStreak ?? 0,
        totalQuests: u.stats?.totalQuests ?? 0,
        points: u.stats?.points ?? 0,
      }))
      .sort(
        (a, b) =>
          b.currentStreak - a.currentStreak ||
          b.totalQuests - a.totalQuests ||
          b.points - a.points,
      );

    return NextResponse.json({ players, meLogin });
  } catch (e) {
    console.error("[api/leaderboard] Failed to fetch the leaderboard:", e);
    return NextResponse.json({ players: [], meLogin }, { status: 500 });
  }
}
