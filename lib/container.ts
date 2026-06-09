// Model repo-kontenera: JEDNO publiczne repo na użytkownika (NERD-NewEveryDayRepo),
// w którym każdy quest to osobny PODFOLDER. Ten moduł trzyma stałą nazwę kontenera,
// zapewnia jego istnienie i składa adresy URL folderów/plików.
// UWAGA: tylko po stronie serwera — używa tokenu GitHub.
import { getRepo, createRepo, putFile, getFileSha } from "@/lib/github";
import { prisma } from "@/lib/prisma";

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

// --- Część 6: automatyczne README kontenera (spis questów) ------------------

type ReadmeQuest = {
  title: string;
  why: string;
  folderName: string | null;
  status: string; // QuestStatus: PENDING / PASSED / FAILED
};

// Zabezpiecza tekst do komórki tabeli markdown: zwija nowe linie i escapuje `|`.
function cell(text: string): string {
  return text.replace(/\r?\n+/g, " ").replace(/\|/g, "\\|").trim();
}

// Krótki opis questa do kolumny „Opis": pierwsze zdanie z `why` (fallback: tytuł),
// przycięte do rozsądnej długości.
function shortDescription(q: ReadmeQuest): string {
  const src = (q.why || q.title || "").replace(/\s+/g, " ").trim();
  const m = src.match(/^(.+?[.!?])(\s|$)/);
  let s = (m ? m[1] : src).trim() || q.title.trim();
  if (s.length > 140) s = `${s.slice(0, 139).trimEnd()}…`;
  return s;
}

// Buduje CAŁĄ treść README kontenera z aktualnego stanu questów (czysty string,
// składany przez aplikację — NIE przez OpenAI). Questy podajemy od najnowszego.
// README jest regenerowane w całości, więc nigdy nie ma duplikatów.
export function buildContainerReadme(quests: ReadmeQuest[]): string {
  const header = [
    "# NERD - New Every Day Repo",
    "",
    "Kolekcja codziennych questów z aplikacji NERD — jeden quest dziennie, każdy w" +
      " osobnym podfolderze z plikiem `QUEST.md` (instrukcją) i Twoim rozwiązaniem.",
    "",
  ];

  if (quests.length === 0) {
    return [
      ...header,
      "_Brak questów — wygeneruj pierwszy w aplikacji NERD._",
      "",
    ].join("\n");
  }

  const rows = quests.map((q) => {
    const status = q.status === "PASSED" ? "✅" : "⏳";
    const folder = q.folderName
      ? `[${cell(q.folderName)}](./${encodeURI(q.folderName)})`
      : "—";
    return `| ${status} | ${cell(q.title)} | ${cell(shortDescription(q))} | ${folder} |`;
  });

  return [
    ...header,
    "| Status | Quest | Opis | Folder |",
    "| :----: | ----- | ---- | ------ |",
    ...rows,
    "",
    "---",
    "_Spis generowany automatycznie przez NERD przy każdym dodaniu i zaliczeniu questa._",
    "",
  ].join("\n");
}

// Regeneruje i NADPISUJE README kontenera danego użytkownika aktualnym spisem
// questów z bazy. Best-effort: błąd (brak kontenera, problem z GitHubem) zwraca
// false i NIE może wywrócić generowania/oceny questa, które ją wołają.
export async function regenerateContainerReadme(
  accessToken: string,
  login: string,
): Promise<boolean> {
  try {
    const repo = await getRepo(accessToken, login, CONTAINER_REPO);
    if (!repo.ok) return false;
    const owner = repo.owner || login;

    const quests = await prisma.quest.findMany({
      where: { user: { githubLogin: login } },
      orderBy: { date: "desc" },
      select: { title: true, why: true, folderName: true, status: true },
    });

    const markdown = buildContainerReadme(quests);
    // Do nadpisania istniejącego README potrzebny jest jego sha (brak → tworzy nowy).
    const sha = await getFileSha(
      accessToken,
      owner,
      CONTAINER_REPO,
      "README.md",
      repo.defaultBranch,
    );
    return await putFile(
      accessToken,
      owner,
      CONTAINER_REPO,
      "README.md",
      "Aktualizuj spis questów w README",
      markdown,
      sha,
    );
  } catch {
    return false;
  }
}
