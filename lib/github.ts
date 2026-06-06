// Serwerowy helper do GitHub REST API.
// UWAGA: ten moduł jest wywoływany WYŁĄCZNIE po stronie serwera (callback NextAuth).
// Token dostępu nigdy nie jest zwracany ani wysyłany do przeglądarki.

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
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DailyQuest",
      },
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
