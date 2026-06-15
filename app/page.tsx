"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Countdown from "@/components/Countdown";
import LanguageDot from "@/components/LanguageDot";
import RepoIcon from "@/components/RepoIcon";

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin text-gh-green"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

type QuestResult = {
  title: string;
  folderName: string | null; // name of the quest subfolder in the container repo
  folderUrl: string; // link to the quest folder on GitHub
  questFileUrl: string;
  fileUploaded: boolean;
  status?: "PENDING" | "PASSED" | "FAILED"; // none = freshly generated (PENDING)
};

// Evaluation response after passing — for the success message.
type SubmitResult = {
  descriptionOfWork: string;
  pointsAwarded: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
};

// State of submitting a quest for evaluation (independent of the generation phase).
type SubmitPhase = "idle" | "checking" | "passed" | "rejected" | "error";

// Item in the "Most recent quests" panel — a real quest from the database.
type RecentQuest = {
  id: string;
  title: string;
  folderName: string | null;
  folderUrl: string;
  relativeDate: string;
};

// Quest for the left "Your recent projects" panel (from the quests table).
type Project = {
  id: string;
  name: string; // name of the quest folder
  title: string;
  folderUrl: string; // link to the folder in the container repo
  language: string | null; // folder language (colored dot) or null
};

// Player stats — for now just for the streak counter in the dashboard header.
type Stats = {
  currentStreak: number;
  longestStreak: number;
  totalQuests: number;
  points: number;
};

type Phase = "idle" | "loading" | "success" | "error";

const STORAGE_KEY = "dq:lastQuest";

// Day key (local) — a simple, client-side "one quest per day" lock.
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// English pluralization of "day" by count: 1 day, 0/2/5/22… days.
function daysLabel(n: number): string {
  return n === 1 ? "day" : "days";
}

