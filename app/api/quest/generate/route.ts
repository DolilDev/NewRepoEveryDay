// POST /api/quest/generate — server-side quest generation flow in the
// CONTAINER-REPO model: 1) generate the quest (OpenAI), 2) make sure the
// NERD-NewEveryDayRepo repo exists (one per user), 3) create the quest SUBFOLDER with QUEST.md.
// The GitHub token and the OpenAI key are used ONLY here — they never return to the browser.
import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/auth-token";
import { fetchUserRepos, buildProfileSummary, pathExists, putFile } from "@/lib/github";
import { generateQuest, generateFolderName, buildQuestMarkdown } from "@/lib/openai";
import {
  ensureContainer,
  folderUrlFor,
  questMdUrlFor,
  regenerateContainerReadme,
  CONTAINER_REPO,
} from "@/lib/container";
import { prisma } from "@/lib/prisma";
import { upsertUser } from "@/lib/user";
import { cetDayStart } from "@/lib/date";

export const runtime = "nodejs";

const MAX_NAME_ATTEMPTS = 4;

export async function POST(req: Request) {
  const authData = await getServerAuth(req);
  if (!authData) {
    return NextResponse.json(
      { error: "You are not signed in. Sign in with GitHub." },
      { status: 401 },
    );
  }
  const { accessToken, login } = authData;
  if (!login) {
    return NextResponse.json(
      { error: "Missing GitHub login in the session. Sign in again." },
      { status: 401 },
    );
  }

  try {
    // 0) Hard limit of 1/day (in CET). The database is the source of truth: if today's
    // quest already exists, we do NOT call OpenAI and do NOT touch GitHub — we return the existing one.
    const existing = await prisma.quest.findFirst({
      where: { user: { githubLogin: login }, date: cetDayStart() },
    });
    if (existing) {
      return NextResponse.json({
        alreadyGenerated: true,
        title: existing.title,
        folderName: existing.folderName,
        folderUrl: existing.folderUrl ?? "",
        questFileUrl: existing.questMdUrl ?? "",
        fileUploaded: Boolean(existing.questMdUrl),
      });
    }

    // 1) User profile → quest from OpenAI.
    const repos = await fetchUserRepos(accessToken);
    const summary = buildProfileSummary(repos);
    const quest = await generateQuest(summary);

    // 2) Container repo: create once (public, with README) or use the existing one.
    const container = await ensureContainer(accessToken, login);

    // 3) A free folder name. Collision (folder already exists) → we ask the model for a different slug.
    const taken: string[] = [];
    let folderName = quest.folderName;
    let resolved = false;
    for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
      const exists = await pathExists(
        accessToken,
        container.owner,
        CONTAINER_REPO,
        folderName,
        container.defaultBranch,
      );
      if (!exists) {
        resolved = true;
        break;
      }
      taken.push(folderName);
      folderName = await generateFolderName(quest.title, taken);
    }
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "Failed to find a free folder name after several attempts. Please try again.",
        },
        { status: 409 },
      );
    }

    // 4) Creating the quest folder = uploading QUEST.md to {folderName}/QUEST.md.
    const markdown = buildQuestMarkdown(quest);
    const fileUploaded = await putFile(
      accessToken,
      container.owner,
      CONTAINER_REPO,
      `${folderName}/QUEST.md`,
      "Add QUEST.md — instructions for today's quest",
      markdown,
    );
    const folderUrl = folderUrlFor(
      container.htmlUrl,
      container.defaultBranch,
      folderName,
    );
    const questFileUrl = questMdUrlFor(
      container.htmlUrl,
      container.defaultBranch,
      folderName,
    );

    // 5) Save to the database — ONLY HERE, after the folder and QUEST.md were created successfully.
    // First we make sure the user exists, then we link the quest to them.
    const user = await upsertUser(authData);
    await prisma.quest.create({
      data: {
        userId: user.id,
        date: cetDayStart(), // canonical CET day (key for the 1/day limit)
        title: quest.title,
        folderName,
        why: quest.why,
        instructions: quest.instructions,
        openPart: quest.openPart,
        criteria: quest.criteria, // list of criteria as JSON
        status: "PENDING",
        folderUrl,
        questMdUrl: fileUploaded ? questFileUrl : null,
      },
    });

    // Part 6: regenerate the quest list in the container README (best-effort —
    // it does not break generation if it fails).
    await regenerateContainerReadme(accessToken, login);

    // ONLY public information about the quest folder returns to the browser.
    return NextResponse.json({
      title: quest.title,
      folderName,
      folderUrl,
      questFileUrl,
      fileUploaded,
    });
  } catch (e) {
    // Full error only to the server logs — a generic message to the client.
    console.error("[quest/generate] Generation failed:", e);
    return NextResponse.json(
      { error: "Generation failed. Please try again in a moment." },
      { status: 500 },
    );
  }
}
