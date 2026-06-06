import type { DefaultSession } from "next-auth";

// Rozszerzamy sesję o login GitHuba (username), którego nie ma w domyślnym typie.
declare module "next-auth" {
  interface Session {
    user: {
      login?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    login?: string;
  }
}
