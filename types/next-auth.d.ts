import type { DefaultSession } from "next-auth";
import type { GitHubProfile } from "@/lib/github";

// Rozszerzamy sesję o login GitHuba (username) oraz publiczne dane profilu
// (bio/followers/...) dociągnięte z GitHub API. Token dostępu NIE jest tu trzymany.
declare module "next-auth" {
  interface Session {
    user: {
      login?: string;
      github?: GitHubProfile;
    } & DefaultSession["user"];
  }
}

// JWT jest deklarowany w @auth/core/jwt (next-auth/jwt tylko go reeksportuje),
// więc augmentację kierujemy tam, inaczej deklaracje się nie zmergują.
declare module "@auth/core/jwt" {
  interface JWT {
    login?: string;
    github?: GitHubProfile;
    // Token OAuth GitHuba — trzymany TYLKO w zaszyfrowanym JWT po stronie serwera,
    // odczytywany w serwerowych API routes. Nigdy nie trafia do sesji/przeglądarki.
    accessToken?: string;
  }
}
