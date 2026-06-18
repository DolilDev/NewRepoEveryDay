// Shared, dependency-light language detection for the container repo.
// Used both by the UI (lib/repo-language.ts → the colored language dot) and by the
// container README index (lib/container.ts → the "Stack" column). Kept free of any
// React/Next imports so the README mutation path doesn't pull in caching machinery.
import { ext } from "@/lib/path";

// File extension → language name (matching the color map in language-colors.ts).
export const EXT_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  go: "Go",
  java: "Java",
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++",
  hh: "C++",
  cs: "C#",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  kts: "Kotlin",
  dart: "Dart",
  scala: "Scala",
  ex: "Elixir",
  exs: "Elixir",
  clj: "Clojure",
  cljs: "Clojure",
  hs: "Haskell",
  lua: "Lua",
  sh: "Shell",
  bash: "Shell",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "SCSS",
  vue: "Vue",
  svelte: "Svelte",
  astro: "Astro",
  zig: "Zig",
  nim: "Nim",
  jl: "Julia",
  r: "R",
  ml: "OCaml",
  mli: "OCaml",
  erl: "Erlang",
  sol: "Solidity",
  pl: "Perl",
  ps1: "PowerShell",
  cr: "Crystal",
  ipynb: "Jupyter Notebook",
};

// From a flat repo tree, rank each quest folder's languages by how many code files
// use them (most files first). The folder = the first path segment; files in the
// repo root (e.g. the container README) are ignored. Returns up to `max` languages
// per folder — the dominant one first — which together read as the folder's STACK.
// A folder with no recognised code files gets no entry (the caller shows nothing).
export function folderStacksFromTree(
  tree: ReadonlyArray<{ path: string }>,
  max = 3,
): Record<string, string[]> {
  // folder → (language → file count)
  const counts = new Map<string, Map<string, number>>();
  for (const e of tree) {
    const slash = e.path.indexOf("/");
    if (slash <= 0) continue; // skip files in the root (e.g. the container README)
    const folder = e.path.slice(0, slash);
    const lang = EXT_LANGUAGE[ext(e.path)];
    if (!lang) continue;
    let m = counts.get(folder);
    if (!m) {
      m = new Map();
      counts.set(folder, m);
    }
    m.set(lang, (m.get(lang) ?? 0) + 1);
  }

  const result: Record<string, string[]> = {};
  for (const [folder, m] of counts) {
    result[folder] = [...m.entries()]
      .sort((a, b) => b[1] - a[1]) // most files first
      .slice(0, max)
      .map(([lang]) => lang);
  }
  return result;
}
