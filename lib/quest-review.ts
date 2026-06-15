// Collecting material for quest evaluation (Stage B, part 1) — container repo model.
// NOTE: server-side only — uses the GitHub token.
//
// A quest is a SUBFOLDER in the container repo, so we evaluate ONLY the contents of
// that one folder (not the whole repo). Rule: {folder}/QUEST.md is the starting state
// (system instructions). The user's contribution is EVERYTHING other than QUEST.md
// inside the folder. We filter out build products, dependencies, lockfiles, binaries
// and files >100KB, because that is not the user's work and would only clutter the
// model's context.

import {
  fetchRepoMeta,
  fetchRepoTree,
  fetchBlobText,
  type RepoTreeEntry,
} from "@/lib/github";
import { baseName, ext } from "@/lib/path";

const MAX_FILE_BYTES = 100 * 1024; // we skip individual files >100KB
const CODE_BUDGET = 60_000; // total character limit for code file content
const MAX_CODE_FILES = 100; // upper limit on the number of fetched files (safeguard)

// Directories that are build products / dependencies — not the user's work.
const JUNK_DIRS = new Set([
  "node_modules",
  "target",
  "build",
  "dist",
  "out",
  ".next",
  ".git",
  "vendor",
  "bin",
  "obj",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
  ".gradle",
  "pods",
  ".dart_tool",
  ".cache",
]);

// Lockfiles — generated automatically.
const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "cargo.lock",
  "poetry.lock",
  "composer.lock",
  "gemfile.lock",
  "go.sum",
  "pubspec.lock",
  "packages.lock.json",
  "flake.lock",
]);

// Binary / non-text extensions — we do not send these to the model.
const BINARY_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "ico",
  "webp",
  "tif",
  "tiff",
  "ttf",
  "otf",
  "woff",
  "woff2",
  "eot",
  "mp3",
  "wav",
  "ogg",
  "flac",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "zip",
  "tar",
  "gz",
  "tgz",
  "bz2",
  "7z",
  "rar",
  "xz",
  "exe",
  "dll",
  "so",
  "dylib",
  "bin",
  "o",
  "a",
  "class",
  "jar",
  "wasm",
  "pyc",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "sqlite",
  "db",
  "ds_store",
  "lock",
]);

// Extensions treated as code (prioritized when fitting into the character limit).
const CODE_EXT = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "rs",
  "go",
  "c",
  "h",
  "cpp",
  "hpp",
  "cc",
  "cs",
  "java",
  "kt",
  "kts",
  "swift",
  "rb",
  "php",
  "scala",
  "clj",
  "ex",
  "exs",
  "erl",
  "hs",
  "ml",
  "zig",
  "nim",
  "dart",
  "lua",
  "r",
  "jl",
  "sh",
  "bash",
  "ps1",
  "sql",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "vue",
  "svelte",
  "astro",
]);

function isJunk(path: string): boolean {
  const segs = path.toLowerCase().split("/");
  if (segs.some((s) => JUNK_DIRS.has(s))) return true;
  return LOCKFILES.has(baseName(path).toLowerCase());
}

function isBinary(path: string): boolean {
  return BINARY_EXT.has(ext(path));
}

// 0 = code (first), 1 = remaining text (configuration, etc.).
function priority(path: string): number {
  return CODE_EXT.has(ext(path)) ? 0 : 1;
}

export type RepoMaterial =
  | { ok: true; hasUserWork: boolean; material: string }
  | { ok: false; error: string };

// Fetches and assembles the material for evaluating a quest FOLDER in the container repo.
// hasUserWork=false means a folder with only QUEST.md (or only junk) —
// in that case there is no point calling the model (an immediate failed verdict).
export async function collectFolderMaterial(
  accessToken: string,
  owner: string,
  repo: string,
  folderName: string,
): Promise<RepoMaterial> {
  const meta = await fetchRepoMeta(accessToken, owner, repo);
  if (!meta)
    return { ok: false, error: "Could not read the container repo from GitHub." };

  const tree = await fetchRepoTree(accessToken, owner, repo, meta.defaultBranch);
  if (!tree)
    return { ok: false, error: "Could not fetch the container repo's file tree." };

  // Narrow down to files ONLY from this quest's folder.
  const prefix = `${folderName}/`;
  const inFolder = tree.filter((e) => e.path.startsWith(prefix));
  // Relative path within the folder — for junk filters and readable display.
  const rel = (p: string) => p.slice(prefix.length);

  const questPath = `${prefix}QUEST.md`;
  const questEntry = inFolder.find((e) => e.path === questPath);
  const readmeEntry = inFolder.find((e) => rel(e.path).toLowerCase() === "readme.md");

  // User's work = everything in the folder except QUEST.md, without junk/binaries/oversized.
  const meaningful: RepoTreeEntry[] = inFolder.filter(
    (e) =>
      e.path !== questPath &&
      !isJunk(rel(e.path)) &&
      !isBinary(e.path) &&
      e.size <= MAX_FILE_BYTES,
  );

  if (meaningful.length === 0) {
    return { ok: true, hasUserWork: false, material: "" };
  }

  // QUEST.md (system instructions) and README.md (user's work) — separately.
  const questMd = questEntry
    ? await fetchBlobText(accessToken, owner, repo, questEntry.sha)
    : null;
  const readme = readmeEntry
    ? await fetchBlobText(accessToken, owner, repo, readmeEntry.sha)
    : null;

  // Content files to evaluate — excluding README (shown separately). Code first.
  const codeFiles = meaningful
    .filter((e) => !readmeEntry || e.path !== readmeEntry.path)
    .sort((a, b) => priority(a.path) - priority(b.path) || a.path.localeCompare(b.path))
    .slice(0, MAX_CODE_FILES);

  const parts: string[] = [];
  let budget = CODE_BUDGET;
  for (const f of codeFiles) {
    if (budget <= 0) break;
    const text = await fetchBlobText(accessToken, owner, repo, f.sha);
    if (text === null) continue;
    let slice = text;
    let truncated = false;
    if (slice.length > budget) {
      slice = slice.slice(0, budget);
      truncated = true;
    }
    budget -= slice.length;
    parts.push(
      `--- ${rel(f.path)} ---\n${slice}${truncated ? "\n…(file truncated)" : ""}`,
    );
  }

  const treeList = meaningful.map((e) => `- ${rel(e.path)} (${e.size} B)`).join("\n");

  const material = [
    "=== Context ===",
    `Quest folder: ${folderName} (in the container repo, public: ${meta.isPrivate ? "no" : "yes"})`,
    "Evaluate ONLY the contents of this folder.",
    "",
    "=== QUEST.md (system instructions — STARTING STATE, NOT the user's work) ===",
    questMd?.trim() || "(no QUEST.md file)",
    "",
    "=== README.md (user's work) ===",
    readme?.trim() || "(no README.md file)",
    "",
    "=== Files in the folder (after filtering out junk) ===",
    treeList || "(none)",
    "",
    "=== File content (user's work) ===",
    parts.join("\n\n") || "(no text files to show)",
  ].join("\n");

  return { ok: true, hasUserWork: true, material };
}
