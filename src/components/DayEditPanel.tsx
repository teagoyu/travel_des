"use client";

import { useEffect, useState } from "react";
import type { DayEditDraft, DayPlan } from "@/lib/types";
import { createDayEditDraft } from "@/lib/tripTools";

type DayEditPanelProps = {
  day: DayPlan;
  readOnly?: boolean;
  busy?: boolean;
  onSubmit: (draft: DayEditDraft) => void;
  onClose: () => void;
};

export default function DayEditPanel({ day, readOnly = false, busy = false, onSubmit, onClose }: DayEditPanelProps) {
  const [draft, setDraft] = useState<DayEditDraft>(() => createDayEditDraft(day));
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  const update = <K extends keyof DayEditDraft>(key: K, value: DayEditDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const moveStop = (index: number, offset: number) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= draft.stops.length) return;
    const stops = [...draft.stops];
    [stops[index], stops[nextIndex]] = [stops[nextIndex], stops[index]];
    update("stops", stops);
  };
  const removeStop = (index: number) => update("stops", draft.stops.filter((_, stopIndex) => stopIndex !== index));
  const addStop = () => update("stops", [...draft.stops, { id: `${day.dayIndex}-custom-${Date.now()}`, name: "新停留点", note: "请补充想去的地点或活动" }]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.departureTime || !draft.stayCity.trim()) { setError("请填写出发时间和住宿城市"); return; }
    if (draft.maxDriveHours < 1 || draft.maxDriveHours > 12) { setError("驾驶上限需在 1–12 小时之间"); return; }
    if (!draft.stops.length) { setError("至少保留一个停留点"); return; }
    setError("");
    onSubmit({ ...draft, stayCity: draft.stayCity.trim(), stops: draft.stops.filter((stop) => stop.name.trim()) });
  };

  return (
    <div className="day-edit-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="day-edit-panel" role="dialog" aria-modal="true" aria-labelledby="day-edit-title">
        <div className="day-edit-panel__header">
          <div>
            <div className="section-kicker">EDIT DAY {String(day.dayIndex).padStart(2, "0")}</div>
            <h3 id="day-edit-title" className="serif m-0 mt-1 text-2xl font-medium">调整第 {day.dayIndex} 天</h3>
            <p className="m-0 mt-2 text-xs text-muted">修改的是 AI 重排意图，原路线会保留为上一版本。</p>
          </div>
          <button type="button" className="day-edit-panel__close" onClick={onClose} disabled={busy} aria-label="关闭编辑面板">×</button>
        </div>
        {readOnly && <div className="day-edit-panel__notice">示例路书仅供浏览，请创建自己的路书后调整行程。</div>}
        <form onSubmit={submit}>
          <div className="day-edit-panel__fields">
            <label>出发时间<input type="time" value={draft.departureTime} onChange={(event) => update("departureTime", event.target.value)} disabled={readOnly || busy} /></label>
            <label>驾驶上限（小时）<input type="number" min="1" max="12" step="1" value={draft.maxDriveHours} onChange={(event) => update("maxDriveHours", Number(event.target.value))} disabled={readOnly || busy} /></label>
            <label className="day-edit-panel__wide">住宿城市<input value={draft.stayCity} onChange={(event) => update("stayCity", event.target.value)} disabled={readOnly || busy} /></label>
          </div>
          <div className="day-edit-panel__stops-head">
            <div><strong>停留点顺序</strong><span>可调整当天的重点停留</span></div>
            <button type="button" className="day-edit-panel__add" onClick={addStop} disabled={readOnly || busy}>＋ 添加停留点</button>
          </div>
          <ol className="day-edit-panel__stops">
            {draft.stops.map((stop, index) => (
              <li key={stop.id}>
                <span className="day-edit-panel__index">{String(index + 1).padStart(2, "0")}</span>
                <input value={stop.name} onChange={(event) => update("stops", draft.stops.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} disabled={readOnly || busy} aria-label={`停留点 ${index + 1}`} />
                <div className="day-edit-panel__stop-actions">
                  <button type="button" onClick={() => moveStop(index, -1)} disabled={readOnly || busy || index === 0} aria-label={`上移停留点 ${index + 1}`}>↑<span>上移</span></button>
                  <button type="button" onClick={() => moveStop(index, 1)} disabled={readOnly || busy || index === draft.stops.length - 1} aria-label={`下移停留点 ${index + 1}`}>↓<span>下移</span></button>
                  <button type="button" onClick={() => removeStop(index)} disabled={readOnly || busy || draft.stops.length === 1} aria-label={`删除停留点 ${index + 1}`}>×<span>删除</span></button>
                </div>
              </li>
            ))}
          </ol>
          {error && <p className="field-error" role="alert">{error}</p>}
          <div className="day-edit-panel__footer">
            <button type="button" className="btn btn-small" onClick={onClose} disabled={busy}>取消</button>
            <button type="submit" className="btn btn-small day-edit-panel__submit" disabled={readOnly || busy}>{busy ? "AI 正在重排…" : "让 AI 重排这一天 ↗"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
