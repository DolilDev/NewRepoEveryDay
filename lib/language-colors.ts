// Kolory języków programowania jak na GitHubie (podzbiór z projektu linguist).
// Używane do kropki języka przy repozytoriach questowych.
//
// Zasada: jeśli język jest znany z GitHub API, pokazujemy kropkę — w kolorze z
// mapy, a dla języka spoza mapy w neutralnej szarości. Gdy języka NIE udało się
// ustalić (null), kropki nie pokazujemy w ogóle (patrz komponent LanguageDot).

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

// Neutralny kolor dla języka znanego, ale spoza mapy — GitHub też pokazuje wtedy
// szarą kropkę zamiast jej ukrywać.
const DEFAULT_COLOR = "#8b949e";

// Kolor kropki dla danego języka. Zawsze zwraca kolor (gdy język jest znany);
// o tym, czy w ogóle pokazać kropkę, decyduje komponent na podstawie null/obecności.
export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? DEFAULT_COLOR;
}
