// Map folderName → language (colored dot) for quests in the container repo.
// In the container-repo model, all quests live in ONE repo, so the language can't
// be taken from a list of repositories — we determine it per-FOLDER from the
// container tree: one shot for the file tree, then the dominant code extension in
// the folder. When the language can't be determined → no entry (the UI skips the dot).
// NOTE: server-side only (reads the token from the cookie). The result (the
// folder→language map) depends ONLY on the contents of a given login's container
// repo, not on the viewer — so we cache it for a time per login (unstable_cache),
// to avoid pulling the entire GitHub tree on every render of the profile/dashboard.
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getRepo, fetchRepoTree } from "@/lib/github";
import { getCookieAccessToken } from "@/lib/auth-token";
import { CONTAINER_REPO } from "@/lib/container";
import { folderStacksFromTree } from "@/lib/languages";

// How long (s) to keep the computed folder languages before refreshing from GitHub.
const REVALIDATE_SECONDS = 300;

// Compute the dominant language of each folder from the container repo tree. The
// token comes in via the closure (it is NOT part of the cache key — the result
// doesn't depend on it); the key is the login. Returns a plain object, because
// unstable_cache serializes the result (a Map wouldn't survive serialization).
function loadFolderLanguages(token: string) {
  return unstable_cache(
    async (login: string): Promise<Record<string, string | null>> => {
      const result: Record<string, string | null> = {};

      const repo = await getRepo(token, login, CONTAINER_REPO);
      if (!repo.ok) return result;

      const tree = await fetchRepoTree(token, login, CONTAINER_REPO, repo.defaultBranch);
      if (!tree) return result;

      // Dominant language per folder = the most frequent code extension (first ranked).
      const stacks = folderStacksFromTree(tree, 1);
      for (const [folder, langs] of Object.entries(stacks)) {
        result[folder] = langs[0] ?? null;
      }
      return result;
    },
    ["folder-languages"],
    { revalidate: REVALIDATE_SECONDS },
  );
}

// React's cache() dedupes reading the cookie and building the Map within a single request.
export const getFolderLanguages = cache(
  async (login: string): Promise<Map<string, string | null>> => {
    // Empty token = public read (the container is public). A missing cookie also
    // works for public data, just with a lower request rate limit.
    const token = (await getCookieAccessToken()) ?? "";
    const obj = await loadFolderLanguages(token)(login);
    return new Map(Object.entries(obj));
  },
);
