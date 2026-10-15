"use client";

import { useCallback, useEffect, useState } from "react";
import { showToast } from "./Toast";
import type { SavedRecommendation } from "@/lib/types";

export default function SavedRecommendations({ planId, dayIndex, readOnly = false }: { planId?: string; dayIndex: number; readOnly?: boolean }) {
  const [items, setItems] = useState<SavedRecommendation[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!planId || readOnly) { setItems([]); return; }
    fetch(`/api/plans/${encodeURIComponent(planId)}/saved-recommendations?day=${dayIndex}`)
      .then((response) => response.ok ? response.json() as Promise<{ items?: SavedRecommendation[] }> : { items: [] })
      .then((data) => setItems(data.items ?? []))
      .catch(() => showToast("收藏加载失败，请稍后重试"));
  }, [dayIndex, planId, readOnly]);

  useEffect(() => {
    load();
    const onSaved = (event: Event) => { if ((event as CustomEvent<{ dayIndex?: number }>).detail?.dayIndex === dayIndex) load(); };
    window.addEventListener("roadbook:saved-recommendation", onSaved);
    return () => window.removeEventListener("roadbook:saved-recommendation", onSaved);
  }, [dayIndex, load]);

  const remove = async (item: SavedRecommendation) => {
    if (!planId || removing) return;
    setRemoving(item.recommendationId);
    const previous = items;
    setItems((current) => current.filter((saved) => saved.recommendationId !== item.recommendationId));
    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(planId)}/saved-recommendations/${encodeURIComponent(item.recommendationId)}?day=${dayIndex}`, { method: "DELETE" });
      if (!response.ok) throw new Error("移除失败");
      showToast("已从当天收藏中移除");
      window.dispatchEvent(new CustomEvent("roadbook:saved-recommendation", { detail: { dayIndex } }));
    } catch { setItems(previous); showToast("移除收藏失败，请稍后重试"); }
    finally { setRemoving(null); }
  };

  return <section className="saved-recommendations" data-testid="saved-recommendations" aria-label="当天收藏"><div className="saved-recommendations__head"><div><div className="section-kicker">SAVED STOPS</div><h4 className="serif m-0 mt-1 text-xl font-medium">我的收藏</h4></div><span>DAY {String(dayIndex).padStart(2, "0")}</span></div>{items.length ? <div className="saved-recommendations__list">{items.slice(0, 6).map((item) => <div key={item.recommendationId} className="saved-recommendation-item"><div><strong>{item.name}</strong><small>{item.type ?? "推荐地点"} · {item.address ?? "地址待核验"}</small></div><button type="button" onClick={() => remove(item)} disabled={removing === item.recommendationId}>移除收藏</button></div>)}</div> : <p className="saved-recommendations__empty">还没有收藏。可以从右侧景点或美食推荐中加入当天。</p>}</section>;
}
