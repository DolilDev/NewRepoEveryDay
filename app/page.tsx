"use client";

import { useMemo, useState } from "react";
import Countdown from "@/components/Countdown";
import {
  currentUser,
  todayQuest,
  questProjects,
  previousQuests,
  questGeneratedToday,
} from "@/lib/mock-data";

function RepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gh-muted" aria-hidden>
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
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

export default function DashboardPage() {
  const [generated, setGenerated] = useState(questGeneratedToday);
  const [projectQuery, setProjectQuery] = useState("");

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return questProjects;
    return questProjects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projectQuery]);

  const recentQuests = previousQuests.slice(0, 5);

  return (
    // Offset z lewej (lg) robi miejsce na panel przyklejony do krawędzi okna.
    <div className="lg:pl-[336px]">
      {/* LEWY PANEL — POZA wyśrodkowanym kontenerem: przyklejony do lewej krawędzi
          okna, pełna wysokość pod navbarem (fixed). Wizualnie nachodzi na stopkę,
          ale jej nie przesuwa (jest poza zwykłym przepływem). */}
      <aside className="flex flex-col border-b border-gh-border bg-gh-bg lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-10 lg:w-[336px] lg:border-b-0 lg:border-r">
        <header className="px-4 py-4 text-sm font-semibold text-gh-text">
          Twoje ostatnie projekty
        </header>
        <div className="p-4">
          <div className="flex items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-2 py-1 text-gh-subtle transition-colors focus-within:border-gh-blue">
            <SearchIcon />
            <input
              type="text"
              value={projectQuery}
              onChange={(e) => setProjectQuery(e.target.value)}
              placeholder="Znajdź projekt..."
              aria-label="Znajdź projekt po nazwie"
              className="w-full bg-transparent py-1 text-sm text-gh-text placeholder:text-gh-subtle focus:outline-none"
            />
          </div>
        </div>
        <ul className="max-h-[420px] overflow-y-auto lg:max-h-none lg:flex-1">
          {filteredProjects.length === 0 ? (
            <li className="px-4 py-4 text-sm text-gh-subtle">
              Brak pasujących projektów.
            </li>
          ) : (
            filteredProjects.map((p) => (
              <li key={p.id}>
                <a
                  href="#"
                  className="group flex flex-col gap-1 px-4 py-2 transition-colors hover:bg-gh-surface2"
                >
                  <span className="flex items-center gap-2 truncate text-sm font-semibold text-gh-text">
                    <RepoIcon />
                    <span className="truncate group-hover:underline">{p.name}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gh-muted">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.languageColor }}
                      aria-hidden
                    />
                    {p.language}
                  </span>
                </a>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* WYŚRODKOWANY KONTENER TREŚCI (max 1280px) — tylko środek + prawy panel. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ŚRODEK — generowanie / realizacja questa */}
          <section className="min-w-0 flex-1">
            {/* Przełącznik testowy stanu A/B */}
            <div className="mb-4 flex items-center justify-end gap-2 text-xs text-gh-subtle">
              <span className="hidden sm:inline">Podgląd (test):</span>
              <div className="inline-flex overflow-hidden rounded-md border border-gh-border">
                <button
                  type="button"
                  onClick={() => setGenerated(false)}
                  className={`px-2 py-1 ${
                    !generated
                      ? "bg-gh-surface2 font-semibold text-gh-text"
                      : "text-gh-muted hover:text-gh-text"
                  }`}
                >
                  Przed
                </button>
                <button
                  type="button"
                  onClick={() => setGenerated(true)}
                  className={`border-l border-gh-border px-2 py-1 ${
                    generated
                      ? "bg-gh-surface2 font-semibold text-gh-text"
                      : "text-gh-muted hover:text-gh-text"
                  }`}
                >
                  Po
                </button>
              </div>
            </div>

            {!generated ? (
              // STAN A — tylko duży zielony przycisk, na środku
              <div className="flex min-h-[420px] items-center justify-center">
                <button
                  type="button"
                  onClick={() => setGenerated(true)}
                  className="rounded-md bg-gh-green px-6 py-4 text-base font-semibold text-white transition hover:brightness-110"
                >
                  Wygeneruj dzisiejszy quest
                </button>
              </div>
            ) : (
              // STAN B — karta questa
              <article className="overflow-hidden rounded-md border border-gh-border bg-gh-surface">
                <header className="flex items-center justify-between border-b border-gh-border bg-gh-surface2 px-4 py-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gh-muted">
                    Dzisiejszy quest
                  </span>
                  <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2 py-1 text-xs font-semibold text-gh-green">
                    Oczekuje na zgłoszenie
                  </span>
                </header>

                <div className="space-y-4 p-4">
                  <h2 className="text-xl font-semibold text-gh-text">
                    {todayQuest.title}
                  </h2>

                  {/* Pełna instrukcja */}
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                      Pełna instrukcja
                    </div>
                    <p className="leading-relaxed text-gh-muted">
                      {todayQuest.description}
                    </p>
                  </div>

                  {/* Narzucona nazwa repo */}
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                      Narzucona nazwa repozytorium
                    </div>
                    <div className="flex items-stretch overflow-hidden rounded-md border border-gh-border">
                      <span className="flex items-center gap-2 border-r border-gh-border bg-gh-surface2 px-2 py-2 text-sm text-gh-muted">
                        <RepoIcon />
                        github.com/{currentUser.login}/
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={todayQuest.repoName}
                        aria-label="Narzucona nazwa repozytorium"
                        className="min-w-0 flex-1 cursor-default bg-gh-bg px-2 py-2 font-mono text-sm text-gh-text focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Kryteria zaliczenia */}
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                      Kryteria zaliczenia
                    </div>
                    <ul className="space-y-2">
                      {todayQuest.criteria.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span
                            className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gh-border bg-gh-bg"
                            aria-hidden
                          />
                          <span className="text-gh-text">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Część otwarta — zrób coś od siebie */}
                  <div className="rounded-md border border-gh-green/40 bg-gh-green/10 px-4 py-4">
                    <div className="mb-1 text-sm font-semibold text-gh-green">
                      ✨ Twoja swoboda — zrób coś od siebie
                    </div>
                    <p className="text-sm text-gh-muted">{todayQuest.openChallenge}</p>
                  </div>

                  {/* Dlaczego to nowość */}
                  <div className="rounded-md border border-gh-border bg-gh-bg px-4 py-4 text-sm">
                    <span className="font-semibold text-gh-text">
                      💡 Dlaczego to dla Ciebie nowe:{" "}
                    </span>
                    <span className="text-gh-muted">{todayQuest.whyNew}</span>
                  </div>
                </div>

                {/* Stopka karty: licznik + zgłoszenie */}
                <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gh-border bg-gh-surface2 px-4 py-4">
                  <div className="text-sm text-gh-muted">
                    <div>
                      Quest resetuje się za <Countdown />
                      <span className="ml-1 text-gh-subtle">(północ CET)</span>
                    </div>
                    <div className="mt-1 text-xs text-gh-subtle">
                      Repozytorium musi być publiczne.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Zgłoś do oceny
                  </button>
                </footer>
              </article>
            )}
          </section>

          {/* PRAWY PANEL — Ostatnie questy (max 5; ukryty, gdy pusto) */}
          {recentQuests.length > 0 && (
            <aside className="lg:w-[300px] lg:shrink-0">
              <div className="overflow-hidden rounded-md border border-gh-border bg-gh-surface">
                <header className="border-b border-gh-border px-4 py-4 text-sm font-semibold text-gh-text">
                  Ostatnie questy
                </header>
                <ul>
                  {recentQuests.map((q) => (
                    <li
                      key={q.id}
                      className="border-b border-gh-border-muted px-4 py-4 last:border-b-0"
                    >
                      <div className="text-xs text-gh-subtle">{q.relativeDate}</div>
                      <div className="mt-1 text-sm text-gh-text">{q.title}</div>
                      <div className="truncate font-mono text-xs text-gh-muted">
                        {q.repoName}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
