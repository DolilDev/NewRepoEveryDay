import Countdown from "@/components/Countdown";
import { currentUser, todayQuest } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Pasek: powitanie + streak */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gh-text">Quest na dziś</h1>
          <p className="text-sm text-gh-muted">
            Cześć, {currentUser.name.split(" ")[0]} 👋 — czas zrobić coś, czego
            jeszcze nie robiłeś.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gh-border bg-gh-surface px-3 py-1.5 text-sm font-semibold text-gh-text">
          🔥 {currentUser.currentStreak} dni z rzędu
        </span>
      </div>

      {/* Karta questa */}
      <article className="overflow-hidden rounded-lg border border-gh-border bg-gh-surface">
        <header className="flex items-center justify-between border-b border-gh-border bg-gh-surface2 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gh-muted">
            Dzisiejszy quest
          </span>
          <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2.5 py-0.5 text-xs font-semibold text-gh-green-hover">
            Oczekuje na ukończenie
          </span>
        </header>

        <div className="space-y-5 p-5">
          <div>
            <h2 className="text-xl font-semibold text-gh-text">
              {todayQuest.title}
            </h2>
            <p className="mt-2 leading-relaxed text-gh-muted">
              {todayQuest.description}
            </p>
          </div>

          {/* Narzucona nazwa repo */}
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gh-muted">
              Narzucona nazwa repozytorium
            </div>
            <div className="flex items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-3 py-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="text-gh-muted"
                aria-hidden
              >
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
              </svg>
              <code className="font-mono text-sm text-gh-text">
                github.com/{currentUser.login}/{todayQuest.repoName}
              </code>
            </div>
            <p className="mt-1.5 text-xs text-gh-subtle">
              Repo musi być publiczne i utworzone dzisiaj — nazwę zna tylko
              system, więc starego repo nie podstawisz.
            </p>
          </div>

          {/* Kryteria zaliczenia */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gh-muted">
              Kryteria zaliczenia
            </div>
            <ul className="space-y-2">
              {todayQuest.criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gh-border bg-gh-bg"
                    aria-hidden
                  />
                  <span className="text-gh-text">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dlaczego to nowość */}
          <div className="rounded-md border border-gh-border bg-gh-bg px-4 py-3 text-sm">
            <span className="font-semibold text-gh-text">
              💡 Dlaczego to dla Ciebie nowe:{" "}
            </span>
            <span className="text-gh-muted">{todayQuest.whyNew}</span>
          </div>
        </div>

        {/* Stopka karty: licznik + akcja */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gh-border bg-gh-surface2 px-5 py-4">
          <div className="text-sm text-gh-muted">
            Quest resetuje się za{" "}
            <Countdown />
            <span className="ml-1 text-gh-subtle">(północ CET)</span>
          </div>
          <button
            type="button"
            disabled
            title="Dostępne po podłączeniu backendu (kolejny etap)"
            className="cursor-not-allowed rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white opacity-60"
          >
            Oznacz jako zrobione
          </button>
        </footer>
      </article>

      <p className="text-center text-xs text-gh-subtle">
        To statyczny szkielet UI — przycisk, logowanie i ocena AI dojdą w
        kolejnych etapach.
      </p>
    </div>
  );
}
