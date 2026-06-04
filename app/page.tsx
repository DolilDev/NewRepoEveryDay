"use client";

import { useState } from "react";
import Countdown from "@/components/Countdown";
import {
  currentUser,
  todayQuest,
  yourQuests,
  previousQuests,
  questGeneratedToday,
} from "@/lib/mock-data";

// --- Małe ikony (octicons) -------------------------------------------------
function BurgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gh-muted" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

function FlameBig() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2C12 2 5 7.5 5 13.5C5 17.6421 8.13401 21 12 21C15.866 21 19 17.6421 19 13.5C19 11 17.5 9 17.5 9C17.5 11 16 12 16 12C16 9 13.5 5.5 12 2Z" fill="#2ea043" />
      <path d="M12 21C9.79086 21 8 19.2091 8 17C8 14.5 12 11 12 11C12 11 16 14.5 16 17C16 19.2091 14.2091 21 12 21Z" fill="#39d353" />
    </svg>
  );
}

export default function DashboardPage() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [generated, setGenerated] = useState(questGeneratedToday);

  const showRight = previousQuests.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Górny pasek narzędzi: burger + tytuł + streak + przełącznik testowy */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setLeftOpen((v) => !v)}
          aria-pressed={leftOpen}
          title={leftOpen ? "Ukryj panel „Twoje questy”" : "Pokaż panel „Twoje questy”"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gh-border bg-gh-surface text-gh-muted transition-colors hover:bg-gh-surface2 hover:text-gh-text"
        >
          <BurgerIcon />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight text-gh-text">
            Cześć, {currentUser.name.split(" ")[0]} 👋
          </h1>
          <p className="text-xs text-gh-muted">Twój pulpit DailyQuest</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gh-border bg-gh-surface px-3 py-1.5 text-sm font-semibold text-gh-text">
            🔥 {currentUser.currentStreak} dni z rzędu
          </span>

          {/* Przełącznik testowy stanu A/B (tylko do podglądu) */}
          <div className="flex items-center gap-2 text-xs text-gh-subtle">
            <span className="hidden sm:inline">Podgląd (test):</span>
            <div className="inline-flex overflow-hidden rounded-md border border-gh-border">
              <button
                type="button"
                onClick={() => setGenerated(false)}
                className={`px-2.5 py-1 ${
                  !generated
                    ? "bg-gh-surface2 font-semibold text-gh-text"
                    : "text-gh-muted hover:text-gh-text"
                }`}
              >
                Stan A
              </button>
              <button
                type="button"
                onClick={() => setGenerated(true)}
                className={`border-l border-gh-border px-2.5 py-1 ${
                  generated
                    ? "bg-gh-surface2 font-semibold text-gh-text"
                    : "text-gh-muted hover:text-gh-text"
                }`}
              >
                Stan B
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trzy kolumny */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* LEWY PANEL — Twoje questy (zwijany) */}
        {leftOpen && (
          <aside className="w-full shrink-0 md:w-64">
            <div className="overflow-hidden rounded-lg border border-gh-border bg-gh-surface">
              <header className="border-b border-gh-border px-4 py-3 text-sm font-semibold text-gh-text">
                Twoje questy
              </header>
              <div className="border-b border-gh-border p-3">
                <div className="flex items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-2.5 py-1.5 text-gh-subtle">
                  <SearchIcon />
                  <input
                    type="text"
                    readOnly
                    disabled
                    placeholder="Znajdź quest..."
                    aria-label="Znajdź quest (wkrótce)"
                    className="w-full cursor-default bg-transparent text-sm text-gh-text placeholder:text-gh-subtle focus:outline-none"
                  />
                </div>
              </div>
              <ul className="max-h-[60vh] overflow-y-auto">
                {yourQuests.map((q) => (
                  <li key={q.id}>
                    <a
                      href="#"
                      className="block border-b border-gh-border-muted px-4 py-2.5 transition-colors last:border-b-0 hover:bg-gh-surface2"
                    >
                      <div className="truncate text-sm text-gh-text">
                        {q.title}
                      </div>
                      <div className="truncate font-mono text-xs text-gh-muted">
                        {q.repoName}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* ŚRODEK — generowanie / realizacja questa */}
        <section className="min-w-0 flex-1">
          {!generated ? (
            // STAN A — brak questa na dziś
            <div className="flex flex-col items-center rounded-lg border border-gh-border bg-gh-surface px-6 py-14 text-center">
              <FlameBig />
              <h2 className="mt-4 text-xl font-semibold text-gh-text">
                Gotowy na dzisiejszy quest?
              </h2>
              <p className="mt-2 max-w-md text-sm text-gh-muted">
                Quest generuje się na żądanie — raz dziennie. Kliknij, a AI
                dobierze Ci zadanie, którego jeszcze nie robiłeś. Pula resetuje
                się o północy CET.
              </p>
              <button
                type="button"
                onClick={() => setGenerated(true)}
                className="mt-6 rounded-md bg-gh-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gh-green-hover"
              >
                Wygeneruj dzisiejszy quest
              </button>
              <p className="mt-3 text-xs text-gh-subtle">
                Limit: jeden quest na dobę.
              </p>
            </div>
          ) : (
            // STAN B — quest wygenerowany
            <article className="overflow-hidden rounded-lg border border-gh-border bg-gh-surface">
              <header className="flex items-center justify-between border-b border-gh-border bg-gh-surface2 px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gh-muted">
                  Dzisiejszy quest
                </span>
                <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2.5 py-0.5 text-xs font-semibold text-gh-green-hover">
                  Oczekuje na zgłoszenie
                </span>
              </header>

              <div className="space-y-5 p-5">
                <h2 className="text-xl font-semibold text-gh-text">
                  {todayQuest.title}
                </h2>

                {/* Pełna instrukcja */}
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                    Pełna instrukcja
                  </div>
                  <p className="leading-relaxed text-gh-muted">
                    {todayQuest.description}
                  </p>
                </div>

                {/* Narzucona nazwa repo */}
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                    Narzucona nazwa repozytorium
                  </div>
                  <div className="flex items-stretch overflow-hidden rounded-md border border-gh-border">
                    <span className="flex items-center gap-1.5 border-r border-gh-border bg-gh-surface2 px-3 py-2 text-sm text-gh-muted">
                      <RepoIcon />
                      github.com/{currentUser.login}/
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={todayQuest.repoName}
                      aria-label="Narzucona nazwa repozytorium"
                      className="min-w-0 flex-1 cursor-default bg-gh-bg px-3 py-2 font-mono text-sm text-gh-text focus:outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gh-subtle">
                    Nazwę narzuca system — starego repo nie podstawisz.
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
                          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gh-border bg-gh-bg"
                          aria-hidden
                        />
                        <span className="text-gh-text">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Część otwarta — zrób coś od siebie */}
                <div className="rounded-md border border-gh-green/40 bg-gh-green/5 px-4 py-3">
                  <div className="mb-1 text-sm font-semibold text-gh-green-hover">
                    ✨ Twoja swoboda — zrób coś od siebie
                  </div>
                  <p className="text-sm text-gh-muted">{todayQuest.openChallenge}</p>
                </div>

                {/* Dlaczego to nowość */}
                <div className="rounded-md border border-gh-border bg-gh-bg px-4 py-3 text-sm">
                  <span className="font-semibold text-gh-text">
                    💡 Dlaczego to dla Ciebie nowe:{" "}
                  </span>
                  <span className="text-gh-muted">{todayQuest.whyNew}</span>
                </div>
              </div>

              {/* Stopka karty: licznik + zgłoszenie */}
              <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gh-border bg-gh-surface2 px-5 py-4">
                <div className="text-sm text-gh-muted">
                  <div>
                    Quest resetuje się za <Countdown />
                    <span className="ml-1 text-gh-subtle">(północ CET)</span>
                  </div>
                  <div className="mt-0.5 text-xs text-gh-subtle">
                    Repozytorium musi być publiczne.
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  title="Dostępne po podłączeniu backendu (kolejny etap)"
                  className="cursor-not-allowed rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white opacity-60"
                >
                  Zgłoś do oceny
                </button>
              </footer>
            </article>
          )}
        </section>

        {/* PRAWY PANEL — Poprzednie questy (ukryty, gdy pusto) */}
        {showRight && (
          <aside className="hidden shrink-0 lg:block lg:w-72">
            <div className="overflow-hidden rounded-lg border border-gh-border bg-gh-surface">
              <header className="border-b border-gh-border px-4 py-3 text-sm font-semibold text-gh-text">
                Poprzednie questy
              </header>
              <ul>
                {previousQuests.map((q) => (
                  <li
                    key={q.id}
                    className="border-b border-gh-border-muted px-4 py-3 last:border-b-0"
                  >
                    <div className="text-xs text-gh-subtle">{q.relativeDate}</div>
                    <div className="mt-0.5 text-sm text-gh-text">{q.title}</div>
                    <div className="truncate font-mono text-xs text-gh-muted">
                      {q.repoName}
                    </div>
                  </li>
                ))}
              </ul>
              <footer className="border-t border-gh-border px-4 py-3">
                <a
                  href="#"
                  className="text-sm text-gh-blue hover:underline"
                >
                  Zobacz historię →
                </a>
              </footer>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
