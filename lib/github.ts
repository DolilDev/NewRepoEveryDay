// Server-side helper for the GitHub REST API.
// NOTE: this module is called server-side ONLY (NextAuth callback and API routes).
// The access token is never returned or sent to the browser.

const GH_API = "https://api.github.com";

// Shared headers for the GitHub API. The token is OPTIONAL: public data (profile,
// repo languages) can be read without it too, but with a token we get a far higher
// request limit (5000/h instead of 60/h per IP).
function ghHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "NERD-NewEveryRepoDay",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

export type GitHubProfile = {
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string | null; // ISO 8601, e.g. "2011-03-25T18:44:36Z"
};

// Fetches the signed-in user's profile (GET /user) using their OAuth token.
// Returns null on error/timeout — sign-in must not break because of this.
export async function fetchGitHubProfile(
  accessToken: string,
): Promise<GitHubProfile | null> {
  try {
    const res = await fetch(`${GH_API}/user`, {
      headers: ghHeaders(accessToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const u = await res.json();
    return {
      bio: typeof u.bio === "string" && u.bio.trim() ? u.bio : null,
      followers: typeof u.followers === "number" ? u.followers : 0,
      following: typeof u.following === "number" ? u.following : 0,
      publicRepos: typeof u.public_repos === "number" ? u.public_repos : 0,
      createdAt: typeof u.created_at === "string" ? u.created_at : null,
    };
  } catch {
    return null;
  }
}

export type PublicProfile = {
  login: string; // canonical login returned by GitHub
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followers: number;
  following: number;
};

// Public profile of ANY GitHub user by login (GET /users/{login}).
// Token optional (public data), but it raises the request limit. 404/error → null,
// which for the search means "no such user on GitHub".
export async function fetchPublicProfile(
  login: string,
  accessToken?: string | null,
): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${GH_API}/users/${encodeURIComponent(login)}`, {
      headers: ghHeaders(accessToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const u = await res.json();
    return {
      login: typeof u.login === "string" ? u.login : login,
      name: typeof u.name === "string" && u.name.trim() ? u.name : null,
      avatarUrl: typeof u.avatar_url === "string" ? u.avatar_url : null,
      bio: typeof u.bio === "string" && u.bio.trim() ? u.bio : null,
      followers: typeof u.followers === "number" ? u.followers : 0,
      following: typeof u.following === "number" ? u.following : 0,
    };
  } catch {
    return null;
  }
}

export type RepoSummary = { name: string; language: string | null };

// List of the user's repositories (to build the profile for the OpenAI prompt).
// On error returns an empty list — generation must work even without this data.
export async function fetchUserRepos(accessToken: string): Promise<RepoSummary[]> {
  try {
    const res = await fetch(
      `${GH_API}/user/repos?per_page=100&affiliation=owner&sort=pushed`,
      { headers: ghHeaders(accessToken), cache: "no-store" },
    );
    if (!res.ok) return [];
    const arr = await res.json();
    if (!Array.isArray(arr)) return [];
    return arr.map((r) => ({
      name: typeof r?.name === "string" ? r.name : "",
      language: typeof r?.language === "string" ? r.language : null,
    }));
  } catch {
    return [];
  }
}

// Public repositories of a given login along with the language detected by GitHub.
// type=owner → only their own repos; sort=pushed → newest first (quest repos
// are fresh, so they fit within the first hundred). Token optional.
export async function fetchReposByLogin(
  login: string,
  accessToken?: string | null,
): Promise<RepoSummary[]> {
  try {
    const res = await fetch(
      `${GH_API}/users/${encodeURIComponent(login)}/repos?per_page=100&sort=pushed&type=owner`,
      { headers: ghHeaders(accessToken), cache: "no-store" },
    );
    if (!res.ok) return [];
    const arr = await res.json();
    if (!Array.isArray(arr)) return [];
    return arr.map((r) => ({
      name: typeof r?.name === "string" ? r.name : "",
      language: typeof r?.language === "string" ? r.language : null,
    }));
  } catch {
    return [];
  }
}

// Text summary of the profile (languages + sample repos) for the model.
export function buildProfileSummary(repos: RepoSummary[]): string {
  if (repos.length === 0) {
    return "The user has no public repositories yet. Treat them as a beginner.";
  }

  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  const langs = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([lang]) => lang);
  const sampleNames = repos
    .map((r) => r.name)
    .filter(Boolean)
    .slice(0, 15);

  return [
    `Languages used (most frequent first): ${langs.length ? langs.join(", ") : "undetermined"}.`,
    `Sample repositories: ${sampleNames.join(", ") || "none"}.`,
    `Total number of repositories: ${repos.length}.`,
  ].join("\n");
}

export type CreateRepoResult =
  | {
      ok: true;
      name: string;
      owner: string;
      htmlUrl: string;
      defaultBranch: string;
    }
  | { ok: false; status: number; alreadyExists: boolean; message: string };

// Creates a PUBLIC repo on the signed-in user's account (POST /user/repos).
// A name collision returns 422 from GitHub → we signal alreadyExists=true.
export async function createRepo(
  accessToken: string,
  name: string,
  description: string,
): Promise<CreateRepoResult> {
  const res = await fetch(`${GH_API}/user/repos`, {
    method: "POST",
    headers: { ...ghHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description: description.slice(0, 350),
      private: false,
      auto_init: false,
      has_issues: true,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return {
      ok: true,
      name: typeof data?.name === "string" ? data.name : name,
      owner: typeof data?.owner?.login === "string" ? data.owner.login : "",
      htmlUrl: typeof data?.html_url === "string" ? data.html_url : "",
      defaultBranch:
        typeof data?.default_branch === "string" ? data.default_branch : "main",
    };
  }

  let message = `GitHub ${res.status}`;
  try {
    const err = await res.json();
    if (typeof err?.message === "string") message = err.message;
  } catch {
    // no error body — keep the default message
  }
  // A 422 when creating a repo is practically always a taken name.
  return { ok: false, status: res.status, alreadyExists: res.status === 422, message };
}

// Encodes a path for the Contents API URL while keeping the slashes (each SEGMENT
// separately), so nested paths work, e.g. "NERD-rust-wasm/QUEST.md".
function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

// Fetches a repository (GET /repos/{owner}/{repo}). Distinguishes three cases:
// exists (200), missing (404), and other error — this is key for the container
// repo model (create exactly once, use the existing one). A 200 returns the
// default branch and URL.
export type GetRepoResult =
  | {
      ok: true;
      defaultBranch: string;
      htmlUrl: string;
      owner: string;
      isPrivate: boolean;
    }
  | { ok: false; status: number };

export async function getRepo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<GetRepoResult> {
  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}`, {
      headers: ghHeaders(accessToken),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, status: res.status };
    const d = await res.json();
    return {
      ok: true,
      defaultBranch: typeof d?.default_branch === "string" ? d.default_branch : "main",
      htmlUrl: typeof d?.html_url === "string" ? d.html_url : "",
      owner: typeof d?.owner?.login === "string" ? d.owner.login : owner,
      isPrivate: Boolean(d?.private),
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Whether a path (file OR folder) exists in the repo: GET .../contents/{path}.
// 200 → exists, anything else → we treat it as free (a fresh, empty container
// without a branch returns 404 for everything). Used to detect a quest folder
// name collision.
export async function pathExists(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<boolean> {
  try {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const res = await fetch(
      `${GH_API}/repos/${owner}/${repo}/contents/${encodePath(path)}${q}`,
      { headers: ghHeaders(accessToken), cache: "no-store" },
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

// SHA of the file at a path — required by GitHub to OVERWRITE an existing file
// (PUT with a sha field). Missing file / error → null (then PUT creates a new file).
export async function getFileSha(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<string | null> {
  try {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const res = await fetch(
      `${GH_API}/repos/${owner}/${repo}/contents/${encodePath(path)}${q}`,
      { headers: ghHeaders(accessToken), cache: "no-store" },
    );
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d?.sha === "string" ? d.sha : null;
  } catch {
    return null;
  }
}

// Saves a text file in the repo (PUT .../contents/{path}). With the `sha` of an
// existing file it OVERWRITES it; without a sha it creates a new one. For an empty
// repo the first PUT creates the first commit and the default branch. Returns true
// on success.
export async function putFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  message: string,
  text: string,
  sha?: string | null,
): Promise<boolean> {
  const content = Buffer.from(text, "utf-8").toString("base64");
  const body: Record<string, unknown> = { message, content };
  if (sha) body.sha = sha;
  const res = await fetch(
    `${GH_API}/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    {
      method: "PUT",
      headers: { ...ghHeaders(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return res.ok;
}

// --- Fetching repo contents for evaluation (Stage B) -----------------------

export type RepoMeta = { defaultBranch: string; isPrivate: boolean };

// Repo metadata: the default branch (to fetch the tree) and visibility (the
// "public repository" criterion). Returns null on error.
export async function fetchRepoMeta(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<RepoMeta | null> {
  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}`, {
      headers: ghHeaders(accessToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      defaultBranch: typeof d?.default_branch === "string" ? d.default_branch : "main",
      isPrivate: Boolean(d?.private),
    };
  } catch {
    return null;
  }
}

export type RepoTreeEntry = { path: string; size: number; sha: string };

// Full file tree of the repo (recursive). Returns only blobs (files), not
// directories. Returns null on error.
export async function fetchRepoTree(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<RepoTreeEntry[] | null> {
  try {
    const res = await fetch(
      `${GH_API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers: ghHeaders(accessToken), cache: "no-store" },
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (!Array.isArray(d?.tree)) return null;
    const entries = d.tree as Array<{
      path?: unknown;
      type?: unknown;
      size?: unknown;
      sha?: unknown;
    }>;
    return entries
      .filter((e) => e?.type === "blob" && typeof e?.path === "string")
      .map((e) => ({
        path: e.path as string,
        size: typeof e.size === "number" ? e.size : 0,
        sha: typeof e.sha === "string" ? e.sha : "",
      }));
  } catch {
    return null;
  }
}

// Text content of a blob by SHA. Returns null on error or when there is no
// base64 encoding (e.g. a binary blob). Buffer.from ignores newline characters
// in base64.
export async function fetchBlobText(
  accessToken: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}/git/blobs/${sha}`, {
      headers: ghHeaders(accessToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (typeof d?.content !== "string" || d?.encoding !== "base64") return null;
    return Buffer.from(d.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}
