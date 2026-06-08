// Ujednolicone dane profilu DOWOLNEGO użytkownika po loginie GitHub.
// UWAGA: tylko po stronie serwera (czyta bazę i GitHub API tokenem z ciasteczka).
//
// Trzy przypadki, które obsługujemy:
//  1) login istnieje na GitHubie I ma wiersz w naszej bazie (users) → pełny gracz,
//     data dołączenia z users.createdAt (registered = true),
//  2) login istnieje na GitHubie, ale NIE gra u nas (brak wiersza) → pokazujemy
//     dane z GitHuba, ale registered = false (UI pisze „Nie dołączono"),
//  3) login nie istnieje nawet na GitHubie → getProfile zwraca null (UI: „Nie
//     znaleziono użytkownika").
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { fetchPublicProfile } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";

export type ProfileData = {
  login: string; // kanoniczny login GitHub
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  registered: boolean; // czy istnieje wiersz w tabeli users (czy gra u nas)
  joinedAt: Date | null; // users.createdAt (dołączenie do NERD) — null, gdy nie gra
};

// cache() dedupuje wywołanie w obrębie jednego żądania: layout, sidebar i strona
// pytają o ten sam login → jedno zapytanie do GitHuba i bazy.
export const getProfile = cache(
  async (rawLogin: string): Promise<ProfileData | null> => {
    const login = rawLogin.trim();
    if (!login) return null;

    const token = await getCookieAccessToken();
    const gh = await fetchPublicProfile(login, token);
    // Login GitHuba jest case-insensitive — do bazy idziemy kanoniczną pisownią.
    const canonical = gh?.login ?? login;
    const dbUser = await prisma.user.findUnique({
      where: { githubLogin: canonical },
    });

    // Nie ma go ani na GitHubie, ani u nas → użytkownik nie istnieje.
    if (!gh && !dbUser) return null;

    return {
      login: canonical,
      name: gh?.name ?? dbUser?.githubName ?? canonical,
      avatarUrl: gh?.avatarUrl ?? dbUser?.avatarUrl ?? null,
      bio: gh?.bio ?? dbUser?.bio ?? null,
      followers: gh?.followers ?? null,
      following: gh?.following ?? null,
      registered: Boolean(dbUser),
      joinedAt: dbUser?.createdAt ?? null,
    };
  },
);