export default function DashboardPage() {
  const { status: authStatus } = useSession();
  const isAuthed = authStatus === "authenticated";

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<QuestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [recentQuests, setRecentQuests] = useState<RecentQuest[]>([]);

  // Player data from the database (stats + quest projects). meLoaded distinguishes
  // "still loading" from "empty" — an empty panel should look like a start, not an error.
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meLoaded, setMeLoaded] = useState(false);

  // Submitting for evaluation (a separate track from generation).
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitMissing, setSubmitMissing] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");

  // Quest considered completed: freshly passed in this session or PASSED in the database.
  const completed = submitPhase === "passed" || result?.status === "PASSED";

  // After a page refresh we restore today's result from localStorage — this is only
  // a quick HINT (works offline / before the API responds). The source of truth is the
  // database (see loadQuests below), which will confirm or correct this state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.date === todayKey() && saved?.result) {
        setResult(saved.result as QuestResult);
        setPhase("success");
      }
    } catch {
      // missing/corrupted entry — ignore it
    }
  }, []);

  // Source of truth: quests from the database. Sets the "Most recent quests" panel and —
  // when today's quest exists in the database (limit 1/day) — shows it instead of the button.
  const loadQuests = useCallback(async () => {
    try {
      const res = await fetch("/api/quest/recent");
      if (!res.ok) return;
      const data = await res.json();
      setRecentQuests(Array.isArray(data.recent) ? data.recent : []);
      if (data.today) {
        setResult(data.today as QuestResult);
        setPhase((p) => (p === "loading" ? p : "success"));
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ date: todayKey(), result: data.today }),
          );
        } catch {
          // no localStorage — skip the hint
        }
      } else {
        // The database has no quest for today → generation button (we don't touch
        // an ongoing generation or the error screen).
        setPhase((p) => (p === "loading" || p === "error" ? p : "idle"));
        setResult((r) => (r ? null : r));
      }
    } catch {
      // network/server unavailable — the localStorage state (hint) remains
    }
  }, []);

  // Stats + quest projects of the signed-in player (left panel, streak counter).
  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats ?? null);
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch {
      // network/server unavailable — the previous state remains
    } finally {
      setMeLoaded(true);
    }
  }, []);

  // After signing in (and at startup, if already signed in) we read data from the database.
  useEffect(() => {
    if (!isAuthed) return;
    loadQuests();
    loadMe();
  }, [isAuthed, loadQuests, loadMe]);

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projectQuery, projects]);

  async function handleGenerate() {
    if (phase === "loading") return;
    // Without signing in there's no token to create a repo — redirect to sign-in.
    if (!isAuthed) {
      signIn("github");
      return;
    }

    setPhase("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/quest/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status}).`);
      }
      const r = data as QuestResult;
      setResult(r);
      setPhase("success");
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date: todayKey(), result: r }),
        );
      } catch {
        // no localStorage — the lock will only work within the page session
      }
      // Refresh the "Most recent quests" and "Your recent projects" panels from the database.
      loadQuests();
      loadMe();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unknown error.");
      setPhase("error");
    }
  }

  // Submit today's quest for evaluation (GitHub + OpenAI — takes a moment).
  async function handleSubmit() {
    if (submitPhase === "checking") return;
    setSubmitPhase("checking");
    setSubmitError("");
    setSubmitMissing([]);
    try {
      const res = await fetch("/api/quest/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Server error (${res.status}).`);
      }
      if (data.passed) {
        // alreadyCompleted: the quest was already passed earlier (no new points).
        if (!data.alreadyCompleted) {
          setSubmitResult(data as SubmitResult);
        }
        setSubmitPhase("passed");
        loadQuests(); // refresh the quest status from the database (PASSED)
        loadMe(); // refresh the streak counter after passing
      } else {
        setSubmitMissing(Array.isArray(data.missing) ? data.missing : []);
        setSubmitPhase("rejected");
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error.");
      setSubmitPhase("error");
    }
  }

  return (
    // Left offset (lg) makes room for the panel pinned to the window edge.
    <div className="lg:pl-[336px]">
      {/* LEFT PANEL — OUTSIDE the centered container: pinned to the left edge of the
          window, full height below the navbar (fixed). It visually overlaps the footer
          but doesn't shift it (it's outside the normal flow). */}
      <aside className="flex flex-col border-b border-gh-border bg-gh-panel lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-10 lg:w-[336px] lg:border-b-0 lg:border-r lg:border-t">
        {/* An even 287px column centered in the 336px panel (49px margin).
            The header, search field, and list share the same left and right edges.
            pt-8 gives 32px of space BELOW the navbar line before the header starts. */}
        <div className="mx-auto flex w-[287px] flex-1 flex-col pt-8 lg:min-h-0">
          <header className="pb-3 text-sm font-semibold text-gh-text">
            Your recent projects
          </header>
          {/* Fixed 287×32px field — it neither stretches nor shrinks. */}
          <div className="pb-1">
            <div className="flex h-8 w-[287px] items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-2 text-gh-subtle transition-colors focus-within:border-gh-blue">
              <SearchIcon />
              <input
                type="text"
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
                placeholder="Find a project..."
                aria-label="Find a project by name"
                className="w-full bg-transparent text-sm text-gh-text placeholder:text-gh-subtle focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-[420px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
            {isAuthed && !meLoaded ? (
              // Loading state — distinct from empty (empty ≠ error).
              <li className="py-4 text-sm text-gh-subtle">Loading…</li>
            ) : filteredProjects.length === 0 ? (
              <li className="py-4 text-sm text-gh-subtle">
                {projectQuery.trim()
                  ? "No matching projects."
                  : "No projects — generate your first quest."}
              </li>
            ) : (
              filteredProjects.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.folderUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 flex-col gap-1 py-2"
                  >
                    {/* font-normal (400): Segoe UI has no Medium (500) weight,
                        so 500 renders like Semibold (bold). 400 has a real
                        Regular face and is reliably lighter, not bold. */}
                    <span className="flex min-w-0 items-center gap-2 text-sm font-normal text-gh-text">
                      <RepoIcon />
                      <span className="truncate group-hover:underline">{p.name}</span>
                    </span>
                    {p.title && (
                      <span className="truncate pl-6 text-xs text-gh-muted">
                        {p.title}
                      </span>
                    )}
                    {/* Repo language dot (GitHub-style color); no language → no dot. */}
                    {p.language && (
                      <LanguageDot
                        language={p.language}
                        className="pl-6 text-xs text-gh-muted"
                      />
                    )}
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      {/* CENTERED CONTENT CONTAINER (max 1280px) — only the center + right panel. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        {/* Streak counter — from the signed-in player's stats.currentStreak (none → 0). */}
        {isAuthed && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gh-border bg-gh-surface px-3 py-1 text-sm font-semibold text-gh-text">
              🔥 {stats?.currentStreak ?? 0} {daysLabel(stats?.currentStreak ?? 0)} in a
              row
            </span>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* CENTER — generating / completing the quest (deep background #010409) */}
          <section className="min-w-0 flex-1 bg-gh-bg-deep">
            {phase === "loading" ? (
              // STATE: generation in progress
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-gh-muted">
                <Spinner />
                <p className="text-sm">
                  Generating the quest and creating a folder in the container repo…
                </p>
                <p className="text-xs text-gh-subtle">This may take a moment.</p>
              </div>
            ) : phase === "error" ? (
              // STATE: error + retry
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="max-w-md rounded-md border border-gh-red/40 bg-gh-red/10 px-4 py-4 text-sm text-gh-text">
                  <div className="mb-1 font-semibold text-gh-red">
                    Failed to generate the quest
                  </div>
                  <p className="text-gh-muted">{errorMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Try again
                </button>
              </div>
            ) : phase === "success" && result ? (
              // STATE: repo created
              <article className="overflow-hidden rounded-md border border-gh-border bg-gh-surface">
                <header className="flex items-center justify-between border-b border-gh-border bg-gh-surface2 px-4 py-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gh-muted">
                    Today&apos;s quest
                  </span>
                  <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2 py-1 text-xs font-semibold text-gh-green">
                    {completed ? "Passed 100/100" : "Folder created"}
                  </span>
                </header>

                <div className="space-y-4 p-4">
                  <div className="rounded-md border border-gh-green/40 bg-gh-green/10 px-4 py-3 text-sm text-gh-text">
                    ✅ The quest folder was created in the container repo — the
                    instructions are inside it (the{" "}
                    <span className="font-mono">QUEST.md</span> file).
                  </div>

                  <h2 className="text-xl font-semibold text-gh-text">{result.title}</h2>

                  {/* Quest folder name */}
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                      Quest folder
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-3 py-2">
                      <RepoIcon />
                      <span className="truncate font-mono text-sm text-gh-text">
                        {result.folderName ?? "—"}
                      </span>
                    </div>
                  </div>

                  {/* Links to GitHub (new tab) */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={result.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Open quest folder ↗
                    </a>
                    {result.fileUploaded && (
                      <a
                        href={result.questFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-gh-border bg-gh-surface px-4 py-2 text-sm font-semibold text-gh-text transition-colors hover:bg-gh-surface2"
                      >
                        View QUEST.md ↗
                      </a>
                    )}
                  </div>

                  {!result.fileUploaded && (
                    <p className="text-xs text-gh-red">
                      The folder was created, but the QUEST.md file could not be added —
                      you can try generating the quest again tomorrow.
                    </p>
                  )}

                  {/* Submitting the quest for automatic evaluation */}
                  {completed ? (
                    // STATE: quest passed
                    <div className="rounded-md border border-gh-green/40 bg-gh-green/10 px-4 py-4 text-sm">
                      <div className="mb-1 font-semibold text-gh-green">
                        Quest passed! 🎉
                      </div>
                      {submitResult ? (
                        <p className="text-gh-text">
                          {submitResult.descriptionOfWork
                            ? `${submitResult.descriptionOfWork} `
                            : ""}
                          <span className="text-gh-muted">
                            +{submitResult.pointsAwarded} pts · streak:{" "}
                            {submitResult.currentStreak}
                          </span>
                        </p>
                      ) : (
                        <p className="text-gh-muted">
                          This quest has already been passed.
                        </p>
                      )}
                    </div>
                  ) : (
                    // STATE: ready to submit
                    <div className="rounded-md border border-gh-border bg-gh-bg px-4 py-4 text-sm">
                      <div className="mb-1 font-semibold text-gh-text">
                        Submit your task for review
                      </div>
                      <p className="mb-3 text-gh-muted">
                        Complete the task according to the{" "}
                        <span className="font-mono">QUEST.md</span> file, push your code
                        to the repository, and submit it for automatic evaluation (we
                        check whether all criteria are met).
                      </p>

                      {submitPhase === "rejected" && (
                        <div className="mb-3 rounded-md border border-gh-red/40 bg-gh-red/10 px-3 py-3">
                          <div className="mb-1 font-semibold text-gh-red">
                            Not passed yet
                          </div>
                          {submitMissing.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5 text-gh-text">
                              {submitMissing.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gh-text">Not all criteria are met.</p>
                          )}
                          <p className="mt-2 text-xs text-gh-muted">
                            Fix the repository and submit again.
                          </p>
                        </div>
                      )}

                      {submitPhase === "error" && (
                        <p className="mb-3 text-xs text-gh-red">{submitError}</p>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitPhase === "checking"}
                        className="inline-flex items-center gap-2 rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-60"
                      >
                        {submitPhase === "checking"
                          ? "Checking the repository…"
                          : submitPhase === "rejected"
                            ? "Submit again"
                            : "Submit for evaluation"}
                      </button>
                    </div>
                  )}
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gh-border bg-gh-surface2 px-4 py-4">
                  <div className="text-sm text-gh-muted">
                    <div>
                      Next quest in <Countdown />
                      <span className="ml-1 text-gh-subtle">(midnight CET)</span>
                    </div>
                    <div className="mt-1 text-xs text-gh-subtle">
                      The container repo must remain public.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="cursor-default rounded-md border border-gh-border bg-gh-surface px-4 py-2 text-sm font-semibold text-gh-muted"
                  >
                    Generated today
                  </button>
                </footer>
              </article>
            ) : (
              // STATE: idle — large button in the center
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={authStatus === "loading"}
                  className="rounded-md bg-gh-green px-6 py-4 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-60"
                >
                  {isAuthed
                    ? "Generate today's quest"
                    : "Sign in with GitHub to generate a quest"}
                </button>
                {!isAuthed && authStatus !== "loading" && (
                  <p className="text-xs text-gh-subtle">
                    The quest creates a subfolder in your container repo on GitHub.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* RIGHT PANEL — Most recent quests: timeline with dots (max 5, from the database) */}
          <aside className="lg:w-[312px] lg:shrink-0">
            <div className="rounded-md border border-gh-border bg-gh-panel p-4">
              <header className="mb-4 text-sm font-semibold text-gh-text">
                Most recent quests
              </header>

              {recentQuests.length === 0 ? (
                // Empty state — discreet text instead of mocks.
                <p className="text-sm text-gh-subtle">
                  You don&apos;t have any quests yet.
                </p>
              ) : (
                /* Timeline: ONE continuous vertical line (#30363d) running from
                   the first dot all the way to the bottom of the panel's content
                   area (it doesn't stop at the last quest). The dots are nodes
                   sitting on the axis, with text shifted to the right (gap-3). */
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-[4px] top-2 w-px bg-gh-border"
                  />

                  <ol>
                    {recentQuests.map((q) => (
                      <li key={q.id} className="flex gap-3 pb-6">
                        {/* Dot node on the axis (the line passes through its center) */}
                        <div className="flex flex-col items-center" aria-hidden>
                          <span className="mt-1 h-[9px] w-[9px] shrink-0 rounded-full bg-gh-border" />
                        </div>

                        {/* Item content: time (outside the link) + a clickable link
                            covering the title and repo name. Hover: both lines turn
                            blue (#58a6ff) with an underline, no background change. */}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gh-muted">{q.relativeDate}</div>
                          <a
                            href={q.folderUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group mt-1 block no-underline"
                          >
                            <div className="text-sm text-gh-text group-hover:text-gh-blue group-hover:underline">
                              {q.title}
                            </div>
                            <div className="truncate font-mono text-xs text-gh-muted group-hover:text-gh-blue group-hover:underline">
                              {q.folderName ?? "—"}
                            </div>
                          </a>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* Link to the full history — aligned to the text column,
                      the axis runs along its left side all the way down. */}
                  <a
                    href="#"
                    className="ml-[21px] inline-block text-sm font-light text-gh-link-muted no-underline hover:text-gh-blue hover:no-underline"
                  >
                    View history →
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
