"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Countdown from "@/components/Countdown";

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
  status?: "PENDING" | "PASSED" | "FAILED"; // brak = świeżo wygenerowany (PENDING)
};

// Odpowiedź oceny po zaliczeniu — do komunikatu sukcesu.
type SubmitResult = {
  descriptionOfWork: string;
  pointsAwarded: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
};

// Stan zgłoszenia questa do oceny (niezależny od fazy generowania).
type SubmitPhase = "idle" | "checking" | "passed" | "rejected" | "error";

// Pozycja panelu "Ostatnie questy" — prawdziwy quest z bazy.
type RecentQuest = {
  id: string;
  title: string;
  repoName: string;
  repoUrl: string;
  relativeDate: string;
};

// Repozytorium questowe do lewego panelu "Twoje ostatnie projekty" (z tabeli quests).
type Project = {
  id: string;
  name: string;
  title: string;
  repoUrl: string;
};

// Statystyki gracza — na razie do licznika streaka w nagłówku dashboardu.
type Stats = {
  currentStreak: number;
  longestStreak: number;
  totalQuests: number;
  points: number;
};

type Phase = "idle" | "loading" | "success" | "error";

const STORAGE_KEY = "dq:lastQuest";

// Klucz dnia (lokalny) — prosta, kliencka blokada „jeden quest dziennie".
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Polska odmiana słowa „dzień" przy liczbie: 1 dzień, 0/2/5/22… dni.
function dniLabel(n: number): string {
  return n === 1 ? "dzień" : "dni";
}

