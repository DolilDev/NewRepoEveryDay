"use client";

import { useMemo, useState } from "react";
import {
  heatmap,
  HEAT_COLORS,
  formatPlDate,
  shortMonth,
  type HeatmapDay,
} from "@/lib/mock-data";

const CELL = 11; // px
const GAP = 3; // px
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 28; // px — szerokość kolumny z etykietami dni

// Etykiety dni tygodnia (wiersze Pon–Nd); GitHub pokazuje co drugą.
const DAY_LABELS = ["Pon", "", "Śr", "", "Pt", "", "Nd"];

interface HoverState {
  day: HeatmapDay;
  x: number;
  y: number;
}

export default function Heatmap() {
  const [hover, setHover] = useState<HoverState | null>(null);

  // Dane startują od poniedziałku → dzielimy sekwencyjnie na tygodnie (kolumny).
  const weeks = useMemo(() => {
    const chunks: HeatmapDay[][] = [];
    for (let i = 0; i < heatmap.length; i += 7) {
      chunks.push(heatmap.slice(i, i + 7));
    }
    return chunks;
  }, []);

  // Etykiety miesięcy nad kolumnami — przy zmianie miesiąca, bez tłoku.
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const first = week[0];
      if (!first) return;
      const month = Number(first.date.slice(5, 7)) - 1;
      if (month !== lastMonth) {
        const prev = labels[labels.length - 1];
        if (!prev || col - prev.col >= 3) {
          labels.push({ col, label: shortMonth(month) });
        }
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const activeDays = useMemo(
    () => heatmap.filter((d) => d.level > 0).length,
    [],
  );

  return (
    <div>
      <div className="mb-3 text-sm text-gh-muted">
        {activeDays} questów ukończonych w ostatnim roku
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: DAY_LABEL_WIDTH + weeks.length * STEP }}>
          {/* Etykiety miesięcy */}
          <div
            className="relative h-4"
            style={{ marginLeft: DAY_LABEL_WIDTH }}
          >
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.col}`}
                className="absolute text-xs text-gh-muted"
                style={{ left: m.col * STEP }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Etykiety dni + siatka */}
          <div className="flex">
            <div
              className="flex flex-col"
              style={{ width: DAY_LABEL_WIDTH, gap: GAP }}
            >
              {DAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="text-[10px] leading-none text-gh-muted"
                  style={{ height: CELL, lineHeight: `${CELL}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day) => (
                    <div
                      key={day.date}
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: HEAT_COLORS[day.level],
                        borderRadius: 2,
                      }}
                      className="ring-1 ring-inset ring-white/[0.04]"
                      onMouseEnter={(e) =>
                        setHover({ day, x: e.clientX, y: e.clientY })
                      }
                      onMouseMove={(e) =>
                        setHover((h) =>
                          h ? { ...h, x: e.clientX, y: e.clientY } : h,
                        )
                      }
                      onMouseLeave={() => setHover(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-gh-muted">
        <span>Mniej</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <span
            key={lvl}
            style={{
              width: CELL,
              height: CELL,
              backgroundColor: HEAT_COLORS[lvl],
              borderRadius: 2,
            }}
            className="ring-1 ring-inset ring-white/[0.04]"
          />
        ))}
        <span>Więcej</span>
      </div>

      {/* Tooltip podążający za kursorem */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 max-w-[260px] rounded-md border border-gh-border bg-gh-surface2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-semibold text-gh-text">
            {formatPlDate(hover.day.date)}
          </div>
          <div className="text-gh-muted">
            {hover.day.description ?? "Brak aktywności tego dnia"}
          </div>
        </div>
      )}
    </div>
  );
}
