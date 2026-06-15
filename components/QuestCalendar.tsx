"use client";

import { useMemo, useState } from "react";
import { QUEST_DONE_COLOR, QUEST_EMPTY_COLOR, type QuestDay } from "@/lib/calendar";
import { formatDate, shortMonth } from "@/lib/date";

const CELL = 11; // px
const GAP = 3; // px
const STEP = CELL + GAP;
const DAY_LABEL_WIDTH = 28; // px

// Day-of-week labels (rows Mon–Sun); GitHub shows every other one.
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

interface HoverState {
  day: QuestDay;
  x: number;
  y: number;
}

export default function QuestCalendar({
  days,
  completedCount,
}: {
  days: QuestDay[];
  completedCount: number;
}) {
  const [hover, setHover] = useState<HoverState | null>(null);

  // Data starts on Monday → we split it sequentially into weeks (columns).
  const weeks = useMemo(() => {
    const chunks: QuestDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  // Month labels above the columns — at each month change, without crowding.
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

  return (
    <div>
      <div className="mb-4 text-sm text-gh-muted">
        {completedCount} quests completed in the last year
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ minWidth: DAY_LABEL_WIDTH + weeks.length * STEP }}>
          {/* Month labels */}
          <div className="relative h-4" style={{ marginLeft: DAY_LABEL_WIDTH }}>
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

          {/* Day labels + grid */}
          <div className="flex">
            <div className="flex flex-col" style={{ width: DAY_LABEL_WIDTH, gap: GAP }}>
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
                        backgroundColor: day.done ? QUEST_DONE_COLOR : QUEST_EMPTY_COLOR,
                        borderRadius: 2,
                      }}
                      className="ring-1 ring-inset ring-white/[0.04]"
                      onMouseEnter={(e) => setHover({ day, x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) =>
                        setHover((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))
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

      {/* Legend (binary: completed / none) */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gh-muted">
        <span
          style={{
            width: CELL,
            height: CELL,
            backgroundColor: QUEST_EMPTY_COLOR,
            borderRadius: 2,
          }}
          className="ring-1 ring-inset ring-white/[0.04]"
        />
        <span>No quest</span>
        <span
          style={{
            width: CELL,
            height: CELL,
            backgroundColor: QUEST_DONE_COLOR,
            borderRadius: 2,
          }}
          className="ml-2 ring-1 ring-inset ring-white/[0.04]"
        />
        <span>Quest completed</span>
      </div>

      {/* Tooltip that follows the cursor */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 max-w-[260px] rounded-md border border-gh-border bg-gh-surface2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-semibold text-gh-text">{formatDate(hover.day.date)}</div>
          <div className="text-gh-muted">
            {hover.day.done ? hover.day.description : "No quest completed on this day"}
          </div>
        </div>
      )}
    </div>
  );
}
