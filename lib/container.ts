// Container-repo model: ONE public repo per user (NERD-NewEveryDayRepo),
// in which every quest is a separate SUBFOLDER. This module holds the fixed
// container name, ensures it exists, and builds the folder/file URLs.
// NOTE: server-side only — it uses the GitHub token.
import { getRepo, createRepo, putFile, getFileSha } from "@/lib/github";
import { prisma } from "@/lib/prisma";

// Fixed container-repo name — one per user. Kept in sync with scripts/db-reset.mjs.
export const CONTAINER_REPO = "NERD-NewEveryDayRepo";

// Base URL of the deployed NERD app — used to build the public profile link.
const APP_URL = "https://newrepoeveryday.vercel.app";

const CONTAINER_DESCRIPTION =
  "A collection of daily quests from NERD — New Every Day Repo. Each quest is a separate subfolder.";

// Header link to the public NERD profile page — placed at the very top of the README.
function profileLink(login: string): string {
  const url = `${APP_URL}/profile/${login}`;
  return `🔗 **My NERD profile:** [${url}](${url})`;
}

// Base README created when the container is FIRST set up. Part 6 overwrites it
// with the automatic quest index (a table), so this is just the starting content.
function seedReadme(login: string): string {
  return `# NERD - New Every Day Repo

${profileLink(login)}

A collection of daily quests from the NERD app. Each quest is a separate subfolder
containing a \`QUEST.md\` file (the task brief) and your solution.
`;
}

export type Container = { owner: string; defaultBranch: string; htmlUrl: string };

// Ensures the container repo exists for the given user:
//  - if it EXISTS → returns its data (reuse the existing one),
//  - if it does NOT (404) → creates a public repo and seeds the base README
//    (the first commit creates the default branch).
// Throws a readable error on a hard GitHub problem.
export async function ensureContainer(
  accessToken: string,
  login: string,
): Promise<Container> {
  const fallbackUrl = `https://github.com/${login}/${CONTAINER_REPO}`;

  const existing = await getRepo(accessToken, login, CONTAINER_REPO);
  if (existing.ok) {
    return {
      owner: existing.owner || login,
      defaultBranch: existing.defaultBranch,
      htmlUrl: existing.htmlUrl || fallbackUrl,
    };
  }
  if (existing.status !== 404) {
    throw new Error(`Failed to check the container repo (GitHub ${existing.status}).`);
  }

  const created = await createRepo(accessToken, CONTAINER_REPO, CONTAINER_DESCRIPTION);
  if (!created.ok) {
    // 422 = the repo exists after all (e.g. a race between parallel requests) → read it.
    if (created.alreadyExists) {
      const again = await getRepo(accessToken, login, CONTAINER_REPO);
      if (again.ok) {
        return {
          owner: again.owner || login,
          defaultBranch: again.defaultBranch,
          htmlUrl: again.htmlUrl || fallbackUrl,
        };
      }
    }
    throw new Error(
      `Failed to create the container repo (GitHub ${created.status}): ${created.message}`,
    );
  }

  const owner = created.owner || login;
  // First commit: the base README (creates the default branch in the empty repo).
  await putFile(
    accessToken,
    owner,
    CONTAINER_REPO,
    "README.md",
    "Initialize the NERD container repo",
    seedReadme(login),
  );
  return {
    owner,
    defaultBranch: created.defaultBranch || "main",
    htmlUrl: created.htmlUrl || `https://github.com/${owner}/${CONTAINER_REPO}`,
  };
}

// URL of a quest folder on GitHub (directory tree view).
export function folderUrlFor(
  htmlUrl: string,
  branch: string,
  folderName: string,
): string {
  return `${htmlUrl}/tree/${branch}/${folderName}`;
}

// URL of the QUEST.md file inside a quest folder.
export function questMdUrlFor(
  htmlUrl: string,
  branch: string,
  folderName: string,
): string {
  return `${htmlUrl}/blob/${branch}/${folderName}/QUEST.md`;
}

// --- Part 6: automatic container README (quest index) -----------------------

type ReadmeQuest = {
  title: string;
  why: string;
  folderName: string | null;
  status: string; // QuestStatus: PENDING / PASSED / FAILED
};

// Sanitizes text for a markdown table cell: collapses newlines and escapes `|`.
function cell(text: string): string {
  return text
    .replace(/\r?\n+/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

// Short quest description for the "Description" column: first sentence of `why`
// (fallback: the title), trimmed to a reasonable length.
function shortDescription(q: ReadmeQuest): string {
  const src = (q.why || q.title || "").replace(/\s+/g, " ").trim();
  const m = src.match(/^(.+?[.!?])(\s|$)/);
  let s = (m ? m[1] : src).trim() || q.title.trim();
  if (s.length > 140) s = `${s.slice(0, 139).trimEnd()}…`;
  return s;
}

// Builds the ENTIRE container README from the current quest state (a plain string,
// assembled by the app — NOT by OpenAI). Quests are passed newest-first.
// The README is regenerated in full, so there are never any duplicates.
export function buildContainerReadme(quests: ReadmeQuest[], login: string): string {
  const header = [
    "# NERD - New Every Day Repo",
    "",
    profileLink(login),
    "",
    "A collection of daily quests from the NERD app — one quest per day, each in" +
      " its own subfolder with a `QUEST.md` file (the brief) and your solution.",
    "",
  ];

  if (quests.length === 0) {
    return [
      ...header,
      "_No quests yet — generate your first one in the NERD app._",
      "",
    ].join("\n");
  }

  const rows = quests.map((q) => {
    const status = q.status === "PASSED" ? "✅" : "⏳";
    const folder = q.folderName
      ? `[${cell(q.folderName)}](./${encodeURI(q.folderName)})`
      : "—";
    return `| ${status} | ${cell(q.title)} | ${cell(shortDescription(q))} | ${folder} |`;
  });

  return [
    ...header,
    "| Status | Quest | Description | Folder |",
    "| :----: | ----- | ----------- | ------ |",
    ...rows,
    "",
    "---",
    "_Index generated automatically by NERD whenever a quest is added or passed._",
    "",
  ].join("\n");
}

// Regenerates and OVERWRITES the given user's container README with the current
// quest index from the database. Best-effort: an error (no container, GitHub
// problem) returns false and must NOT break the quest generation/evaluation that
// calls it.
export async function regenerateContainerReadme(
  accessToken: string,
  login: string,
): Promise<boolean> {
  try {
    const repo = await getRepo(accessToken, login, CONTAINER_REPO);
    if (!repo.ok) return false;
    const owner = repo.owner || login;

    const quests = await prisma.quest.findMany({
      where: { user: { githubLogin: login } },
      orderBy: { date: "desc" },
      select: { title: true, why: true, folderName: true, status: true },
    });

    const markdown = buildContainerReadme(quests, login);
    // Overwriting the existing README requires its sha (missing → creates a new one).
    const sha = await getFileSha(
      accessToken,
      owner,
      CONTAINER_REPO,
      "README.md",
      repo.defaultBranch,
    );
    return await putFile(
      accessToken,
      owner,
      CONTAINER_REPO,
      "README.md",
      "Update the quest index in the README",
      markdown,
      sha,
    );
  } catch {
    return false;
  }
}
