"use client";

import { useEffect } from "react";
import { msUntilMidnightCET, formatHMS } from "@/lib/countdown";

// Keeps the browser tab title as `NERD (HH:MM:SS)`, counting down to the global
// quest submission deadline (CET/CEST midnight). Renders nothing.
export default function TitleCountdown() {
  useEffect(() => {
    const tick = () => {
      document.title = `NERD (${formatHMS(msUntilMidnightCET())})`;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
