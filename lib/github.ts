// Serwerowy helper do GitHub REST API.
// UWAGA: ten moduł jest wywoływany WYŁĄCZNIE po stronie serwera (callback NextAuth
// oraz API routes). Token dostępu nigdy nie jest zwracany ani wysyłany do przeglądarki.

const GH_API = "https://api.github.com";

// Wspólne nagłówki uwierzytelnione tokenem OAuth użytkownika.
function ghHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DailyQuest",
  };
}

export type GitHubProfile = {
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string | null; // ISO 8601, np. "2011-03-25T18:44:36Z"
};

// Pobiera profil zalogowanego użytkownika (GET /user) jego tokenem OAuth.
// Zwraca null przy błędzie/timeoucie — logowanie nie może się od tego wywalić.
export async function fetchGitHubProfile(
  accessToken: string,
): Promise<GitHubProfile | null> {
  try {
    const res = await fetch(`${GH_API}/user`, {
      headers: ghHeaders(accessToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const u = await res.json();
    return {
      bio: typeof u.bio === "string" && u.bio.trim() ? u.bio : null,
      followers: typeof u.followers === "number" ? u.followers : 0,
      following: typeof u.following === "number" ? u.following : 0,
      publicRepos: typeof u.public_repos === "number" ? u.public_repos : 0,
      createdAt: typeof u.created_at === "string" ? u.created_at : null,
    };
  } catch {
    return null;
  }
}

export type RepoSummary = { name: string; language: string | null };

// Lista repozytoriów użytkownika (do zbudowania profilu pod prompt OpenAI).
// Błąd zwraca pustą listę — generowanie ma działać też bez tych danych.
export async function fetchUserRepos(
  accessToken: string,
): Promise<RepoSummary[]> {
  try {
    const res = await fetch(
      `${GH_API}/user/repos?per_page=100&affiliation=owner&sort=pushed`,
      { headers: ghHeaders(accessToken), cache: "no-store" },
    );
    if (!res.ok) return [];
    const arr = await res.json();
    if (!Array.isArray(arr)) return [];
    return arr.map((r) => ({
      name: typeof r?.name === "string" ? r.name : "",
      language: typeof r?.language === "string" ? r.language : null,
    }));
  } catch {
    return [];
  }
}

// Tekstowe podsumowanie profilu (języki + przykładowe repo) dla modelu.
export function buildProfileSummary(repos: RepoSummary[]): string {
  if (repos.length === 0) {
    return "Użytkownik nie ma jeszcze publicznych repozytoriów. Potraktuj go jako osobę początkującą.";
  }

  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  const langs = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
  const sampleNames = repos
    .map((r) => r.name)
    .filter(Boolean)
    .slice(0, 15);

  return [
    `Używane języki (od najczęstszych): ${langs.length ? langs.join(", ") : "nieokreślone"}.`,
    `Przykładowe repozytoria: ${sampleNames.join(", ") || "brak"}.`,
    `Łączna liczba repozytoriów: ${repos.length}.`,
  ].join("\n");
}

export type CreateRepoResult =
  | {
      ok: true;
      name: string;
      owner: string;
      htmlUrl: string;
      defaultBranch: string;
    }
  | { ok: false; status: number; alreadyExists: boolean; message: string };

// Tworzy PUBLICZNE repo na koncie zalogowanego użytkownika (POST /user/repos).
// Kolizja nazwy zwraca z GitHuba 422 → sygnalizujemy alreadyExists=true.
export async function createRepo(
  accessToken: string,
  name: string,
  description: string,
): Promise<CreateRepoResult> {
  const res = await fetch(`${GH_API}/user/repos`, {
    method: "POST",
    headers: { ...ghHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description: description.slice(0, 350),
      private: false,
      auto_init: false,
      has_issues: true,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return {
      ok: true,
      name: typeof data?.name === "string" ? data.name : name,
      owner: typeof data?.owner?.login === "string" ? data.owner.login : "",
      htmlUrl: typeof data?.html_url === "string" ? data.html_url : "",
      defaultBranch:
        typeof data?.default_branch === "string" ? data.default_branch : "main",
    };
  }

  let message = `GitHub ${res.status}`;
  try {
    const err = await res.json();
    if (typeof err?.message === "string") message = err.message;
  } catch {
    // brak ciała błędu — zostaje komunikat domyślny
  }
  // 422 przy tworzeniu repo to praktycznie zawsze zajęta nazwa.
  return { ok: false, status: res.status, alreadyExists: res.status === 422, message };
}

// Wrzuca plik QUEST.md do repo (PUT /repos/{owner}/{repo}/contents/QUEST.md).
// Dla świeżego, pustego repo tworzy pierwszy commit i gałąź domyślną.
export async function putQuestFile(
  accessToken: string,
  owner: string,
  repo: string,
  markdown: string,
): Promise<boolean> {
  const content = Buffer.from(markdown, "utf-8").toString("base64");
  const res = await fetch(
    `${GH_API}/repos/${owner}/${repo}/contents/QUEST.md`,
    {
      method: "PUT",
      headers: { ...ghHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Dodaj QUEST.md — instrukcja dzisiejszego questa",
        content,
      }),
    },
  );
  return res.ok;
}
