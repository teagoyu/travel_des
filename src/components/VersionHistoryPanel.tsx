"use client";

import { useEffect, useState } from "react";
import { showToast } from "./Toast";
import Modal from "./Modal";
import type { PlanVersionDiff, PlanVersionMeta } from "@/lib/types";

export default function VersionHistoryPanel({ planId, currentVersion, readOnly, onClose }: { planId: string; currentVersion: number; readOnly: boolean; onClose: () => void }) {
  const [versions, setVersions] = useState<PlanVersionMeta[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [diffs, setDiffs] = useState<PlanVersionDiff[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/plans/${encodeURIComponent(planId)}/versions`)
      .then((response) => response.ok ? response.json() as Promise<{ versions?: PlanVersionMeta[] }> : { versions: [] })
      .then((data) => {
        const next = data.versions ?? [];
        setVersions(next);
        const previous = next.find((version) => version.version !== currentVersion);
        if (previous) setSelected(previous.version);
      })
      .catch(() => showToast("版本历史加载失败，请稍后重试"));
  }, [currentVersion, planId]);

  useEffect(() => {
    if (selected === null) { setDiffs([]); return; }
    fetch(`/api/plans/${encodeURIComponent(planId)}/versions/compare?from=${selected}&to=${currentVersion}`)
      .then((response) => response.ok ? response.json() as Promise<{ diffs?: PlanVersionDiff[] }> : { diffs: [] })
      .then((data) => setDiffs(data.diffs ?? []))
      .catch(() => setDiffs([]));
  }, [currentVersion, planId, selected]);

  const rollback = async () => {
    if (selected === null || readOnly || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(planId)}/versions/rollback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetVersion: selected, baseVersion: currentVersion }) });
      if (!response.ok) throw new Error("回退失败");
      const data = await response.json() as { version: number };
      showToast(`已回退并生成 v${data.version}`);
      window.location.reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "回退失败，请稍后重试");
      setBusy(false);
    }
  };

  return <div className="version-history-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="version-history-panel" role="dialog" aria-modal="true" aria-labelledby="version-history-title">
      <div className="version-history-panel__header"><div><div className="section-kicker">ROADBOOK VERSIONS</div><h3 id="version-history-title" className="serif m-0 mt-1 text-2xl font-medium">版本历史</h3><p className="m-0 mt-2 text-xs text-muted">当前版本 v{currentVersion} · 历史版本不会被删除</p></div><button type="button" className="day-edit-panel__close" onClick={onClose} aria-label="关闭版本历史">×</button></div>
      {readOnly && <div className="day-edit-panel__notice">示例路书仅供浏览，版本回退功能不可用。</div>}
      <div className="version-history-panel__body">
        <div className="version-history-panel__list">{versions.map((version) => <button key={version.version} type="button" className={`version-history-item${selected === version.version ? " is-selected" : ""}`} onClick={() => setSelected(version.version)}><span className="version-history-item__badge">v{version.version}</span><span><strong>{version.isCurrent ? "当前版本" : version.summary[0] ?? "路书版本"}</strong><small>{new Date(version.createdAt).toLocaleString("zh-CN", { hour12: false })}</small></span></button>)}</div>
        <div className="version-history-panel__compare"><div className="section-kicker">COMPARE · 对比</div><h4 className="serif m-0 mt-1 text-xl font-medium">{selected === null ? "选择一个历史版本" : `v${selected} → v${currentVersion}`}</h4>{selected !== null && (diffs.length ? <ul>{diffs.map((diff) => <li key={`${diff.dayIndex}-${diff.label}`} className={`version-diff version-diff--${diff.kind}`}><strong>DAY {String(diff.dayIndex).padStart(2, "0")}</strong><span>{diff.label}</span>{diff.from && <small>原：{diff.from}</small>}{diff.to && <small>新：{diff.to}</small>}</li>)}</ul> : <p className="text-sm text-muted">两个版本暂无结构化差异。</p>)}</div>
      </div>
      <div className="version-history-panel__footer"><button type="button" className="btn btn-small" onClick={onClose}>关闭</button><button type="button" className="btn btn-small day-edit-panel__submit" disabled={readOnly || selected === null || busy} onClick={() => setConfirm(true)}>{busy ? "正在回退…" : "回退到此版本 ↗"}</button></div>
    </section>
    {confirm && <Modal config={{ title: `确认回退到 v${selected}`, description: "系统会保留当前版本，并创建一个新的递增版本作为回退结果。", suggestions: [{ label: "确认回退", onSelect: () => { setConfirm(false); void rollback(); } }] }} open onClose={() => setConfirm(false)} />}
  </div>;
}
