// Server-side read of the GitHub token from the encrypted JWT (session cookie).
// NOTE: use ONLY in server-side API routes. The token is never sent to the
// browser — decryption requires NEXTAUTH_SECRET (server only).
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { cache } from "react";

export type ServerAuth = {
  accessToken: string;
  login: string | null;
  // Public profile data from the encrypted JWT — for upserting the users row.
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export async function getServerAuth(req: Request): Promise<ServerAuth | null> {
  // In production (https) NextAuth uses a cookie name with the __Secure- prefix,
  // and the salt for decrypting the JWT depends on that name. NEXTAUTH_URL is often
  // unset on Vercel (host is detected via trustHost), so when it is missing we detect
  // production via NODE_ENV (on Vercel prod/preview = "production"). Otherwise getToken
  // would look for a cookie without the prefix and the server-side session would be
  // empty despite being logged in.
  const secureCookie =
    process.env.NEXTAUTH_URL?.startsWith("https://") ??
    process.env.NODE_ENV === "production";

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });

  const accessToken = token?.accessToken;
  if (typeof accessToken !== "string" || !accessToken) return null;

  const login = typeof token?.login === "string" ? token.login : null;
  // name/picture are standard JWT fields (NextAuth saves them from the GitHub profile),
  // bio is fetched into token.github at login time. profileUrl is derived from the login.
  const name = typeof token?.name === "string" && token.name.trim() ? token.name : null;
  const avatarUrl =
    typeof token?.picture === "string" && token.picture ? token.picture : null;
  const bio =
    typeof token?.github?.bio === "string" && token.github.bio.trim()
      ? token.github.bio
      : null;
  return { accessToken, login, name, avatarUrl, bio };
}

// OAuth token of the logged-in player read from cookies (for use in server
// components, where we don't have a Request object). Returns null when no one is
// logged in. The token does NOT reach the browser — it is used only for server-side
// requests to the GitHub API (e.g. fetching the languages of someone else's public repo).
export const getCookieAccessToken = cache(async (): Promise<string | null> => {
  const secureCookie =
    process.env.NEXTAUTH_URL?.startsWith("https://") ??
    process.env.NODE_ENV === "production";
  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const req = new Request("http://localhost", {
    headers: { cookie: cookieHeader },
  });
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
  });
  const accessToken = token?.accessToken;
  return typeof accessToken === "string" && accessToken ? accessToken : null;
});
