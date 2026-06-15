import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { fetchGitHubProfile } from "@/lib/github";
import { upsertUser } from "@/lib/user";

// NextAuth configuration (Auth.js v5). Secrets are read ONLY from environment
// variables (.env.local) — nothing is hard-coded in the source.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Trust the host from the request to build redirect_uri correctly in dev/proxy.
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Scope already set now for creating public repos in later stages.
      authorization: { params: { scope: "read:user public_repo" } },
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      // The GitHub login is not part of the default token — we store it at sign-in.
      if (profile?.login) {
        token.login = profile.login as string;
      }
      // After sign-in we fetch the full profile from the GitHub REST API with the OAuth token.
      // We do this HERE (server-side) — the token never leaves the auth layer.
      if (account?.access_token) {
        // We store the token in an ENCRYPTED JWT (the session cookie). It is used
        // for writes to GitHub from server-side API routes. It does NOT go into the
        // session sent to the browser (see the session callback below).
        token.accessToken = account.access_token;
        const gh = await fetchGitHubProfile(account.access_token);
        if (gh) token.github = gh;

        // We create the user row ALREADY AT SIGN-IN (upsert) — this way the join
        // date (users.createdAt) and presence in the database are consistent from
        // registration, not only from the first generated quest. createdAt is set
        // once, when the row is created; subsequent sign-ins only refresh the profile.
        // A database error must NOT break sign-in — we catch and ignore it.
        const login =
          typeof profile?.login === "string"
            ? profile.login
            : typeof token.login === "string"
              ? token.login
              : null;
        if (login) {
          try {
            await upsertUser({
              accessToken: account.access_token,
              login,
              name: typeof profile?.name === "string" ? profile.name : null,
              avatarUrl:
                typeof profile?.avatar_url === "string" ? profile.avatar_url : null,
              bio: gh?.bio ?? null,
            });
          } catch {
            // we do not block sign-in if the database write failed
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Only public profile data goes into the session — NEVER the access token.
      if (session.user) {
        if (token.login) session.user.login = token.login as string;
        if (token.github) session.user.github = token.github;
      }
      return session;
    },
  },
});