export default function DashboardPage() {
  const { status: authStatus } = useSession();
  const isAuthed = authStatus === "authenticated";

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<QuestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [recentQuests, setRecentQuests] = useState<RecentQuest[]>([]);

  // Dane gracza z bazy (statystyki + projekty questowe). meLoaded rozróżnia
  // „jeszcze ładuję" od „pusto" — pusty panel ma wyglądać jak start, nie błąd.
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meLoaded, setMeLoaded] = useState(false);

  // Zgłaszanie do oceny (osobny tor od generowania).
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitMissing, setSubmitMissing] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState("");

  // Quest uznany za ukończony: świeżo zaliczony w tej sesji albo PASSED z bazy.
  const completed = submitPhase === "passed" || result?.status === "PASSED";

  // Po odświeżeniu strony przywracamy dzisiejszy wynik z localStorage — to tylko
  // szybki HINT (działa offline / przed odpowiedzią API). Źródłem prawdy jest baza
  // (patrz loadQuests niżej), która ten stan potwierdzi albo skoryguje.
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

  // Źródło prawdy: questy z bazy. Ustawia panel "Ostatnie questy" oraz — gdy w
  // bazie jest dzisiejszy quest (limit 1/dzień) — pokazuje go zamiast przycisku.
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
          // brak localStorage — pomijamy hint
        }
      } else {
        // Baza nie ma dzisiejszego questa → przycisk generowania (nie ruszamy
        // trwającego generowania ani ekranu błędu).
        setPhase((p) => (p === "loading" || p === "error" ? p : "idle"));
        setResult((r) => (r ? null : r));
      }
    } catch {
      // sieć/serwer niedostępny — zostaje stan z localStorage (hint)
    }
  }, []);

  // Statystyki + projekty questowe zalogowanego gracza (lewy panel, licznik streaka).
  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats ?? null);
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch {
      // sieć/serwer niedostępny — zostaje poprzedni stan
    } finally {
      setMeLoaded(true);
    }
  }, []);

  // Po zalogowaniu (i przy starcie, jeśli już zalogowany) czytamy dane z bazy.
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
      // Odśwież panele "Ostatnie questy" i "Twoje ostatnie projekty" z bazy.
      loadQuests();
      loadMe();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Nieznany błąd.");
      setPhase("error");
    }
  }

  // Zgłoszenie dzisiejszego questa do oceny (GitHub + OpenAI — chwilę trwa).
  async function handleSubmit() {
    if (submitPhase === "checking") return;
    setSubmitPhase("checking");
    setSubmitError("");
    setSubmitMissing([]);
    try {
      const res = await fetch("/api/quest/submit", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Błąd serwera (${res.status}).`);
      }
      if (data.passed) {
        // alreadyCompleted: quest był już zaliczony wcześniej (brak nowych punktów).
        if (!data.alreadyCompleted) {
          setSubmitResult(data as SubmitResult);
        }
        setSubmitPhase("passed");
        loadQuests(); // odśwież status questa z bazy (PASSED)
        loadMe(); // odśwież licznik streaka po zaliczeniu
      } else {
        setSubmitMissing(Array.isArray(data.missing) ? data.missing : []);
        setSubmitPhase("rejected");
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Nieznany błąd.");
      setSubmitPhase("error");
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
            {isAuthed && !meLoaded ? (
              // Stan ładowania — odróżniony od pustego (puste ≠ błąd).
              <li className="py-4 text-sm text-gh-subtle">Ładowanie…</li>
            ) : filteredProjects.length === 0 ? (
              <li className="py-4 text-sm text-gh-subtle">
                {projectQuery.trim()
                  ? "Brak pasujących projektów."
                  : "Brak projektów — wygeneruj pierwszy quest."}
              </li>
            ) : (
              filteredProjects.map((p) => (
                <li key={p.id}>
                  <a
                    href={p.repoUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 flex-col gap-1 py-2"
                  >
                    {/* font-normal (400): Segoe UI nie ma kroju Medium (500),
                        więc 500 renderuje się jak Semibold (pogrubione). 400 ma
                        realny krój Regular i jest pewnie lżejsze, nie bold. */}
                    <span className="flex min-w-0 items-center gap-2 text-sm font-normal text-gh-text">
                      <RepoIcon />
                      <span className="truncate group-hover:underline">{p.name}</span>
                    </span>
                    {p.title && (
                      <span className="truncate pl-6 text-xs text-gh-muted">
                        {p.title}
                      </span>
                    )}
                  </a>
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>

      {/* WYŚRODKOWANY KONTENER TREŚCI (max 1280px) — tylko środek + prawy panel. */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        {/* Licznik streaka — z stats.currentStreak zalogowanego gracza (brak → 0). */}
        {isAuthed && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gh-border bg-gh-surface px-3 py-1 text-sm font-semibold text-gh-text">
              🔥 {stats?.currentStreak ?? 0}{" "}
              {dniLabel(stats?.currentStreak ?? 0)} z rzędu
            </span>
          </div>
        )}

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
                    {completed ? "Zaliczony 100/100" : "Repo utworzone"}
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

                  {/* Oddanie questa do automatycznej oceny */}
                  {completed ? (
                    // STAN: quest zaliczony
                    <div className="rounded-md border border-gh-green/40 bg-gh-green/10 px-4 py-4 text-sm">
                      <div className="mb-1 font-semibold text-gh-green">
                        Quest zaliczony! 🎉
                      </div>
                      {submitResult ? (
                        <p className="text-gh-text">
                          {submitResult.descriptionOfWork
                            ? `${submitResult.descriptionOfWork} `
                            : ""}
                          <span className="text-gh-muted">
                            +{submitResult.pointsAwarded} pkt · streak:{" "}
                            {submitResult.currentStreak}
                          </span>
                        </p>
                      ) : (
                        <p className="text-gh-muted">
                          Ten quest został już zaliczony.
                        </p>
                      )}
                    </div>
                  ) : (
                    // STAN: do oddania
                    <div className="rounded-md border border-gh-border bg-gh-bg px-4 py-4 text-sm">
                      <div className="mb-1 font-semibold text-gh-text">
                        Oddaj zadanie do sprawdzenia
                      </div>
                      <p className="mb-3 text-gh-muted">
                        Wykonaj zadanie zgodnie z plikiem{" "}
                        <span className="font-mono">QUEST.md</span>, wypchnij kod do
                        repozytorium i zgłoś do automatycznej oceny (sprawdzamy, czy
                        spełnione są wszystkie kryteria).
                      </p>

                      {submitPhase === "rejected" && (
                        <div className="mb-3 rounded-md border border-gh-red/40 bg-gh-red/10 px-3 py-3">
                          <div className="mb-1 font-semibold text-gh-red">
                            Jeszcze nie zaliczone
                          </div>
                          {submitMissing.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5 text-gh-text">
                              {submitMissing.map((m, i) => (
                                <li key={i}>{m}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gh-text">
                              Nie wszystkie kryteria są spełnione.
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gh-muted">
                            Popraw repozytorium i zgłoś ponownie.
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
                          ? "Sprawdzam repozytorium…"
                          : submitPhase === "rejected"
                            ? "Zgłoś ponownie"
                            : "Zgłoś do oceny"}
                      </button>
                    </div>
                  )}
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

          {/* PRAWY PANEL — Ostatnie questy: oś czasu z kropkami (max 5, z bazy) */}
          <aside className="lg:w-[312px] lg:shrink-0">
            <div className="rounded-md border border-gh-border bg-gh-panel p-4">
              <header className="mb-4 text-sm font-semibold text-gh-text">
                Ostatnie questy
              </header>

              {recentQuests.length === 0 ? (
                // Pusty stan — dyskretny tekst zamiast mocków.
                <p className="text-sm text-gh-subtle">
                  Nie masz jeszcze żadnych questów.
                </p>
              ) : (
                /* Oś czasu: JEDNA ciągła pionowa linia (#30363d) biegnąca od
                   pierwszej kropki aż do dołu obszaru zawartości panelu (nie
                   urywa się na ostatnim queście). Kropki to węzły siedzące na
                   osi, tekst odsunięty w prawo (gap-3). */
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
                          <a
                            href={q.repoUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group mt-1 block no-underline"
                          >
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
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
