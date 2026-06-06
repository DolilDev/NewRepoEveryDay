import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

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
    async jwt({ token, profile }) {
      // Login GitHuba nie trafia do domyślnego tokenu — zapisujemy go przy logowaniu.
      if (profile?.login) {
        token.login = profile.login as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.login) {
        session.user.login = token.login as string;
      }
      return session;
    },
  },
});
