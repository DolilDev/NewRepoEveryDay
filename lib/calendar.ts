// Budowanie siatki kalendarza ukończeń (heatmapa binarna) z tabeli completions.
// WAŻNE: kalendarz jest BINARNY — dzień ukończony albo nie. Tylko jeden odcień
// zieleni (#39d353), bez stopniowania. Pusty kalendarz (brak ukończeń) to
// poprawny stan startowy, nie błąd: wszystkie pola puste, licznik 0.
import { cetDayStart } from "@/lib/date";

export interface QuestDay {
  date: string; // YYYY-MM-DD
  done: boolean;
  description?: string;
}

export const QUEST_DONE_COLOR = "var(--color-calendar-done)";
export const QUEST_EMPTY_COLOR = "var(--color-calendar-empty)";

// Wpis ukończenia potrzebny do kalendarza — data (kanoniczny dzień CET) i opis.
export interface CompletionInput {
  date: Date;
  descriptionOfWork: string | null;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Buduje siatkę Pon–Nd za ostatni rok (do dziś wg CET) na podstawie ukończeń.
// Zwraca dni do wyrenderowania oraz liczbę ukończeń w tym zakresie.
export function buildQuestCalendar(
  completions: CompletionInput[],
  now: Date = new Date(),
): { days: QuestDay[]; completedCount: number } {
  // Mapa: dzień (ISO) → opis pracy. completion.date to północ UTC dnia CET,
  // więc isoDate daje właściwy klucz dnia (spójnie z cetDayStart).
  const byDay = new Map<string, string | null>();
  for (const c of completions) {
    byDay.set(isoDate(c.date), c.descriptionOfWork);
  }

  // Start ~rok wstecz, wyrównany do poniedziałku (wiersze Pon–Nd).
  const today = cetDayStart(now);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 364);
  const mondayOffset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  const days: QuestDay[] = [];
  let completedCount = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const date = isoDate(cursor);
    const done = byDay.has(date);
    const day: QuestDay = { date, done };
    if (done) {
      const desc = byDay.get(date);
      if (desc) day.description = desc;
      completedCount++;
    }
    days.push(day);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return { days, completedCount };
}
