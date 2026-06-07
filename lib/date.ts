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
