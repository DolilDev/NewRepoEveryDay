// Synchronizing the logged-in player with the users table.
// NOTE: server-side only (API routes) — uses the Prisma client.

import { prisma } from "@/lib/prisma";
import type { ServerAuth } from "@/lib/auth-token";

// Ensures a row exists in users for the logged-in player and returns it.
// Upsert by githubLogin (unique) — doesn't duplicate the user, and on re-login it
// refreshes the profile data. createdAt (joined the app) is set once, when the row
// is created (default now()). The returned user.id links quests to the user.
export async function upsertUser(auth: ServerAuth) {
  if (!auth.login) {
    throw new Error("Missing GitHub login in the session — cannot save the user.");
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
