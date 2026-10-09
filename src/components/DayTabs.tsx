"use client";

import { useEffect, useRef } from "react";
import type { DayPlan } from "@/lib/types";

/** 日期导航条：手机端横向滚动（方案 §4） */
export default function DayTabs({
  days,
  selected,
  onSelect,
}: {
  days: DayPlan[];
  selected: number; // 0-based
  onSelect: (index: number) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // 键盘 ←/→ 切换日期（roving tabindex）
  useEffect(() => {
    activeRef.current?.focus({ preventScroll: true });
  }, [selected]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onSelect(Math.min(selected + 1, days.length - 1));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onSelect(Math.max(selected - 1, 0));
    }
  };

  return (
    <div
      className="days-strip -mx-1 flex gap-2 overflow-x-auto [scroll-snap-type:x_mandatory] md:grid md:grid-cols-7 md:overflow-visible"
      role="tablist"
      aria-label="选择旅行日期"
      onKeyDown={handleKeyDown}
    >
      {days.map((day, index) => {
        const active = index === selected;
        return (
          <button
            key={day.dayIndex}
            ref={active ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="day-detail"
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(index)}
            className={`day-tab min-w-[80px] shrink-0 [scroll-snap-align:start] md:min-w-0 ${
              active ? "active" : ""
            }`}
          >
            <strong className="serif block text-[21px] font-medium">
              {String(index + 1).padStart(2, "0")}
            </strong>
            <span className="mt-1 block text-[11px]">{shortLabel(day)}</span>
          </button>
        );
      })}
    </div>
  );
}

function shortLabel(day: DayPlan): string {
  const from = day.start.name;
  const to = day.end.name;
  if (from === to) return `${from} · 慢行`;
  return `${from} → ${to}`;
}
