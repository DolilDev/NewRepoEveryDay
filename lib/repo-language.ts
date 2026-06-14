// Mapa folderName → język (kolorowa kropka) dla questów w repo-kontenerze.
// W modelu repo-kontenera wszystkie questy są w JEDNYM repo, więc języka nie da
// się wziąć z listy repozytoriów — wyznaczamy go per-FOLDER z drzewa kontenera:
// jeden strzał po drzewo plików, potem dominujące rozszerzenie kodu w folderze.
// Gdy języka nie da się ustalić → brak wpisu (UI pomija kropkę).
// UWAGA: tylko po stronie serwera (czyta token z ciasteczka). Wynik (mapa
// folder→język) zależy WYŁĄCZNIE od zawartości repo-kontenera danego logina, nie
// od oglądającego — więc cache'ujemy go czasowo per login (unstable_cache), żeby
// nie ciągnąć całego drzewa GitHuba przy każdym renderze profilu/dashboardu.
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getRepo, fetchRepoTree } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";
import { CONTAINER_REPO } from "@/lib/container";
import { ext } from "@/lib/path";

// Jak długo (s) trzymać policzone języki folderów zanim odświeżymy z GitHuba.
const REVALIDATE_SECONDS = 300;

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

// Policz dominujący język każdego folderu z drzewa repo-kontenera. Token wpada
// przez domknięcie (NIE jest częścią klucza cache — wynik od niego nie zależy);
// kluczem jest login. Zwraca zwykły obiekt, bo unstable_cache serializuje wynik
// (Map nie przetrwałaby serializacji).
function loadFolderLanguages(token: string) {
  return unstable_cache(
    async (login: string): Promise<Record<string, string | null>> => {
      const result: Record<string, string | null> = {};

      const repo = await getRepo(token, login, CONTAINER_REPO);
      if (!repo.ok) return result;

      const tree = await fetchRepoTree(token, login, CONTAINER_REPO, repo.defaultBranch);
      if (!tree) return result;

      // Zlicz pliki kodu po języku, w obrębie pierwszego segmentu ścieżki (= folder questa).
      const counts = new Map<string, Map<string, number>>();
      for (const e of tree) {
        const slash = e.path.indexOf("/");
        if (slash <= 0) continue; // pliki w korzeniu (np. README kontenera) pomijamy
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
        result[folder] = best;
      }
      return result;
    },
    ["folder-languages"],
    { revalidate: REVALIDATE_SECONDS },
  );
}

// cache() z Reacta dedupuje odczyt ciasteczka i budowę Mapy w obrębie jednego żądania.
export const getFolderLanguages = cache(
  async (login: string): Promise<Map<string, string | null>> => {
    // Pusty token = odczyt publiczny (kontener jest publiczny). Brak ciasteczka
    // też zadziała dla danych publicznych, tylko z niższym limitem zapytań.
    const token = (await getCookieAccessToken()) ?? "";
    const obj = await loadFolderLanguages(token)(login);
    return new Map(Object.entries(obj));
  },
);
