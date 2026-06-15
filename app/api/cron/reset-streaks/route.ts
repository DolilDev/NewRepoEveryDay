// GET /api/cron/reset-streaks — cron job (Vercel Cron) run once a day
// after midnight CET. Resets currentStreak for players who missed a day.
//
// Logic: a streak is ALIVE if the last completion was yesterday (there is still
// today to extend it) or today. If the last completion is older than yesterday
// (in CET) — currentStreak drops to 0.
//
// IMPORTANT: we clear ONLY currentStreak. longestStreak, points, the number of
// quests and achievements are permanent and are NEVER touched here.
//
// Security: the endpoint requires an Authorization: Bearer <CRON_SECRET> header.
// Vercel Cron adds this header automatically when CRON_SECRET is set.
// Without a valid secret we return 401 (fail-closed) — it cannot be called from outside.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cetDayStart } from "@/lib/date";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // "Today" in CET (cron runs after midnight CET) and "yesterday".
  const today = cetDayStart();
  const yesterday = new Date(today.getTime() - 86_400_000);

  // Candidates to check: anyone with a non-zero current streak.
  const active = await prisma.stats.findMany({
    where: { currentStreak: { gt: 0 } },
    select: { userId: true },
  });
  const ids = active.map((s) => s.userId);

  let reset = 0;
  if (ids.length > 0) {
    // Which of them have a completion yesterday or today → streak stays current.
    const recent = await prisma.completion.findMany({
      where: { userId: { in: ids }, date: { gte: yesterday } },
      distinct: ["userId"],
      select: { userId: true },
    });
    const keep = new Set(recent.map((c) => c.userId));
    const toReset = ids.filter((id) => !keep.has(id));

    if (toReset.length > 0) {
      const res = await prisma.stats.updateMany({
        where: { userId: { in: toReset } },
        data: { currentStreak: 0 },
      });
      reset = res.count;
    }
  }

  return NextResponse.json({ ok: true, checked: ids.length, reset });
}
