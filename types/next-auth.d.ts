import type { DefaultSession } from "next-auth";
import type { GitHubProfile } from "@/lib/github";

// We extend the session with the GitHub login (username) and public profile data
// (bio/followers/...) fetched from the GitHub API. The access token is NOT kept here.
declare module "next-auth" {
  interface Session {
    user: {
      login?: string;
      github?: GitHubProfile;
    } & DefaultSession["user"];
  }
}

// JWT is declared in @auth/core/jwt (next-auth/jwt only re-exports it),
// so we direct the augmentation there, otherwise the declarations won't merge.
declare module "@auth/core/jwt" {
  interface JWT {
    login?: string;
    github?: GitHubProfile;
    // The GitHub OAuth token — kept ONLY in the encrypted JWT on the server side,
    // read in server-side API routes. It never goes into the session/browser.
    accessToken?: string;
  }
}
