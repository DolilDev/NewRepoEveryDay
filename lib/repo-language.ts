// Map folderName → language (colored dot) for quests in the container repo.
// In the container-repo model, all quests live in ONE repo, so the language can't
// be taken from a list of repositories — we determine it per-FOLDER from the
// container tree: one shot for the file tree, then the dominant code extension in
// the folder. When the language can't be determined → no entry (the UI skips the dot).
// NOTE: server-side only (reads the token from the cookie). The result (the
// folder→language map) depends ONLY on the contents of a given login's container
// repo, not on the viewer — so we cache it for a time per login (unstable_cache),
// to avoid pulling the entire GitHub tree on every render of the profile/dashboard.
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getRepo, fetchRepoTree } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";
import { CONTAINER_REPO } from "@/lib/container";
import { ext } from "@/lib/path";

// How long (s) to keep the computed folder languages before refreshing from GitHub.
const REVALIDATE_SECONDS = 300;

// File extension → language name (matching the color map in language-colors.ts).
const EXT_LANGUAGE: Record<string, string> = {
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

// Compute the dominant language of each folder from the container repo tree. The
// token comes in via the closure (it is NOT part of the cache key — the result
// doesn't depend on it); the key is the login. Returns a plain object, because
// unstable_cache serializes the result (a Map wouldn't survive serialization).
function loadFolderLanguages(token: string) {
  return unstable_cache(
    async (login: string): Promise<Record<string, string | null>> => {
      const result: Record<string, string | null> = {};

      const repo = await getRepo(token, login, CONTAINER_REPO);
      if (!repo.ok) return result;

      const tree = await fetchRepoTree(token, login, CONTAINER_REPO, repo.defaultBranch);
      if (!tree) return result;

      // Count code files by language, within the first path segment (= the quest folder).
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

      // Dominant language = the most frequent code extension in the folder.
      for (const [folder, m] of counts) {
        let best: string | null = null;
        let bestN = 0;
        for (const [lang, n] of m) {
          if (n > bestN) {
            best = lang;
            bestN = n;
          }
        }
        result[folder] = best;
      }
      return result;
    },
    ["folder-languages"],
    { revalidate: REVALIDATE_SECONDS },
  );
}

// React's cache() dedupes reading the cookie and building the Map within a single request.
export const getFolderLanguages = cache(
  async (login: string): Promise<Map<string, string | null>> => {
    // Empty token = public read (the container is public). A missing cookie also
    // works for public data, just with a lower request rate limit.
    const token = (await getCookieAccessToken()) ?? "";
    const obj = await loadFolderLanguages(token)(login);
    return new Map(Object.entries(obj));
  },
);
