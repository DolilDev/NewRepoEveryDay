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

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  level: HeatLevel;
  description?: string;
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
  whyNew: string;
}

// --- Zalogowany gracz ------------------------------------------------------

export const currentUser = {
  id: "u-dolil",
  name: "Mateusz Dolny",
  login: "dolil",
  profileUrl: "#",
  joinedDate: "2025-09-12",
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

// --- Heatmapa (generowana deterministycznie za ostatni rok) ----------------

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

function generateHeatmap(): HeatmapDay[] {
  const days: HeatmapDay[] = [];

  // Start ~rok wstecz, wyrównany do poniedziałku (wiersze Pon–Nd).
  const start = new Date(TODAY);
  start.setUTCDate(start.getUTCDate() - 364);
  const mondayOffset = (start.getUTCDay() + 6) % 7; // 0 = poniedziałek
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  const cursor = new Date(start);
  while (cursor <= TODAY) {
    const date = isoDate(cursor);
    const h = hashString(date);

    // ~30% dni puste, reszta z rosnącą intensywnością.
    let level: HeatLevel;
    if (h % 10 < 3) {
      level = 0;
    } else {
      level = ((h % 4) + 1) as HeatLevel;
    }

    const day: HeatmapDay = { date, level };
    if (level > 0) {
      day.description = HEATMAP_DESCRIPTIONS[h % HEATMAP_DESCRIPTIONS.length];
    }
    days.push(day);

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Aktualny streak (12 dni) — ostatnie dni muszą być aktywne i spójne z UI.
  for (let i = 0; i < currentUser.currentStreak; i++) {
    const idx = days.length - 1 - i;
    if (idx < 0) break;
    const h = hashString(days[idx].date);
    days[idx].level = (((h % 3) + 2) as HeatLevel); // 2..4 — wyraźnie zielone
    days[idx].description = HEATMAP_DESCRIPTIONS[h % HEATMAP_DESCRIPTIONS.length];
  }

  return days;
}

export const heatmap: HeatmapDay[] = generateHeatmap();

// Odcienie zieleni jak na kalendarzu commitów GitHuba (ciemny motyw).
export const HEAT_COLORS: Record<HeatLevel, string> = {
  0: "#161b22",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
};

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
