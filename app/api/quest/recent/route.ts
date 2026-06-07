// GET /api/quest/recent — questy zalogowanego gracza z bazy.
// Zwraca:
//  - today: dzisiejszy quest (wg CET) lub null — UI pokazuje go zamiast przycisku
//    generowania (twardy limit 1/dzień widoczny po stronie klienta),
//  - recent: do 5 ostatnich questów (malejąco po dacie) do panelu "Ostatnie questy".
// Dane publiczne — bez tokenów.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import { cetDayStart, relativeQuestDate } from "@/lib/date";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await getServerAuth(req);
  if (!auth?.login) {
    return NextResponse.json({ today: null, recent: [] });
  }

  const quests = await prisma.quest.findMany({
    where: { user: { githubLogin: auth.login } },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Dzisiejszy quest = najnowszy, którego dzień CET równa się dzisiejszemu.
  const top = quests[0];
  const today =
    top && top.date.getTime() === cetDayStart().getTime()
      ? {
          title: top.title,
          repoName: top.repoName,
          repoUrl: top.repoUrl ?? "",
          questFileUrl: top.questMdUrl ?? "",
          fileUploaded: Boolean(top.questMdUrl),
        }
      : null;

  const recent = quests.map((q) => ({
    id: q.id,
    title: q.title,
    repoName: q.repoName,
    repoUrl: q.repoUrl ?? "",
    relativeDate: relativeQuestDate(q.date),
  }));

  return NextResponse.json({ today, recent });
}
