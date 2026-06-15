// Unified profile data for ANY user by GitHub login.
// NOTE: server-side only (reads the database and the GitHub API with the token from the cookie).
//
// Three cases we handle:
//  1) the login exists on GitHub AND has a row in our database (users) → a full player,
//     join date from users.createdAt (registered = true),
//  2) the login exists on GitHub but does NOT play with us (no row) → we show
//     the data from GitHub, but registered = false (the UI says "Not joined"),
//  3) the login doesn't even exist on GitHub → getProfile returns null (UI: "User
//     not found").
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { fetchPublicProfile } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";

export type ProfileData = {
  login: string; // canonical GitHub login
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  registered: boolean; // whether a row exists in the users table (whether they play with us)
  joinedAt: Date | null; // users.createdAt (joined NERD) — null when not playing
};

// cache() dedupes the call within a single request: the layout, sidebar, and page
// ask for the same login → one query to GitHub and the database.
export const getProfile = cache(async (rawLogin: string): Promise<ProfileData | null> => {
  const login = rawLogin.trim();
  if (!login) return null;

  const token = await getCookieAccessToken();
  const gh = await fetchPublicProfile(login, token);
  // The GitHub login is case-insensitive — we query the database with the canonical spelling.
  const canonical = gh?.login ?? login;
  const dbUser = await prisma.user.findUnique({
    where: { githubLogin: canonical },
  });

  // Not on GitHub and not with us → the user does not exist.
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
});
