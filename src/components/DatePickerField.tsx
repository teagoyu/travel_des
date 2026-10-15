"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { beijingDateOffset } from "@/lib/tripForm";

type DatePickerFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const fallback = new Date();
  return {
    year: Number.isFinite(year) ? year : fallback.getFullYear(),
    month: Number.isFinite(month) ? month - 1 : fallback.getMonth(),
    day: Number.isFinite(day) ? day : fallback.getDate(),
  };
}

function formatDate(value: string) {
  return value.replaceAll("-", "/");
}

export default function DatePickerField({ id, value, onChange, error }: DatePickerFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => parseDate(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState({ year: selected.year, month: selected.month });
  const today = beijingDateOffset(0);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const daysInMonth = new Date(Date.UTC(viewDate.year, viewDate.month + 1, 0)).getUTCDate();
  const firstDay = (new Date(Date.UTC(viewDate.year, viewDate.month, 1)).getUTCDay() + 6) % 7;
  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    if (index < firstDay) return null;
    return index - firstDay + 1;
  });

  const moveMonth = (offset: number) => {
    const next = new Date(Date.UTC(viewDate.year, viewDate.month + offset, 1));
    setViewDate({ year: next.getUTCFullYear(), month: next.getUTCMonth() });
  };

  const selectDate = (day: number) => {
    const next = toIsoDate(viewDate.year, viewDate.month, day);
    if (next < today) return;
    onChange(next);
    setOpen(false);
  };

  const selectToday = () => {
    const next = parseDate(today);
    setViewDate({ year: next.year, month: next.month });
    onChange(today);
    setOpen(false);
  };

  return (
    <div className="field date-picker" ref={rootRef}>
      <label htmlFor={id}>出发日期</label>
      <div className="date-picker__control">
        <button
          type="button"
          id={id}
          className="date-picker__trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-calendar`}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => {
            setViewDate({ year: selected.year, month: selected.month });
            setOpen((current) => !current);
          }}
        >
          <span className="date-field__icon" aria-hidden="true">▣</span>
          <span className="date-picker__value">{formatDate(value)}</span>
          <span className="date-picker__trigger-icon" aria-hidden="true">⌄</span>
        </button>
        <input id={`${id}-native`} className="date-picker__native" type="date" value={value} onChange={(event) => onChange(event.target.value)} tabIndex={-1} aria-hidden="true" />
      </div>
      {open && (
        <div id={`${id}-calendar`} className="date-picker__calendar" role="dialog" aria-label="选择出发日期">
          <div className="date-picker__header">
            <div>
              <span className="date-picker__eyebrow">出发日期</span>
              <strong>{viewDate.year}年{viewDate.month + 1}月</strong>
            </div>
            <div className="date-picker__nav">
              <button type="button" aria-label="上个月" onClick={() => moveMonth(-1)}>←</button>
              <button type="button" aria-label="下个月" onClick={() => moveMonth(1)}>→</button>
            </div>
          </div>
          <div className="date-picker__weekdays" aria-hidden="true">
            {WEEKDAYS.map((weekday) => <span key={weekday}>周{weekday}</span>)}
          </div>
          <div className="date-picker__grid">
            {days.map((day, index) => {
              if (day === null) return <span className="date-picker__blank" key={`blank-${index}`} aria-hidden="true" />;
              const iso = toIsoDate(viewDate.year, viewDate.month, day);
              const isSelected = iso === value;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  className={`date-picker__day${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                  aria-label={`${viewDate.year}年${viewDate.month + 1}月${day}日`}
                  aria-pressed={isSelected}
                  disabled={iso < today}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <button type="button" className="date-picker__today" onClick={selectToday}>回到今天</button>
        </div>
      )}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}
