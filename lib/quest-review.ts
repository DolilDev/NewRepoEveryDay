// Zbieranie materiału do oceny questa (Etap B, część 1) — model repo-kontenera.
// UWAGA: tylko po stronie serwera — używa tokenu GitHub.
//
// Quest to PODFOLDER w repo-kontenerze, więc oceniamy WYŁĄCZNIE zawartość tego
// jednego folderu (nie całego repo). Zasada: {folder}/QUEST.md to stan startowy
// (instrukcja systemu). Wkładem użytkownika jest WSZYSTKO poza QUEST.md wewnątrz
// folderu. Odfiltrowujemy produkty budowania, zależności, lockfile'y, binaria i
// pliki >100KB, bo to nie jest praca użytkownika i tylko zaśmieciłoby kontekst modelu.

import {
  fetchRepoMeta,
  fetchRepoTree,
  fetchBlobText,
  type RepoTreeEntry,
} from "@/lib/github";

const MAX_FILE_BYTES = 100 * 1024; // pomijamy pojedyncze pliki >100KB
const CODE_BUDGET = 60_000; // łączny limit znaków treści plików z kodem
const MAX_CODE_FILES = 100; // górny limit liczby pobieranych plików (ochrona)

// Katalogi będące produktami budowania / zależnościami — nie wkład użytkownika.
const JUNK_DIRS = new Set([
  "node_modules", "target", "build", "dist", "out", ".next", ".git",
  "vendor", "bin", "obj", "coverage", "__pycache__", ".venv", "venv",
  ".idea", ".vscode", ".gradle", "pods", ".dart_tool", ".cache",
]);

// Lockfile'y — generowane automatycznie.
const LOCKFILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json",
  "cargo.lock", "poetry.lock", "composer.lock", "gemfile.lock", "go.sum",
  "pubspec.lock", "packages.lock.json", "flake.lock",
]);

// Rozszerzenia binarne / nietekstowe — nie wysyłamy do modelu.
const BINARY_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "bmp", "ico", "webp", "tif", "tiff",
  "ttf", "otf", "woff", "woff2", "eot",
  "mp3", "wav", "ogg", "flac", "mp4", "mov", "avi", "mkv", "webm",
  "zip", "tar", "gz", "tgz", "bz2", "7z", "rar", "xz",
  "exe", "dll", "so", "dylib", "bin", "o", "a", "class", "jar", "wasm", "pyc",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "sqlite", "db", "ds_store", "lock",
]);

// Rozszerzenia traktowane jako kod (priorytet przy doborze do limitu znaków).
const CODE_EXT = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rs", "go", "c", "h", "cpp",
  "hpp", "cc", "cs", "java", "kt", "kts", "swift", "rb", "php", "scala", "clj",
  "ex", "exs", "erl", "hs", "ml", "zig", "nim", "dart", "lua", "r", "jl",
  "sh", "bash", "ps1", "sql", "html", "css", "scss", "sass", "less",
  "vue", "svelte", "astro",
]);

function baseName(path: string): string {
  return path.split("/").pop() ?? path;
}

function ext(path: string): string {
  const b = baseName(path);
  const i = b.lastIndexOf(".");
  return i >= 0 ? b.slice(i + 1).toLowerCase() : "";
}

function isJunk(path: string): boolean {
  const segs = path.toLowerCase().split("/");
  if (segs.some((s) => JUNK_DIRS.has(s))) return true;
  return LOCKFILES.has(baseName(path).toLowerCase());
}

function isBinary(path: string): boolean {
  return BINARY_EXT.has(ext(path));
}

// 0 = kod (najpierw), 1 = pozostały tekst (konfiguracja itp.).
function priority(path: string): number {
  return CODE_EXT.has(ext(path)) ? 0 : 1;
}

export type RepoMaterial =
  | { ok: true; hasUserWork: boolean; material: string }
  | { ok: false; error: string };

// Pobiera i składa materiał do oceny FOLDERU questa w repo-kontenerze.
// hasUserWork=false oznacza folder z samym QUEST.md (lub samymi śmieciami) —
// wtedy nie ma sensu wołać modelu (od razu werdykt niezaliczony).
export async function collectFolderMaterial(
  accessToken: string,
  owner: string,
  repo: string,
  folderName: string,
): Promise<RepoMaterial> {
  const meta = await fetchRepoMeta(accessToken, owner, repo);
  if (!meta) return { ok: false, error: "Nie udało się odczytać repo-kontenera z GitHuba." };

  const tree = await fetchRepoTree(accessToken, owner, repo, meta.defaultBranch);
  if (!tree) return { ok: false, error: "Nie udało się pobrać drzewa plików repo-kontenera." };

  // Zawężamy do plików WYŁĄCZNIE z folderu tego questa.
  const prefix = `${folderName}/`;
  const inFolder = tree.filter((e) => e.path.startsWith(prefix));
  // Ścieżka względna w folderze — do filtrów śmieci i czytelnego wyświetlania.
  const rel = (p: string) => p.slice(prefix.length);

  const questPath = `${prefix}QUEST.md`;
  const questEntry = inFolder.find((e) => e.path === questPath);
  const readmeEntry = inFolder.find(
    (e) => rel(e.path).toLowerCase() === "readme.md",
  );

  // Wkład użytkownika = wszystko w folderze poza QUEST.md, bez śmieci/binariów/za dużych.
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

  // QUEST.md (instrukcja systemu) i README.md (praca użytkownika) — osobno.
  const questMd = questEntry
    ? await fetchBlobText(accessToken, owner, repo, questEntry.sha)
    : null;
  const readme = readmeEntry
    ? await fetchBlobText(accessToken, owner, repo, readmeEntry.sha)
    : null;

  // Pliki z treścią do oceny — bez README (pokazany osobno). Najpierw kod.
  const codeFiles = meaningful
    .filter((e) => !readmeEntry || e.path !== readmeEntry.path)
    .sort(
      (a, b) => priority(a.path) - priority(b.path) || a.path.localeCompare(b.path),
    )
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
    parts.push(`--- ${rel(f.path)} ---\n${slice}${truncated ? "\n…(plik skrócony)" : ""}`);
  }

  const treeList = meaningful.map((e) => `- ${rel(e.path)} (${e.size} B)`).join("\n");

  const material = [
    "=== Kontekst ===",
    `Folder questa: ${folderName} (w repo-kontenerze, publiczne: ${meta.isPrivate ? "nie" : "tak"})`,
    "Oceniaj WYŁĄCZNIE zawartość tego folderu.",
    "",
    "=== QUEST.md (instrukcja systemu — STAN STARTOWY, NIE jest pracą użytkownika) ===",
    questMd?.trim() || "(brak pliku QUEST.md)",
    "",
    "=== README.md (praca użytkownika) ===",
    readme?.trim() || "(brak pliku README.md)",
    "",
    "=== Pliki w folderze (po odfiltrowaniu śmieci) ===",
    treeList || "(brak)",
    "",
    "=== Treść plików (praca użytkownika) ===",
    parts.join("\n\n") || "(brak plików tekstowych do pokazania)",
  ].join("\n");

  return { ok: true, hasUserWork: true, material };
}
