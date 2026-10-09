"use client";

import { useEffect, useState } from "react";
import { showToast } from "./Toast";

export type ChecklistItem = { id: string; label: string; checked: boolean };

/**
 * 出发前清单（阶段 B）：勾选即 PATCH /api/plans/:id/checklist/:itemId 持久化，
 * 刷新后保留；请求失败时回滚并提示。
 */
export default function Checklist({ planId, items, readOnly = false }: { planId: string; items: ChecklistItem[]; readOnly?: boolean }) {
  const [state, setState] = useState<ChecklistItem[]>(items);
  const [pending, setPending] = useState<string | null>(null);

  // 同步服务端最新状态（其他标签页/刷新后）
  useEffect(() => {
    setState(items);
  }, [items]);

  const toggle = async (itemId: string) => {
    const current = state.find((i) => i.id === itemId);
    if (!current || pending) return;
    const nextChecked = !current.checked;
    setPending(itemId);
    // 乐观更新
    setState((prev) => prev.map((i) => (i.id === itemId ? { ...i, checked: nextChecked } : i)));
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(planId)}/checklist/${encodeURIComponent(itemId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked: nextChecked }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // 回滚
      setState((prev) => prev.map((i) => (i.id === itemId ? { ...i, checked: !nextChecked } : i)));
      showToast("勾选保存失败，请检查网络后重试");
    } finally {
      setPending(null);
    }
  };

  const doneCount = state.filter((i) => i.checked).length;

  return (
    <div className="side-card">
      <div className="section-kicker">BEFORE YOU GO</div>
      <h3 className="serif mb-2 text-xl font-medium">出发前清单</h3>
      <p className="mt-0 mb-4 text-[13px] leading-[1.8] text-muted">
        勾选进度 {doneCount}/{state.length}；{readOnly ? "示例路书不可保存修改。" : "勾选状态已随行程保存。"}
      </p>
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {state.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.7]">
              <input
                type="checkbox"
                checked={item.checked}
                disabled={readOnly || pending === item.id}
                onChange={() => toggle(item.id)}
                className="mt-1 size-4 shrink-0 accent-[#d9b46e]"
              />
              <span className={item.checked ? "text-soft line-through" : "text-ink"}>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
