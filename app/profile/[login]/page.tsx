import QuestCalendar from "@/components/QuestCalendar";
import LanguageDot from "@/components/LanguageDot";
import { getProfile } from "@/lib/profile";
import {
  getUserStats,
  getUserQuests,
  getUserCompletions,
} from "@/lib/profile-data";
import { getFolderLanguages } from "@/lib/repo-language";
import { relativeQuestDate } from "@/lib/date";
import { buildQuestCalendar } from "@/lib/calendar";
import RepoIcon from "@/components/RepoIcon";
import StatusBadge from "@/components/StatusBadge";

// Statystyki gry: jedno kafelkowe pole. Brak danych → 0 (puste konto, nie błąd).
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
  // Brak profilu → layout pokazuje komunikat „nie znaleziono"; tu nic nie renderujemy.
  if (!profile) return null;

  const login = profile.login;
  const [stats, quests, completions, langMap] = await Promise.all([
    getUserStats(login),
    getUserQuests(login),
    getUserCompletions(login),
    getFolderLanguages(login),
  ]);

  // Siatka kalendarza (Pon–Nd, ostatni rok) z ukończeń. Brak → pusta siatka, 0.
  const { days, completedCount } = buildQuestCalendar(completions);

  // Brak wiersza statystyk → zera (świeże konto bez ukończeń / osoba spoza NERD).
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
            Brak projektów.
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
                    <span className="truncate">{repo.folderName ?? "(bez folderu)"}</span>
                  </a>
                  <StatusBadge status={repo.status} className="shrink-0" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gh-muted">
                  {repo.title}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gh-muted">
                  <span>Utworzono {relativeQuestDate(repo.date)}</span>
                  <LanguageDot
                    language={repo.folderName ? langMap.get(repo.folderName) ?? null : null}
                  />
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
