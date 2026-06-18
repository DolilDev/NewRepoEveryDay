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

// npm package → display name for the Stack column. Order matters: more specific
// meta-frameworks come first, so a Next.js app reads "Next.js, React" not just "React".
// Detected from a folder's package.json (frameworks can't be told apart from file
// extensions alone — .tsx could be React, Preact, Solid, …).
const NPM_FRAMEWORKS: ReadonlyArray<readonly [dep: string, name: string]> = [
  ["next", "Next.js"],
  ["nuxt", "Nuxt"],
  ["@remix-run/react", "Remix"],
  ["gatsby", "Gatsby"],
  ["@sveltejs/kit", "SvelteKit"],
  ["svelte", "Svelte"],
  ["@angular/core", "Angular"],
  ["react-native", "React Native"],
  ["expo", "Expo"],
  ["@nestjs/core", "NestJS"],
  ["react", "React"],
  ["vue", "Vue"],
  ["solid-js", "SolidJS"],
  ["preact", "Preact"],
  ["astro", "Astro"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["koa", "Koa"],
  ["electron", "Electron"],
  ["vite", "Vite"],
];

// Frameworks/runtime detected from a folder's package.json content. The mere
// presence of a package.json means it's a Node.js project, so "Node.js" is always
// included (last). On malformed JSON we still report Node.js. Frameworks come first,
// in NPM_FRAMEWORKS order; Node.js is appended.
export function frameworksFromPackageJson(text: string): string[] {
  let deps: Record<string, unknown> = {};
  try {
    const pkg = JSON.parse(text) as {
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
    };
    deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  } catch {
    return ["Node.js"]; // unparsable, but it IS a package.json → a Node project
  }

  const found: string[] = [];
  for (const [dep, name] of NPM_FRAMEWORKS) {
    if (dep in deps && !found.includes(name)) found.push(name);
  }
  found.push("Node.js");
  return found;
}

// Final Stack list for a folder: frameworks first (from package.json), then the
// languages detected from file extensions — deduplicated and capped so a single
// cell stays readable (e.g. "Next.js, React, Node.js, TypeScript, CSS").
export function mergeStack(frameworks: string[], languages: string[], max = 5): string[] {
  const out: string[] = [];
  for (const item of [...frameworks, ...languages]) {
    if (item && !out.includes(item)) out.push(item);
    if (out.length >= max) break;
  }
  return out;
}
