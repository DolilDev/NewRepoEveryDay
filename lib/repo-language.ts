// Mapa repoName → język (z GitHub API) dla repozytoriów danego loginu.
// Jeden strzał do GitHuba na profil (lista repo użytkownika z polem language),
// zamiast osobnego zapytania na każde repo. cache() dedupuje w obrębie żądania.
// UWAGA: tylko po stronie serwera (czyta token z ciasteczka).
import { cache } from "react";
import { fetchReposByLogin } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";

export const getRepoLanguages = cache(
  async (login: string): Promise<Map<string, string | null>> => {
    const token = await getCookieAccessToken();
    const repos = await fetchReposByLogin(login, token);
    const map = new Map<string, string | null>();
    for (const r of repos) {
      if (r.name) map.set(r.name, r.language);
    }
    return map;
  },
);
