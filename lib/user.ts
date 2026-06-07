// Synchronizacja zalogowanego gracza z tabelą users.
// UWAGA: tylko po stronie serwera (API routes) — używa klienta Prisma.

import { prisma } from "@/lib/prisma";
import type { ServerAuth } from "@/lib/auth-token";

// Upewnia się, że istnieje wiersz w users dla zalogowanego gracza i zwraca go.
// Upsert po githubLogin (unikalny) — nie dubluje usera, a przy ponownym logowaniu
// odświeża dane profilu. createdAt (dołączenie do aplikacji) ustawia się raz,
// przy tworzeniu wiersza (default now()). Zwrócone user.id wiąże questy z userem.
export async function upsertUser(auth: ServerAuth) {
  if (!auth.login) {
    throw new Error("Brak loginu GitHub w sesji — nie można zapisać użytkownika.");
  }
  const profileUrl = `https://github.com/${auth.login}`;
  return prisma.user.upsert({
    where: { githubLogin: auth.login },
    update: {
      githubName: auth.name,
      avatarUrl: auth.avatarUrl,
      profileUrl,
      bio: auth.bio,
    },
    create: {
      githubLogin: auth.login,
      githubName: auth.name,
      avatarUrl: auth.avatarUrl,
      profileUrl,
      bio: auth.bio,
    },
  });
}
