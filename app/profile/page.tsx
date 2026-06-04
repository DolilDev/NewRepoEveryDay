import Avatar from "@/components/Avatar";
import Heatmap from "@/components/Heatmap";
import { achievements, currentUser, formatPlDate } from "@/lib/mock-data";

const stats = [
  { label: "Aktualny streak", value: `${currentUser.currentStreak} dni`, accent: true },
  { label: "Najdłuższy streak", value: `${currentUser.longestStreak} dni` },
  { label: "Ukończone questy", value: currentUser.totalQuests },
  { label: "Punkty", value: currentUser.points.toLocaleString("pl-PL") },
];

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      {/* Nagłówek profilu w stylu GitHuba */}
      <section className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-5 sm:text-left">
        <Avatar name={currentUser.name} login={currentUser.login} size={96} />
        <div className="mt-4 sm:mt-0">
          <h1 className="text-2xl font-bold leading-tight text-gh-text">
            {currentUser.name}
          </h1>
          <a
            href={currentUser.profileUrl}
            className="text-lg text-gh-muted hover:text-gh-blue hover:underline"
          >
            @{currentUser.login}
          </a>
          <p className="mt-1 text-sm text-gh-subtle">
            Dołączył {formatPlDate(currentUser.joinedDate)}
          </p>
        </div>
      </section>

      {/* Statystyki */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-gh-border bg-gh-surface p-4"
          >
            <div
              className={`text-2xl font-bold ${
                s.accent ? "text-gh-green-hover" : "text-gh-text"
              }`}
            >
              {s.value}
            </div>
            <div className="mt-0.5 text-xs text-gh-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Heatmapa-streak */}
      <section className="rounded-lg border border-gh-border bg-gh-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-gh-text">
          Kalendarz questów
        </h2>
        <Heatmap />
      </section>

      {/* Osiągnięcia */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gh-text">
          Osiągnięcia
          <span className="ml-2 font-normal text-gh-muted">
            {achievements.filter((a) => a.unlocked).length} z {achievements.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              title={
                a.unlocked && a.unlockedDate
                  ? `Odblokowano ${formatPlDate(a.unlockedDate)}`
                  : "Jeszcze nieodblokowane"
              }
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                a.unlocked
                  ? "border-gh-border bg-gh-surface"
                  : "border-gh-border-muted bg-gh-surface/40 opacity-50 grayscale"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {a.icon}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gh-text">
                  {a.name}
                </div>
                <div className="truncate text-xs text-gh-muted">
                  {a.unlocked ? a.description : "🔒 Zablokowane"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
