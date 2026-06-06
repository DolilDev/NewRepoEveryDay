import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { fetchGitHubProfile } from "@/lib/github";

// Konfiguracja NextAuth (Auth.js v5). Sekrety czytane WYŁĄCZNIE ze zmiennych
// środowiskowych (.env.local) — nic nie jest zapisane na stałe w kodzie.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Zaufaj hostowi z żądania, by poprawnie zbudować redirect_uri w dev/proxy.
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Scope ustawiony już teraz pod tworzenie publicznych repo w kolejnych etapach.
      authorization: { params: { scope: "read:user public_repo" } },
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      // Login GitHuba nie trafia do domyślnego tokenu — zapisujemy go przy logowaniu.
      if (profile?.login) {
        token.login = profile.login as string;
      }
      // Po zalogowaniu dociągamy pełny profil z GitHub REST API tokenem OAuth.
      // Robimy to TU (po stronie serwera) — token nie wychodzi poza warstwę auth.
      if (account?.access_token) {
        const gh = await fetchGitHubProfile(account.access_token);
        if (gh) token.github = gh;
      }
      return token;
    },
    async session({ session, token }) {
      // Do sesji trafiają tylko publiczne dane profilu — NIGDY token dostępu.
      if (session.user) {
        if (token.login) session.user.login = token.login as string;
        if (token.github) session.user.github = token.github;
      }
      return session;
    },
  },
});
