// GET /api/leaderboard — globalny ranking graczy z bazy.
// Wszyscy użytkownicy z dołączonymi statystykami, posortowani malejąco po
// currentStreak (rozstrzygnięcie: totalQuests, potem points). Gracze bez wiersza
// stats trafiają tu z zerami — to w porządku. Zwraca też meLogin (login
// zalogowanego), by UI wyróżniło jego wiersz. Dane publiczne — bez tokenów.
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
    console.error("[api/leaderboard] Nie udało się pobrać rankingu:", e);
    return NextResponse.json({ players: [], meLogin }, { status: 500 });
  }
}
