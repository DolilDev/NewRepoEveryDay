// Model repo-kontenera: JEDNO publiczne repo na użytkownika (NERD-NewEveryDayRepo),
// w którym każdy quest to osobny PODFOLDER. Ten moduł trzyma stałą nazwę kontenera,
// zapewnia jego istnienie i składa adresy URL folderów/plików.
// UWAGA: tylko po stronie serwera — używa tokenu GitHub.
import { getRepo, createRepo, putFile } from "@/lib/github";

// Stała nazwa repo-kontenera — jedno na użytkownika. Spójna z scripts/db-reset.mjs.
export const CONTAINER_REPO = "NERD-NewEveryDayRepo";

const CONTAINER_DESCRIPTION =
  "Kolekcja codziennych questów z NERD — New Every Day Repo. Każdy quest to osobny podfolder.";

// Bazowy README zakładany przy TWORZENIU kontenera. Część 6 nadpisuje go
// automatycznym spisem questów (tabelą), więc to tylko treść startowa.
const SEED_README = `# NERD - New Every Day Repo

Kolekcja codziennych questów z aplikacji NERD. Każdy quest to osobny podfolder
zawierający plik \`QUEST.md\` (instrukcję zadania) oraz Twoje rozwiązanie.
`;

export type Container = { owner: string; defaultBranch: string; htmlUrl: string };

// Zapewnia istnienie repo-kontenera dla danego użytkownika:
//  - jeśli ISTNIEJE → zwraca jego dane (użyj istniejącego),
//  - jeśli NIE MA (404) → tworzy publiczne repo i zakłada bazowy README
//    (pierwszy commit tworzy gałąź domyślną).
// Rzuca czytelnym błędem przy twardym problemie z GitHubem.
export async function ensureContainer(
  accessToken: string,
  login: string,
): Promise<Container> {
  const fallbackUrl = `https://github.com/${login}/${CONTAINER_REPO}`;

  const existing = await getRepo(accessToken, login, CONTAINER_REPO);
  if (existing.ok) {
    return {
      owner: existing.owner || login,
      defaultBranch: existing.defaultBranch,
      htmlUrl: existing.htmlUrl || fallbackUrl,
    };
  }
  if (existing.status !== 404) {
    throw new Error(
      `Nie udało się sprawdzić repo-kontenera (GitHub ${existing.status}).`,
    );
  }

  const created = await createRepo(accessToken, CONTAINER_REPO, CONTAINER_DESCRIPTION);
  if (!created.ok) {
    // 422 = repo jednak istnieje (np. wyścig równoległych żądań) → odczytaj je.
    if (created.alreadyExists) {
      const again = await getRepo(accessToken, login, CONTAINER_REPO);
      if (again.ok) {
        return {
          owner: again.owner || login,
          defaultBranch: again.defaultBranch,
          htmlUrl: again.htmlUrl || fallbackUrl,
        };
      }
    }
    throw new Error(
      `Nie udało się utworzyć repo-kontenera (GitHub ${created.status}): ${created.message}`,
    );
  }

  const owner = created.owner || login;
  // Pierwszy commit: bazowy README (zakłada gałąź domyślną w pustym repo).
  await putFile(
    accessToken,
    owner,
    CONTAINER_REPO,
    "README.md",
    "Inicjalizacja repo-kontenera NERD",
    SEED_README,
  );
  return {
    owner,
    defaultBranch: created.defaultBranch || "main",
    htmlUrl: created.htmlUrl || `https://github.com/${owner}/${CONTAINER_REPO}`,
  };
}

// Adres folderu questa na GitHubie (widok drzewa katalogu).
export function folderUrlFor(
  htmlUrl: string,
  branch: string,
  folderName: string,
): string {
  return `${htmlUrl}/tree/${branch}/${folderName}`;
}

// Adres pliku QUEST.md wewnątrz folderu questa.
export function questMdUrlFor(
  htmlUrl: string,
  branch: string,
  folderName: string,
): string {
  return `${htmlUrl}/blob/${branch}/${folderName}/QUEST.md`;
}
