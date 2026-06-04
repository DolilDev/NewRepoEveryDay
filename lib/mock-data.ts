// ---------------------------------------------------------------------------
// DailyQuest — mock data (etap 1: szkielet UI)
//
// Wszystkie widoki czytają WYŁĄCZNIE z tego pliku. Gdy podłączymy backend,
// podmieniamy te eksporty na prawdziwe dane z API/bazy — UI zostaje bez zmian.
// Dane są deterministyczne (bez Math.random / new Date w trakcie generowania),
// żeby render po stronie serwera i klienta był identyczny (brak błędów hydracji).
// ---------------------------------------------------------------------------

// "Dziś" zakotwiczone na stałą datę — heatmapa i opisy są przez to stabilne.
// (Licznik do północy w UI używa prawdziwego czasu — to osobny, kliencki komponent.)
const TODAY = new Date(Date.UTC(2026, 5, 4)); // 2026-06-04

// --- Typy ------------------------------------------------------------------

export interface Player {
  id: string;
  name: string;
  login: string;
  profileUrl: string;
  currentStreak: number;
  longestStreak: number;
  totalQuests: number;
  points: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface ChatMessage {
  id: string;
  authorName: string;
  authorLogin: string;
  content: string;
  time: string; // HH:MM
}

export interface Quest {
  title: string;
  description: string;
  repoName: string;
  criteria: string[];
  openChallenge: string; // część otwarta — „zrób coś od siebie"
  whyNew: string;
}

// --- Zalogowany gracz ------------------------------------------------------

export const currentUser = {
  id: "u-dolil",
  name: "Mateusz Dolny",
  login: "dolil",
  profileUrl: "#",
  joinedDate: "2025-09-12",
  bio: "Codziennie buduję coś nowego. Realizuję questy DailyQuest i uczę się przez praktykę — jeden publiczny projekt dziennie. 🚀",
  followers: "21.2k",
  following: 312,
  currentStreak: 12,
  longestStreak: 28,
  totalQuests: 47,
  points: 1240,
};

// --- Dzisiejszy quest ------------------------------------------------------

export const todayQuest: Quest = {
  title: "Zbuduj narzędzie CLI w języku Rust",
  description:
    "Stwórz proste, ale w pełni działające narzędzie wiersza poleceń w Rust. " +
    "W Twoich publicznych repozytoriach nie ma jeszcze żadnego projektu w tym języku — " +
    "to Twój pierwszy raz z Rust. Narzędzie ma robić jedną rzecz dobrze: np. liczyć " +
    "statystyki pliku tekstowego (linie, słowa, znaki) albo konwertować formaty danych.",
  repoName: "daily-quest-rust-cli",
  criteria: [
    "Repozytorium jest publiczne i nazywa się dokładnie daily-quest-rust-cli",
    "Zawiera co najmniej jeden plik .rs z logiką programu",
    "Program przyjmuje argumenty z wiersza poleceń",
    "README opisuje, jak zbudować (cargo build) i uruchomić narzędzie",
    "Działa na realnym przykładzie pokazanym w README",
  ],
  openChallenge:
    "Wymagania powyżej to absolutne minimum. Dorzuć COŚ OD SIEBIE, czego nikt " +
    "Ci nie kazał robić — np. kolorowy output, flagę --json, obsługę wielu " +
    "plików naraz albo prosty benchmark prędkości. Ta część jest oceniana jako " +
    "Twoja inwencja i to ona realnie buduje portfolio.",
  whyNew:
    "W Twoich repo nie ma ani jednego projektu w Rust — to nowy język i nowy typ " +
    "narzędzia (CLI) w Twoim profilu.",
};

// --- Osiągnięcia (odznaki) -------------------------------------------------

export const achievements: Achievement[] = [
  {
    id: "first_quest",
    name: "Pierwszy quest",
    description: "Ukończ swój pierwszy quest",
    icon: "🎯",
    unlocked: true,
    unlockedDate: "2025-09-12",
  },
  {
    id: "streak_7",
    name: "7 dni z rzędu",
    description: "Utrzymaj streak przez 7 dni",
    icon: "🔥",
    unlocked: true,
    unlockedDate: "2025-09-19",
  },
  {
    id: "new_language",
    name: "Nowy język",
    description: "Ukończ quest w nieużywanym wcześniej języku",
    icon: "🌐",
    unlocked: true,
    unlockedDate: "2025-09-25",
  },
  {
    id: "quests_10",
    name: "10 questów",
    description: "Ukończ łącznie 10 questów",
    icon: "📦",
    unlocked: true,
    unlockedDate: "2025-10-03",
  },
  {
    id: "streak_30",
    name: "30 dni z rzędu",
    description: "Utrzymaj streak przez 30 dni",
    icon: "⚡",
    unlocked: false,
  },
  {
    id: "quests_50",
    name: "50 questów",
    description: "Ukończ łącznie 50 questów",
    icon: "🏆",
    unlocked: false,
  },
  {
    id: "streak_100",
    name: "100 dni z rzędu",
    description: "Utrzymaj streak przez 100 dni",
    icon: "💯",
    unlocked: false,
  },
];

// --- Ranking ---------------------------------------------------------------

export const leaderboard: Player[] = [
  { id: "u-zojka", name: "Zofia Wójcik", login: "zojka", profileUrl: "#", currentStreak: 41, longestStreak: 55, totalQuests: 53, points: 2310 },
  { id: "u-lmueller", name: "Lukas Müller", login: "lmueller", profileUrl: "#", currentStreak: 37, longestStreak: 49, totalQuests: 49, points: 2050 },
  { id: "u-mlewy", name: "Marek Lewandowski", login: "mlewy", profileUrl: "#", currentStreak: 33, longestStreak: 44, totalQuests: 60, points: 1980 },
  { id: "u-aishak", name: "Aisha Khan", login: "aishak", profileUrl: "#", currentStreak: 29, longestStreak: 35, totalQuests: 44, points: 1760 },
  { id: "u-hiro", name: "Hiro Tanaka", login: "hiro_t", profileUrl: "#", currentStreak: 21, longestStreak: 30, totalQuests: 38, points: 1520 },
  { id: "u-olenak", name: "Olena Kovalenko", login: "olenak", profileUrl: "#", currentStreak: 18, longestStreak: 22, totalQuests: 31, points: 1330 },
  {
    id: currentUser.id,
    name: currentUser.name,
    login: currentUser.login,
    profileUrl: currentUser.profileUrl,
    currentStreak: currentUser.currentStreak,
    longestStreak: currentUser.longestStreak,
    totalQuests: currentUser.totalQuests,
    points: currentUser.points,
  },
  { id: "u-samc", name: "Sam Carter", login: "samc", profileUrl: "#", currentStreak: 9, longestStreak: 14, totalQuests: 22, points: 980 },
  { id: "u-priyan", name: "Priya Nair", login: "priyan", profileUrl: "#", currentStreak: 6, longestStreak: 12, totalQuests: 17, points: 720 },
  { id: "u-tnovak", name: "Tomáš Novák", login: "tnovak", profileUrl: "#", currentStreak: 3, longestStreak: 8, totalQuests: 11, points: 410 },
];

// --- Czat ------------------------------------------------------------------

export const chatMessages: ChatMessage[] = [
  { id: "m1", authorName: "Zofia Wójcik", authorLogin: "zojka", content: "Dzień dobry! Kto już ogarnął dzisiejszy quest? 👀", time: "08:41" },
  { id: "m2", authorName: "Sam Carter", authorLogin: "samc", content: "Rust CLI... pierwszy raz dotykam cargo, życzcie mi szczęścia 😅", time: "08:43" },
  { id: "m3", authorName: "Marek Lewandowski", authorLogin: "mlewy", content: "@samc clap crate załatwia parsowanie argów w 5 minut, polecam", time: "08:47" },
  { id: "m4", authorName: "Aisha Khan", authorLogin: "aishak", content: "Zrobiłam wordcount, czyta z stdin i z pliku. README gotowe ✅", time: "09:02" },
  { id: "m5", authorName: "Hiro Tanaka", authorLogin: "hiro_t", content: "borrow checker mnie dziś pokonał ze 3 razy zanim się skompilowało 🦀", time: "09:15" },
  { id: "m6", authorName: "Olena Kovalenko", authorLogin: "olenak", content: "haha klasyk. ale jak już przejdzie to działa idealnie", time: "09:16" },
  { id: "m7", authorName: "Mateusz Dolny", authorLogin: "dolil", content: "Robię konwerter CSV→JSON. cargo build przeszło za pierwszym razem 🎉", time: "09:31" },
  { id: "m8", authorName: "Lukas Müller", authorLogin: "lmueller", content: "Nice @dolil! Wrzuć link jak skończysz, zerknę", time: "09:33" },
  { id: "m9", authorName: "Priya Nair", authorLogin: "priyan", content: "ktoś wie czy enum z match liczy się jako 'idiomatyczny rust' dla AI? 🤔", time: "09:40" },
  { id: "m10", authorName: "Zofia Wójcik", authorLogin: "zojka", content: "@priyan ocena patrzy na kryteria z questa, nie na styl. liczy się że działa", time: "09:42" },
  { id: "m11", authorName: "Tomáš Novák", authorLogin: "tnovak", content: "mój 3. dzień z rzędu, idziemy po siódemkę 🔥", time: "10:05" },
  { id: "m12", authorName: "Aisha Khan", authorLogin: "aishak", content: "Zaliczone! 100/100 za pierwszym podejściem 💪", time: "10:11" },
  { id: "m13", authorName: "Marek Lewandowski", authorLogin: "mlewy", content: "gratki 🎊 jutro pewnie dadzą nam coś z WebAssembly...", time: "10:14" },
  { id: "m14", authorName: "Hiro Tanaka", authorLogin: "hiro_t", content: "oby nie, dopiero co ogarnąłem ten borrow checker 😭", time: "10:16" },
];

// --- Opisy ukończonych questów + funkcje pomocnicze (współdzielone) --------

const HEATMAP_DESCRIPTIONS = [
  "Zbudował CLI do konwersji CSV w Go",
  "Napisał parser JSON od zera w Rust",
  "Stworzył bota na Discorda w Pythonie",
  "Zaimplementował drzewo czerwono-czarne w C",
  "Zrobił grę w życie (Conway) na canvasie",
  "Napisał własny mini-shell w C++",
  "Zbudował skracacz linków w Node.js",
  "Stworzył wizualizację algorytmów sortowania",
  "Napisał interpreter Brainfuck w TypeScript",
  "Zrobił raytracer mieszczący się w jednym pliku",
  "Zaimplementował cache LRU bez bibliotek",
  "Napisał prostego klienta HTTP w Zig",
  "Stworzył generator labiryntów (DFS)",
  "Zbudował kompresor Huffmana",
  "Napisał silnik szachowy z minimaxem",
  "Zrobił menedżer zadań TUI w Rust",
  "Zaimplementował własny rate-limiter",
  "Napisał konwerter Markdown → HTML",
  "Stworzył grę Snake w terminalu",
  "Zbudował REST API bez frameworka",
  "Napisał wizualizator pamięci w C",
  "Zrobił aplikację pogodową w Svelte",
  "Zaimplementował algorytm Dijkstry z podglądem",
  "Napisał własny system pluginów",
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Prosty, deterministyczny hash stringa → liczba bez znaku.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// (Dawna wielopoziomowa heatmapa usunięta — profil używa kalendarza binarnego
// QuestCalendar; HEATMAP_DESCRIPTIONS i helpery niżej są współdzielone.)

// --- Pomocnicze formatowanie dat (po polsku, bez zależności od Intl) -------

const PL_MONTHS_GENITIVE = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

const PL_MONTHS_SHORT = [
  "sty", "lut", "mar", "kwi", "maj", "cze",
  "lip", "sie", "wrz", "paź", "lis", "gru",
];

export function formatPlDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${PL_MONTHS_GENITIVE[m - 1]} ${y}`;
}

export function shortMonth(monthIndex: number): string {
  return PL_MONTHS_SHORT[monthIndex];
}

// ===========================================================================
// ETAP 2 — questy na żądanie, repozytoria questowe, kalendarz ukończeń
// ===========================================================================

// --- Stan generowania questa -----------------------------------------------
// Quest NIE generuje się automatycznie — user klika „Wygeneruj quest" (limit
// 1/dzień). Ta flaga ustawia DOMYŚLNY stan dashboardu: false = Stan A (brak
// questa), true = Stan B (quest widoczny). Na dashboardzie jest też przełącznik
// testowy, żeby łatwo zobaczyć oba stany bez ruszania tej flagi.
export const questGeneratedToday = false;

// --- Twoje questy (lewy panel dashboardu; od najstarszego do najnowszego) ---
export interface YourQuest {
  id: string;
  title: string;
  repoName: string;
}

export const yourQuests: YourQuest[] = [
  { id: "yq-01", title: "Lista TODO w terminalu", repoName: "daily-quest-todo-cli" },
  { id: "yq-02", title: "Generator bezpiecznych haseł", repoName: "daily-quest-passgen" },
  { id: "yq-03", title: "Skracacz linków w Node.js", repoName: "daily-quest-shortlink" },
  { id: "yq-04", title: "Gra w życie (Conway)", repoName: "daily-quest-game-of-life" },
  { id: "yq-05", title: "Interpreter Brainfuck", repoName: "daily-quest-bf-interpreter" },
  { id: "yq-06", title: "Kompresor Huffmana", repoName: "daily-quest-huffman" },
  { id: "yq-07", title: "Cache LRU bez bibliotek", repoName: "daily-quest-lru-cache" },
  { id: "yq-08", title: "Konwerter Markdown → HTML", repoName: "daily-quest-md2html" },
  { id: "yq-09", title: "Mini serwer HTTP bez frameworka", repoName: "daily-quest-bare-http" },
  { id: "yq-10", title: "Parser argumentów CLI w Go", repoName: "daily-quest-go-args" },
];

// --- Poprzednie questy (prawy panel dashboardu) -----------------------------
export interface PreviousQuest {
  id: string;
  title: string;
  repoName: string;
  relativeDate: string; // „Wczoraj", „2 dni temu", ...
}

// Pusta lista => panel „Poprzednie questy" w ogóle się nie pokazuje.
export const previousQuests: PreviousQuest[] = [
  { id: "pq-1", title: "Parser argumentów CLI w Go", repoName: "daily-quest-go-args", relativeDate: "Wczoraj" },
  { id: "pq-2", title: "Mini serwer HTTP bez frameworka", repoName: "daily-quest-bare-http", relativeDate: "2 dni temu" },
  { id: "pq-3", title: "Konwerter Markdown → HTML", repoName: "daily-quest-md2html", relativeDate: "3 dni temu" },
  { id: "pq-4", title: "Wizualizacja sortowania na canvasie", repoName: "daily-quest-sort-viz", relativeDate: "5 dni temu" },
  { id: "pq-5", title: "Cache LRU bez bibliotek", repoName: "daily-quest-lru-cache", relativeDate: "tydzień temu" },
];

// --- Repozytoria questowe (profil) ------------------------------------------
export interface Repo {
  name: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  updatedRelative: string;
  isPublic: boolean;
}

// Od najnowszego do najstarszego. Overview pokazuje pierwsze 6, zakładka
// Repositories — wszystkie.
export const questRepos: Repo[] = [
  { name: "daily-quest-rust-cli", description: "Narzędzie CLI w Rust liczące statystyki plików tekstowych.", language: "Rust", languageColor: "#dea584", stars: 14, updatedRelative: "3 godziny temu", isPublic: true },
  { name: "daily-quest-go-args", description: "Lekki parser argumentów wiersza poleceń napisany w Go.", language: "Go", languageColor: "#00ADD8", stars: 8, updatedRelative: "wczoraj", isPublic: true },
  { name: "daily-quest-bare-http", description: "Serwer HTTP zbudowany od zera, bez żadnego frameworka.", language: "TypeScript", languageColor: "#3178c6", stars: 23, updatedRelative: "2 dni temu", isPublic: true },
  { name: "daily-quest-md2html", description: "Konwerter Markdown → HTML z obsługą tabel i bloków kodu.", language: "Python", languageColor: "#3572A5", stars: 11, updatedRelative: "3 dni temu", isPublic: true },
  { name: "daily-quest-sort-viz", description: "Wizualizacja algorytmów sortowania na elemencie <canvas>.", language: "JavaScript", languageColor: "#f1e05a", stars: 31, updatedRelative: "5 dni temu", isPublic: true },
  { name: "daily-quest-lru-cache", description: "Implementacja cache LRU bez zewnętrznych bibliotek.", language: "C++", languageColor: "#f34b7d", stars: 6, updatedRelative: "tydzień temu", isPublic: true },
  { name: "daily-quest-huffman", description: "Kompresor i dekompresor plików oparty o kodowanie Huffmana.", language: "C", languageColor: "#555555", stars: 9, updatedRelative: "2 tygodnie temu", isPublic: true },
  { name: "daily-quest-game-of-life", description: "Gra w życie Conwaya renderowana wprost w terminalu.", language: "Zig", languageColor: "#ec915c", stars: 4, updatedRelative: "3 tygodnie temu", isPublic: true },
];

// --- Kalendarz ukończonych questów (profil) ---------------------------------
// WAŻNE: kalendarz jest BINARNY — dzień ukończony albo nie. Tylko jeden odcień
// zieleni (#39d353), bez stopniowania (inaczej niż dawna wielopoziomowa heatmapa).
export interface QuestDay {
  date: string; // YYYY-MM-DD
  done: boolean;
  description?: string;
}

export const QUEST_DONE_COLOR = "#39d353";
export const QUEST_EMPTY_COLOR = "#161b22";

function generateQuestCalendar(): QuestDay[] {
  const days: QuestDay[] = [];

  // Start ~rok wstecz, wyrównany do poniedziałku (wiersze Pon–Nd).
  const start = new Date(TODAY);
  start.setUTCDate(start.getUTCDate() - 364);
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  const cursor = new Date(start);
  while (cursor <= TODAY) {
    const date = isoDate(cursor);
    const h = hashString(date);
    const done = h % 100 < 40; // ~40% dni z ukończonym questem
    const day: QuestDay = { date, done };
    if (done) {
      day.description = HEATMAP_DESCRIPTIONS[h % HEATMAP_DESCRIPTIONS.length];
    }
    days.push(day);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Ostatnie `currentStreak` dni muszą być ukończone (spójność ze streakiem).
  for (let i = 0; i < currentUser.currentStreak; i++) {
    const idx = days.length - 1 - i;
    if (idx < 0) break;
    days[idx].done = true;
    const h = hashString(days[idx].date);
    days[idx].description = HEATMAP_DESCRIPTIONS[h % HEATMAP_DESCRIPTIONS.length];
  }

  return days;
}

export const questCalendar: QuestDay[] = generateQuestCalendar();

export const questsCompletedLastYear = questCalendar.filter((d) => d.done).length;
