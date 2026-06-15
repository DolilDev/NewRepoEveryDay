// Shared countdown helpers: time left until the next CET/CEST midnight — the
// global deadline for submitting today's quest. Pure functions, safe on the
// client and the server.

// Milliseconds until the next midnight in the Europe/Warsaw timezone. DST
// (CET↔CEST) is handled by Intl, so there is no hardcoded UTC+1 offset.
export function msUntilMidnightCET(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  let h = get("hour");
  if (h === 24) h = 0; // some environments return "24" at midnight
  const elapsedMs =
    (h * 3600 + get("minute") * 60 + get("second")) * 1000 + now.getMilliseconds();
  return 24 * 3600 * 1000 - elapsedMs;
}

// Formats a millisecond duration as HH:MM:SS (clamped at zero).
export function formatHMS(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
