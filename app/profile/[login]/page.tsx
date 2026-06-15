import QuestCalendar from "@/components/QuestCalendar";
import LanguageDot from "@/components/LanguageDot";
import { getProfile } from "@/lib/profile";
import { getUserStats, getUserQuests, getUserCompletions } from "@/lib/profile-data";
import { getFolderLanguages } from "@/lib/repo-language";
import { relativeQuestDate } from "@/lib/date";
import { buildQuestCalendar } from "@/lib/calendar";
import RepoIcon from "@/components/RepoIcon";
import StatusBadge from "@/components/StatusBadge";

// Game stats: a single tile. No data → 0 (empty account, not an error).
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gh-border bg-gh-surface px-4 py-3">
      <div className="text-xl font-semibold text-gh-text">{value}</div>
      <div className="mt-0.5 text-xs text-gh-muted">{label}</div>
    </div>
  );
}

export default async function ProfileOverviewPage({
  params,
}: {
  params: { login: string };
}) {
  const profile = await getProfile(decodeURIComponent(params.login));
  // No profile → the layout shows a "not found" message; here we render nothing.
  if (!profile) return null;

  const login = profile.login;
  const [stats, quests, completions, langMap] = await Promise.all([
    getUserStats(login),
    getUserQuests(login),
    getUserCompletions(login),
    getFolderLanguages(login),
  ]);

  // Calendar grid (Mon–Sun, the last year) from completions. None → empty grid, 0.
  const { days, completedCount } = buildQuestCalendar(completions);

  // No stats row → zeros (a fresh account with no completions / someone outside NERD).
  const s = stats ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalQuests: 0,
    points: 0,
  };

  // The first 6 quest repositories (newest first).
  const recent = quests.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Game stats — from the stats table (none → zeros). */}
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Streak" value={`🔥 ${s.currentStreak}`} />
          <StatTile label="Longest streak" value={`${s.longestStreak}`} />
          <StatTile label="Completed quests" value={`${s.totalQuests}`} />
          <StatTile label="Points" value={s.points.toLocaleString("en-US")} />
        </div>
      </section>

      {/* The 6 most recent repositories created through this site */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gh-text">
          The 6 most recent repositories created through this site
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-md border border-gh-border bg-gh-surface px-4 py-6 text-sm text-gh-muted">
            No projects.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {recent.map((repo) => (
              <div
                key={repo.id}
                className="rounded-md border border-gh-border bg-gh-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={repo.folderUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gh-blue hover:underline"
                  >
                    <RepoIcon />
                    <span className="truncate">{repo.folderName ?? "(no folder)"}</span>
                  </a>
                  <StatusBadge status={repo.status} className="shrink-0" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gh-muted">{repo.title}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gh-muted">
                  <span>Created {relativeQuestDate(repo.date)}</span>
                  <LanguageDot
                    language={
                      repo.folderName ? (langMap.get(repo.folderName) ?? null) : null
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calendar of completed quests (binary, a single shade of green) */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gh-text">
          Calendar of completed quests
        </h2>
        <div className="rounded-md border border-gh-border bg-gh-surface p-4">
          <QuestCalendar days={days} completedCount={completedCount} />
        </div>
      </section>
    </div>
  );
}
