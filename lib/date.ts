// Date helpers based on Europe/Warsaw time (CET/CEST) — a shared source of truth
// about which day is "today" for quests (reset at CET midnight, as in the UI).

const TZ = "Europe/Warsaw";

// Calendar components (year, month, day) in the Europe/Warsaw zone for a given
// instant. Intl handles DST transitions, so we don't compute the offset manually.
function warsawYmd(now: Date): [number, number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return [get("year"), get("month"), get("day")];
}

// Canonical "CET day" marker: UTC midnight of the calendar day in Europe/Warsaw.
// The same day always yields an identical Date, so it works as a key for the
// 1/day limit and for equality comparisons.
export function cetDayStart(now: Date = new Date()): Date {
  const [y, m, d] = warsawYmd(now);
  return new Date(Date.UTC(y, m - 1, d));
}

// CET day in YYYY-MM-DD format.
export function cetTodayIso(now: Date = new Date()): string {
  return cetDayStart(now).toISOString().slice(0, 10);
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Date from ISO (YYYY-MM-DD) in English, e.g. "June 4, 2026".
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// Short month name (0–11), e.g. 5 → "Jun" — labels above the calendar columns.
export function shortMonth(monthIndex: number): string {
  return MONTHS_SHORT[monthIndex];
}

// Month + year in English, e.g. "March 2021" (join date from GitHub).
// Accepts a full ISO 8601 string; computed in UTC to avoid shifting the day at a month boundary.
export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Relative description of a quest date in English ("Today", "Yesterday", "3 days ago",
// "a week ago", "2 weeks ago"), and for older ones — the full date.
// `day` is the canonical CET day (UTC midnight), compared against today's CET day.
export function relativeQuestDate(day: Date, now: Date = new Date()): string {
  const diffDays = Math.round((cetDayStart(now).getTime() - day.getTime()) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "a week ago";
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `${weeks} weeks ago`;
  return `${MONTHS[day.getUTCMonth()]} ${day.getUTCDate()}, ${day.getUTCFullYear()}`;
}
