// Shared file path helpers — used in quest evaluation (lib/quest-review.ts)
// and determining a folder's language (lib/repo-language.ts).

// File name from a path (the last segment).
export function baseName(path: string): string {
  return path.split("/").pop() ?? path;
}

// File extension, lowercase, without the dot ("" when there is no extension).
export function ext(path: string): string {
  const b = baseName(path);
  const i = b.lastIndexOf(".");
  return i >= 0 ? b.slice(i + 1).toLowerCase() : "";
}
