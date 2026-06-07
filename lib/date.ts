// Pomocnicze daty wg czasu Europe/Warsaw (CET/CEST) — wspólne źródło prawdy o
// tym, który dzień jest "dzisiaj" dla questów (reset o północy CET, jak w UI).

const TZ = "Europe/Warsaw";

// Składowe kalendarzowe (rok, miesiąc, dzień) wg strefy Europe/Warsaw dla danej
// chwili. Intl ogarnia przejścia DST, więc nie liczymy offsetu ręcznie.
function warsawYmd(now: Date): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return [get("year"), get("month"), get("day")];
}

// Kanoniczny znacznik "dnia CET": północ UTC kalendarzowego dnia wg Europe/Warsaw.
// Ten sam dzień zawsze daje identyczny Date, więc nadaje się jako klucz limitu
// 1/dzień i do porównań równościowych.
export function cetDayStart(now: Date = new Date()): Date {
  const [y, m, d] = warsawYmd(now);
  return new Date(Date.UTC(y, m - 1, d));
}

// Dzień CET w formacie YYYY-MM-DD.
export function cetTodayIso(now: Date = new Date()): string {
  return cetDayStart(now).toISOString().slice(0, 10);
}

const PL_MONTHS_GENITIVE = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];

const PL_MONTHS_SHORT = [
  "sty", "lut", "mar", "kwi", "maj", "cze",
  "lip", "sie", "wrz", "paź", "lis", "gru",
];

const PL_MONTHS_NOMINATIVE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

// Data z ISO (YYYY-MM-DD) po polsku, np. "4 czerwca 2026" (dopełniacz miesiąca).
export function formatPlDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${PL_MONTHS_GENITIVE[m - 1]} ${y}`;
}

// Skrót miesiąca (0–11), np. 5 → "cze" — etykiety nad kolumnami kalendarza.
export function shortMonth(monthIndex: number): string {
  return PL_MONTHS_SHORT[monthIndex];
}

// Miesiąc + rok po polsku, np. "marzec 2021" (data dołączenia z GitHuba).
// Przyjmuje pełny ISO 8601; liczone w UTC, by nie przesunąć dnia na granicy miesiąca.
export function formatPlMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${PL_MONTHS_NOMINATIVE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Względny opis daty questa po polsku ("Dzisiaj", "Wczoraj", "3 dni temu",
// "tydzień temu", "2 tygodnie temu"), a dla starszych — pełna data.
// `day` to kanoniczny dzień CET (północ UTC), porównywany z dzisiejszym dniem CET.
export function relativeQuestDate(day: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (cetDayStart(now).getTime() - day.getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return "Dzisiaj";
  if (diffDays === 1) return "Wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  if (diffDays < 14) return "tydzień temu";
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `${weeks} tygodnie temu`;
  return `${day.getUTCDate()} ${PL_MONTHS_GENITIVE[day.getUTCMonth()]} ${day.getUTCFullYear()}`;
}
