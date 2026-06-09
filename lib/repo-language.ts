// Mapa folderName → język (kolorowa kropka) dla questów w repo-kontenerze.
// W modelu repo-kontenera wszystkie questy są w JEDNYM repo, więc języka nie da
// się wziąć z listy repozytoriów — wyznaczamy go per-FOLDER z drzewa kontenera:
// jeden strzał po drzewo plików, potem dominujące rozszerzenie kodu w folderze.
// Gdy języka nie da się ustalić → brak wpisu (UI pomija kropkę).
// UWAGA: tylko po stronie serwera (czyta token z ciasteczka). cache() dedupuje w żądaniu.
import { cache } from "react";
import { getRepo, fetchRepoTree } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";
import { CONTAINER_REPO } from "@/lib/container";

// Rozszerzenie pliku → nazwa języka (zgodna z mapą kolorów w language-colors.ts).
const EXT_LANGUAGE: Record<string, string> = {
  ts: "TypeScript", tsx: "TypeScript",
  js: "JavaScript", jsx: "JavaScript", mjs: "JavaScript", cjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  go: "Go",
  java: "Java",
  c: "C", h: "C",
  cpp: "C++", cc: "C++", cxx: "C++", hpp: "C++", hh: "C++",
  cs: "C#",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin", kts: "Kotlin",
  dart: "Dart",
  scala: "Scala",
  ex: "Elixir", exs: "Elixir",
  clj: "Clojure", cljs: "Clojure",
  hs: "Haskell",
  lua: "Lua",
  sh: "Shell", bash: "Shell",
  html: "HTML", htm: "HTML",
  css: "CSS",
  scss: "SCSS", sass: "SCSS",
  vue: "Vue",
  svelte: "Svelte",
  astro: "Astro",
  zig: "Zig",
  nim: "Nim",
  jl: "Julia",
  r: "R",
  ml: "OCaml", mli: "OCaml",
  erl: "Erlang",
  sol: "Solidity",
  pl: "Perl",
  ps1: "PowerShell",
  cr: "Crystal",
  ipynb: "Jupyter Notebook",
};

function extOf(path: string): string {
  const base = path.split("/").pop() ?? path;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
}

export const getFolderLanguages = cache(
  async (login: string): Promise<Map<string, string | null>> => {
    const map = new Map<string, string | null>();
    // Pusty token = odczyt publiczny (kontener jest publiczny). Brak ciasteczka
    // też zadziała dla danych publicznych, tylko z niższym limitem zapytań.
    const token = (await getCookieAccessToken()) ?? "";

    const repo = await getRepo(token, login, CONTAINER_REPO);
    if (!repo.ok) return map;

    const tree = await fetchRepoTree(token, login, CONTAINER_REPO, repo.defaultBranch);
    if (!tree) return map;

    // Zlicz pliki kodu po języku, w obrębie pierwszego segmentu ścieżki (= folder questa).
    const counts = new Map<string, Map<string, number>>();
    for (const e of tree) {
      const slash = e.path.indexOf("/");
      if (slash <= 0) continue; // pliki w korzeniu (np. README kontenera) pomijamy
      const folder = e.path.slice(0, slash);
      const lang = EXT_LANGUAGE[extOf(e.path)];
      if (!lang) continue;
      let m = counts.get(folder);
      if (!m) {
        m = new Map();
        counts.set(folder, m);
      }
      m.set(lang, (m.get(lang) ?? 0) + 1);
    }

    // Dominujący język = najczęstsze rozszerzenie kodu w folderze.
    for (const [folder, m] of counts) {
      let best: string | null = null;
      let bestN = 0;
      for (const [lang, n] of m) {
        if (n > bestN) {
          best = lang;
          bestN = n;
        }
      }
      map.set(folder, best);
    }
    return map;
  },
);
