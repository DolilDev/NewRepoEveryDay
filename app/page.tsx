"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Countdown from "@/components/Countdown";
import { questProjects, previousQuests } from "@/lib/mock-data";

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
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

type QuestResult = {
  title: string;
  repoName: string;
  repoUrl: string;
  questFileUrl: string;
  fileUploaded: boolean;
};

type Phase = "idle" | "loading" | "success" | "error";

const STORAGE_KEY = "dq:lastQuest";

// Klucz dnia (lokalny) — prosta, kliencka blokada „jeden quest dziennie".
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function DashboardPage() {
  const { status: authStatus } = useSession();
  const isAuthed = authStatus === "authenticated";

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<QuestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [projectQuery, setProjectQuery] = useState("");

  // Po odświeżeniu strony przywracamy dzisiejszy wynik (blokada na dziś).
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
      // brak/uszkodzony wpis — ignorujemy
    }
  }, []);

  const filteredProjects = useMemo(() => {
    const q = projectQuery.trim().toLowerCase();
    if (!q) return questProjects;
    return questProjects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projectQuery]);

  const recentQuests = previousQuests.slice(0, 5);

  async function handleGenerate() {
    if (phase === "loading") return;
    // Bez logowania nie ma tokenu do tworzenia repo — kierujemy na logowanie.
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
        throw new Error(data?.error || `Błąd serwera (${res.status}).`);
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
        // brak localStorage — blokada zadziała tylko w obrębie sesji strony
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Nieznany błąd.");
      setPhase("error");
    }
  }

  return (
    // Offset z lewej (lg) robi miejsce na panel przyklejony do krawędzi okna.
    <div className="lg:pl-[336px]">
      {/* LEWY PANEL — POZA wyśrodkowanym kontenerem: przyklejony do lewej krawędzi
          okna, pełna wysokość pod navbarem (fixed). Wizualnie nachodzi na stopkę,
          ale jej nie przesuwa (jest poza zwykłym przepływem). */}
      <aside className="flex flex-col border-b border-gh-border bg-gh-panel lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-10 lg:w-[336px] lg:border-b-0 lg:border-r lg:border-t">
        {/* Równa kolumna 287px wyśrodkowana w panelu 336px (49px marginesu).
            Nagłówek, pole wyszukiwania i lista mają tę samą lewą i prawą krawędź.
            pt-8 daje 32px odstępu POD linią navbara, zanim zacznie się nagłówek. */}
        <div className="mx-auto flex w-[287px] flex-1 flex-col pt-8 lg:min-h-0">
          <header className="pb-3 text-sm font-semibold text-gh-text">
            Twoje ostatnie projekty
          </header>
          {/* Sztywne pole 287×32px — nie rozciąga się ani nie kurczy. */}
          <div className="pb-1">
            <div className="flex h-8 w-[287px] items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-2 text-gh-subtle transition-colors focus-within:border-gh-blue">
              <SearchIcon />
              <input
                type="text"
                value={projectQuery}
                onChange={(e) => setProjectQuery(e.target.value)}
                placeholder="Znajdź projekt..."
                aria-label="Znajdź projekt po nazwie"
                className="w-full bg-transparent text-sm text-gh-text placeholder:text-gh-subtle focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-[420px] overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
            {filteredProjects.length === 0 ? (
              <li className="py-4 text-sm text-gh-subtle">
                Brak pasujących projektów.
              </li>
            ) : (
              filteredProjects.map((p) => (
                <li key={p.id}>
                  <a
                    href="#"
                    className="group flex min-w-0 flex-col gap-1 py-2"
                  >
                    {/* font-normal (400): Segoe UI nie ma kroju Medium (500),
                        więc 500 renderuje się jak Semibold (pogrubione). 400 ma
                        realny krój Regular i jest pewnie lżejsze, nie bold. */}
                    <span className="flex min-w-0 items-center gap-2 text-sm font-normal text-gh-text">
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
        </div>
      </aside>

      {/* WYŚRODKOWANY KONTENER TREŚCI (max 1280px) — tylko środek + prawy panel. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ŚRODEK — generowanie / realizacja questa (głębokie tło #010409) */}
          <section className="min-w-0 flex-1 bg-gh-bg-deep">
            {phase === "loading" ? (
              // STAN: generowanie w toku
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-gh-muted">
                <Spinner />
                <p className="text-sm">Generuję quest i tworzę repozytorium…</p>
                <p className="text-xs text-gh-subtle">To może chwilę potrwać.</p>
              </div>
            ) : phase === "error" ? (
              // STAN: błąd + ponowienie
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-4 text-center">
                <div className="max-w-md rounded-md border border-gh-red/40 bg-gh-red/10 px-4 py-4 text-sm text-gh-text">
                  <div className="mb-1 font-semibold text-gh-red">
                    Nie udało się wygenerować questa
                  </div>
                  <p className="text-gh-muted">{errorMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Spróbuj ponownie
                </button>
              </div>
            ) : phase === "success" && result ? (
              // STAN: repo utworzone
              <article className="overflow-hidden rounded-md border border-gh-border bg-gh-surface">
                <header className="flex items-center justify-between border-b border-gh-border bg-gh-surface2 px-4 py-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gh-muted">
                    Dzisiejszy quest
                  </span>
                  <span className="rounded-full border border-gh-green/40 bg-gh-green/10 px-2 py-1 text-xs font-semibold text-gh-green">
                    Repo utworzone
                  </span>
                </header>

                <div className="space-y-4 p-4">
                  <div className="rounded-md border border-gh-green/40 bg-gh-green/10 px-4 py-3 text-sm text-gh-text">
                    ✅ Repo zostało utworzone — cała instrukcja questa jest w nim
                    (plik <span className="font-mono">QUEST.md</span>).
                  </div>

                  <h2 className="text-xl font-semibold text-gh-text">
                    {result.title}
                  </h2>

                  {/* Nazwa repo */}
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gh-muted">
                      Twoje repozytorium
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-gh-border bg-gh-bg px-3 py-2">
                      <RepoIcon />
                      <span className="truncate font-mono text-sm text-gh-text">
                        {result.repoName}
                      </span>
                    </div>
                  </div>

                  {/* Linki do GitHuba (nowa karta) */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={result.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      Otwórz repozytorium na GitHubie ↗
                    </a>
                    {result.fileUploaded && (
                      <a
                        href={result.questFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-gh-border bg-gh-surface px-4 py-2 text-sm font-semibold text-gh-text transition-colors hover:bg-gh-surface2"
                      >
                        Zobacz QUEST.md ↗
                      </a>
                    )}
                  </div>

                  {!result.fileUploaded && (
                    <p className="text-xs text-gh-red">
                      Repo powstało, ale nie udało się dodać pliku QUEST.md —
                      możesz spróbować wygenerować quest ponownie jutro.
                    </p>
                  )}

                  {/* Jak oddać zadanie (na razie tekstowo) */}
                  <div className="rounded-md border border-gh-border bg-gh-bg px-4 py-4 text-sm">
                    <div className="mb-1 font-semibold text-gh-text">
                      Jak oddać zadanie do sprawdzenia
                    </div>
                    <p className="text-gh-muted">
                      Wykonaj zadanie zgodnie z instrukcją w pliku{" "}
                      <span className="font-mono">QUEST.md</span> i wypchnij kod do
                      tego repozytorium. Mechanizm zgłaszania i automatycznej oceny
                      dodamy w kolejnym etapie — na razie repo jest Twoją kartą
                      pracy.
                    </p>
                  </div>
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-gh-border bg-gh-surface2 px-4 py-4">
                  <div className="text-sm text-gh-muted">
                    <div>
                      Następny quest za <Countdown />
                      <span className="ml-1 text-gh-subtle">(północ CET)</span>
                    </div>
                    <div className="mt-1 text-xs text-gh-subtle">
                      Repozytorium musi pozostać publiczne.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="cursor-default rounded-md border border-gh-border bg-gh-surface px-4 py-2 text-sm font-semibold text-gh-muted"
                  >
                    Wygenerowano dziś
                  </button>
                </footer>
              </article>
            ) : (
              // STAN: bezczynny — duży przycisk na środku
              <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={authStatus === "loading"}
                  className="rounded-md bg-gh-green px-6 py-4 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-default disabled:opacity-60"
                >
                  {isAuthed
                    ? "Wygeneruj dzisiejszy quest"
                    : "Zaloguj się przez GitHub, aby wygenerować quest"}
                </button>
                {!isAuthed && authStatus !== "loading" && (
                  <p className="text-xs text-gh-subtle">
                    Quest tworzy publiczne repo na Twoim koncie GitHub.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* PRAWY PANEL — Ostatnie questy: oś czasu z kropkami (max 5; ukryty, gdy pusto) */}
          {recentQuests.length > 0 && (
            <aside className="lg:w-[312px] lg:shrink-0">
              <div className="rounded-md border border-gh-border bg-gh-panel p-4">
                <header className="mb-4 text-sm font-semibold text-gh-text">
                  Ostatnie questy
                </header>

                {/* Oś czasu: JEDNA ciągła pionowa linia (#30363d) biegnąca od
                    pierwszej kropki aż do dołu obszaru zawartości panelu (nie
                    urywa się na ostatnim queście). Kropki to węzły siedzące na
                    osi, tekst odsunięty w prawo (gap-3). */}
                <div className="relative">
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-[4px] top-2 w-px bg-gh-border"
                  />

                  <ol>
                    {recentQuests.map((q) => (
                      <li key={q.id} className="flex gap-3 pb-6">
                        {/* Kropka-węzeł na osi (linia przechodzi przez jej środek) */}
                        <div className="flex flex-col items-center" aria-hidden>
                          <span className="mt-1 h-[9px] w-[9px] shrink-0 rounded-full bg-gh-border" />
                        </div>

                        {/* Treść pozycji: czas (poza linkiem) + klikalny odnośnik
                            obejmujący tytuł i nazwę repo. Hover: obie linijki na
                            niebiesko (#58a6ff) z podkreśleniem, bez zmiany tła. */}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gh-muted">{q.relativeDate}</div>
                          <a href="#" className="group mt-1 block no-underline">
                            <div className="text-sm text-gh-text group-hover:text-gh-blue group-hover:underline">
                              {q.title}
                            </div>
                            <div className="truncate font-mono text-xs text-gh-muted group-hover:text-gh-blue group-hover:underline">
                              {q.repoName}
                            </div>
                          </a>
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* Link do pełnej historii — wyrównany do kolumny tekstu,
                      oś biegnie po jego lewej stronie aż do dołu. */}
                  <a
                    href="#"
                    className="ml-[21px] inline-block text-sm font-light text-gh-link-muted no-underline hover:text-gh-blue hover:no-underline"
                  >
                    Zobacz historię →
                  </a>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
