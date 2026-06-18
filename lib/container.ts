// Container-repo model: ONE public repo per user (NERD-NewEveryDayRepo),
// in which every quest is a separate SUBFOLDER. This module holds the fixed
// container name, ensures it exists, and builds the folder/file URLs.
// NOTE: server-side only — it uses the GitHub token.
import {
  getRepo,
  createRepo,
  putFile,
  getFileSha,
  fetchRepoTree,
  fetchBlobText,
} from "@/lib/github";
import {
  folderStacksFromTree,
  frameworksFromPackageJson,
  mergeStack,
} from "@/lib/languages";
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
  instructions: string;
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

// Description for the "Description" column: an actual summary of WHAT the project is,
// taken from `instructions` (the project brief), not from `why` (the rationale).
// We keep whole sentences — enough to describe the project — and never chop a word
// in half. The first sentence usually states what to build; a second is added only
// if the first is short. A generous cap on a word boundary stops a cell running away.
function projectDescription(q: ReadmeQuest): string {
  const src = (q.instructions || q.why || q.title || "").replace(/\s+/g, " ").trim();
  if (!src) return q.title.trim();

  const sentences = src.match(/[^.!?]+[.!?]+/g) ?? [src];
  const SOFT_MIN = 90; // grow until the description is substantive…
  const HARD_MAX = 300; // …but never let a cell get unwieldy.
  let text = "";
  for (const raw of sentences) {
    const s = raw.trim();
    const next = text ? `${text} ${s}` : s;
    if (text && next.length > HARD_MAX) break; // adding this sentence overflows → stop
    text = next;
    if (text.length >= SOFT_MIN) break; // enough to describe the project
  }
  if (!text) text = sentences[0].trim();

  // Only when a single sentence already exceeds the cap: cut on a word boundary.
  if (text.length > HARD_MAX) {
    const cut = text.slice(0, HARD_MAX);
    const lastSpace = cut.lastIndexOf(" ");
    text = `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
  }
  return text || q.title.trim();
}

// Builds the ENTIRE container README from the current quest state (a plain string,
// assembled by the app — NOT by OpenAI). Quests are passed newest-first.
// `stacks` maps a folderName → the languages actually used in that folder (ranked,
// dominant first), detected from the repo files; folders with no code yet are absent.
// The README is regenerated in full, so there are never any duplicates.
export function buildContainerReadme(
  quests: ReadmeQuest[],
  login: string,
  stacks: Record<string, string[]> = {},
): string {
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
    const stack =
      q.folderName && stacks[q.folderName]?.length
        ? cell(stacks[q.folderName].join(", "))
        : "—";
    return `| ${status} | ${cell(q.title)} | ${cell(projectDescription(q))} | ${stack} | ${folder} |`;
  });

  return [
    ...header,
    "| Status | Quest | Description | Stack | Folder |",
    "| :----: | ----- | ----------- | ----- | ------ |",
    ...rows,
    "",
    "---",
    "_Index generated automatically by NERD whenever a quest is added or passed._",
    "",
  ].join("\n");
}

// Builds the per-folder Stack lists for the README from the container repo tree:
// the languages used (from file extensions) merged with the frameworks/runtime read
// from each folder's package.json (Next.js, React, Node.js, …). package.json files
// are fetched in parallel — one per folder (the shallowest, for nested layouts).
async function detectFolderStacks(
  accessToken: string,
  owner: string,
  tree: ReadonlyArray<{ path: string; sha: string }>,
): Promise<Record<string, string[]>> {
  const langStacks = folderStacksFromTree(tree);

  // The shallowest package.json inside each quest folder → one blob fetch per folder.
  const pkg = new Map<string, { sha: string; depth: number }>();
  for (const e of tree) {
    const slash = e.path.indexOf("/");
    if (slash <= 0 || !e.path.endsWith("/package.json")) continue;
    const folder = e.path.slice(0, slash);
    const depth = e.path.split("/").length;
    const cur = pkg.get(folder);
    if (!cur || depth < cur.depth) pkg.set(folder, { sha: e.sha, depth });
  }

  const frameworks: Record<string, string[]> = {};
  await Promise.all(
    [...pkg].map(async ([folder, { sha }]) => {
      const text = await fetchBlobText(accessToken, owner, CONTAINER_REPO, sha);
      if (text) frameworks[folder] = frameworksFromPackageJson(text);
    }),
  );

  // Frameworks first, then languages, for every folder that has either.
  const stacks: Record<string, string[]> = {};
  for (const folder of new Set([
    ...Object.keys(langStacks),
    ...Object.keys(frameworks),
  ])) {
    stacks[folder] = mergeStack(frameworks[folder] ?? [], langStacks[folder] ?? []);
  }
  return stacks;
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
      select: {
        title: true,
        why: true,
        instructions: true,
        folderName: true,
        status: true,
      },
    });

    // Detect the stack actually used per folder from the container repo tree:
    // languages (file extensions) + frameworks/runtime from package.json.
    // Best-effort: on any failure we just render the README without stacks.
    const tree = await fetchRepoTree(
      accessToken,
      owner,
      CONTAINER_REPO,
      repo.defaultBranch,
    );
    const stacks = tree ? await detectFolderStacks(accessToken, owner, tree) : {};

    const markdown = buildContainerReadme(quests, login, stacks);
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
