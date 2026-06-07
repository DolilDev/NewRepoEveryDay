import QuestCalendar from "@/components/QuestCalendar";
import {
  getViewerLogin,
  getUserStats,
  getUserQuests,
  getUserCompletions,
} from "@/lib/profile-data";
import { relativeQuestDate } from "@/lib/date";
import { buildQuestCalendar } from "@/lib/calendar";

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gh-muted" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

// Statystyki gry: jedno kafelkowe pole. Brak danych → 0 (puste konto, nie błąd).
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-gh-border bg-gh-surface px-4 py-3">
      <div className="text-xl font-semibold text-gh-text">{value}</div>
      <div className="mt-0.5 text-xs text-gh-muted">{label}</div>
    </div>
  );
}

// Etykieta statusu questa po polsku (kolory jak w GitHubie: zielony/żółty).
function statusBadge(status: "PENDING" | "PASSED" | "FAILED") {
  if (status === "PASSED") {
    return (
      <span className="shrink-0 rounded-full border border-gh-green/40 bg-gh-green/10 px-2 text-xs font-semibold text-gh-green">
        Zaliczony
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full border border-gh-border px-2 text-xs font-medium text-gh-muted">
      W trakcie
    </span>
  );
}

export default async function ProfileOverviewPage() {
  const login = await getViewerLogin();
  const [stats, quests, completions] = await Promise.all([
    getUserStats(login),
    getUserQuests(login),
    getUserCompletions(login),
  ]);

  // Siatka kalendarza (Pon–Nd, ostatni rok) z ukończeń. Brak → pusta siatka, 0.
  const { days, completedCount } = buildQuestCalendar(completions);

  // Brak wiersza statystyk → zera (świeże konto bez ukończeń).
  const s = stats ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalQuests: 0,
    points: 0,
  };

  // Pierwsze 6 repozytoriów questowych (od najnowszego).
  const recent = quests.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Statystyki gry — z tabeli stats (brak → zera). */}
      <section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Streak" value={`🔥 ${s.currentStreak}`} />
          <StatTile label="Najdłuższy streak" value={`${s.longestStreak}`} />
          <StatTile label="Ukończone questy" value={`${s.totalQuests}`} />
          <StatTile
            label="Punkty"
            value={s.points.toLocaleString("pl-PL")}
          />
        </div>
      </section>

      {/* 6 ostatnich repozytoriów stworzonych dzięki tej stronie */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gh-text">
          6 ostatnich repozytoriów stworzonych dzięki tej stronie
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-md border border-gh-border bg-gh-surface px-4 py-6 text-sm text-gh-muted">
            Brak projektów — wygeneruj pierwszy quest na stronie głównej.
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
                    href={repo.repoUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gh-blue hover:underline"
                  >
                    <RepoIcon />
                    <span className="truncate">{repo.repoName}</span>
                  </a>
                  {statusBadge(repo.status)}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gh-muted">
                  {repo.title}
                </p>
                <div className="mt-4 text-xs text-gh-muted">
                  Utworzono {relativeQuestDate(repo.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Kalendarz ukończonych questów (binarny, jeden odcień zieleni) */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-gh-text">
          Kalendarz ukończonych questów
        </h2>
        <div className="rounded-md border border-gh-border bg-gh-surface p-4">
          <QuestCalendar days={days} completedCount={completedCount} />
        </div>
      </section>
    </div>
  );
}
