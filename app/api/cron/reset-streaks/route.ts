// GET /api/cron/reset-streaks — zadanie cron (Vercel Cron) odpalane raz dziennie
// po północy CET. Zeruje currentStreak graczom, którzy pominęli dzień.
//
// Logika: streak ŻYJE, jeśli ostatnie ukończenie było wczoraj (jest jeszcze dziś,
// by je przedłużyć) albo dziś. Jeśli ostatnie ukończenie jest starsze niż wczoraj
// (wg CET) — currentStreak spada do 0.
//
// WAŻNE: kasujemy WYŁĄCZNIE currentStreak. longestStreak, punkty, liczba questów
// i osiągnięcia są trwałe i NIGDY nie są tu ruszane.
//
// Bezpieczeństwo: endpoint wymaga nagłówka Authorization: Bearer <CRON_SECRET>.
// Vercel Cron dokłada ten nagłówek automatycznie, gdy ustawiony jest CRON_SECRET.
// Bez poprawnego sekretu zwracamy 401 (fail-closed) — nie da się go wołać z zewnątrz.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cetDayStart } from "@/lib/date";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Brak autoryzacji." }, { status: 401 });
  }

  // „Dziś" wg CET (cron odpala się po północy CET) i „wczoraj".
  const today = cetDayStart();
  const yesterday = new Date(today.getTime() - 86_400_000);

  // Kandydaci do sprawdzenia: każdy z niezerowym aktualnym streakiem.
  const active = await prisma.stats.findMany({
    where: { currentStreak: { gt: 0 } },
    select: { userId: true },
  });
  const ids = active.map((s) => s.userId);

  let reset = 0;
  if (ids.length > 0) {
    // Którzy z nich mają ukończenie wczoraj lub dziś → streak zostaje aktualny.
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
