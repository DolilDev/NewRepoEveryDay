"use client";

import { useEffect, useState } from "react";

// Czas do najbliższej północy w strefie Europe/Warsaw — globalny reset questa.
// Czytamy realny zegar ścienny w Warszawie przez Intl, więc DST (CET↔CEST) jest
// obsłużony automatycznie (bez sztywnego offsetu UTC+1).
function msUntilMidnightCET(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  let h = get("hour");
  if (h === 24) h = 0; // część środowisk zwraca "24" o północy
  const elapsedMs =
    (h * 3600 + get("minute") * 60 + get("second")) * 1000 +
    now.getMilliseconds();
  return 24 * 3600 * 1000 - elapsedMs;
}

function format(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function Countdown() {
  // Start jako null → ten sam render na serwerze i kliencie (brak błędu hydracji).
  // Realna wartość pojawia się dopiero po zamontowaniu komponentu.
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(format(msUntilMidnightCET()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono tabular-nums text-gh-text">
      {label ?? "--:--:--"}
    </span>
  );
}
