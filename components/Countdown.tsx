"use client";

import { useEffect, useState } from "react";

// Czas do najbliższej północy CET (UTC+1) — zgodnie z planem to globalna
// strefa resetu questa dla wszystkich graczy.
function msUntilMidnightCET(): number {
  const now = new Date();
  // Bieżący czas przeliczony na CET (UTC+1), niezależnie od strefy przeglądarki.
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const cet = new Date(utcMs + 60 * 60_000);
  const nextMidnight = new Date(cet);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - cet.getTime();
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
