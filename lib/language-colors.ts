// Programming language colors as on GitHub (a subset from the linguist project).
// Used for the language dot next to quest repositories.
//
// Rule: if the language is known from the GitHub API, we show the dot — in the
// color from the map, and in neutral gray for a language not in the map. When the
// language could NOT be determined (null), we don't show the dot at all (see the
// LanguageDot component).

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Clojure: "#db5855",
  Haskell: "#5e5086",
  Lua: "#000080",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Astro: "#ff5a03",
  Zig: "#ec915c",
  Nim: "#ffc200",
  Julia: "#a270ba",
  R: "#198CE7",
  OCaml: "#3be133",
  Erlang: "#B83998",
  "Objective-C": "#438eff",
  Perl: "#0298c3",
  PowerShell: "#012456",
  Solidity: "#AA6746",
  Crystal: "#000100",
  "Jupyter Notebook": "#DA5B0B",
};

// Neutral color for a language that is known but not in the map — GitHub also shows
// a gray dot in that case instead of hiding it.
const DEFAULT_COLOR = "#8b949e";

// The dot color for a given language. Always returns a color (when the language is
// known); whether to show the dot at all is decided by the component based on null/presence.
export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? DEFAULT_COLOR;
}
