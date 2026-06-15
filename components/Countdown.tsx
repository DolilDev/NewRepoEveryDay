"use client";

import { useEffect, useState } from "react";
import { msUntilMidnightCET, formatHMS } from "@/lib/countdown";

export default function Countdown() {
  // Start as null → the same render on the server and client (no hydration error).
  // The real value only appears after the component is mounted.
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setLabel(formatHMS(msUntilMidnightCET()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono tabular-nums text-gh-text">{label ?? "--:--:--"}</span>
  );
}
