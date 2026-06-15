// Building the completions calendar grid (binary heatmap) from the completions table.
// IMPORTANT: the calendar is BINARY — a day is either completed or not. Only one shade
// of green (#39d353), with no gradation. An empty calendar (no completions) is a
// valid starting state, not an error: all cells empty, count 0.
import { cetDayStart } from "@/lib/date";

export interface QuestDay {
  date: string; // YYYY-MM-DD
  done: boolean;
  description?: string;
}

export const QUEST_DONE_COLOR = "var(--color-calendar-done)";
export const QUEST_EMPTY_COLOR = "var(--color-calendar-empty)";

// A completion entry needed for the calendar — date (canonical CET day) and description.
export interface CompletionInput {
  date: Date;
  descriptionOfWork: string | null;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Builds a Mon–Sun grid for the last year (up to today in CET) based on completions.
// Returns the days to render and the number of completions in that range.
export function buildQuestCalendar(
  completions: CompletionInput[],
  now: Date = new Date(),
): { days: QuestDay[]; completedCount: number } {
  // Map: day (ISO) → work description. completion.date is UTC midnight of the CET day,
  // so isoDate yields the correct day key (consistent with cetDayStart).
  const byDay = new Map<string, string | null>();
  for (const c of completions) {
    byDay.set(isoDate(c.date), c.descriptionOfWork);
  }

  // Start ~one year back, aligned to Monday (Mon–Sun rows).
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
