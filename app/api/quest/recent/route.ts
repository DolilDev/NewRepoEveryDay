// GET /api/quest/recent — the signed-in player's quests from the database.
// Returns:
//  - today: today's quest (in CET) or null — the UI shows it instead of the
//    generate button (the hard 1/day limit visible on the client side),
//  - recent: up to the 5 most recent quests (descending by date) for the "Recent quests" panel.
// Public data — no tokens.
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

  // Today's quest = the most recent one whose CET day equals today's.
  const top = quests[0];
  const today =
    top && top.date.getTime() === cetDayStart().getTime()
      ? {
          title: top.title,
          folderName: top.folderName,
          folderUrl: top.folderUrl ?? "",
          questFileUrl: top.questMdUrl ?? "",
          fileUploaded: Boolean(top.questMdUrl),
          status: top.status, // PENDING / PASSED — decides whether the quest is completed
        }
      : null;

  const recent = quests.map((q) => ({
    id: q.id,
    title: q.title,
    folderName: q.folderName,
    folderUrl: q.folderUrl ?? "",
    relativeDate: relativeQuestDate(q.date),
  }));

  return NextResponse.json({ today, recent });
}
