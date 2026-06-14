// Wspólne helpery ścieżek plików — używane przy ocenie questa (lib/quest-review.ts)
// i wyznaczaniu języka folderu (lib/repo-language.ts).

// Nazwa pliku ze ścieżki (ostatni segment).
export function baseName(path: string): string {
  return path.split("/").pop() ?? path;
}

// Rozszerzenie pliku, małymi literami, bez kropki ("" gdy brak rozszerzenia).
export function ext(path: string): string {
  const b = baseName(path);
  const i = b.lastIndexOf(".");
  return i >= 0 ? b.slice(i + 1).toLowerCase() : "";
}
