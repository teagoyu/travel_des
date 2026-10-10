"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { DayPlan, Recommendation } from "@/lib/types";

const themeImages: Record<string, string> = {
  "city-day": "/themes/city-day.png",
  "city-night": "/themes/city-night.png",
  "snow-mountain": "/themes/snow-mountain.png",
  "lake-sunset": "/themes/lake-sunset.png",
  "old-town": "/themes/old-town.png",
  "highway-return": "/themes/highway-return.png",
  "forest-road": "/themes/forest-road.png",
};

function scenicFallback(day: DayPlan): Recommendation[] {
  const photo = day.photoTips[0];
  if (!photo) return [];
  return [{
    id: `scenic-${day.dayIndex}`,
    name: photo.title.replace(/\s*·.*$/, ""),
    address: photo.place?.address ?? day.end.name,
    type: "沿途风景",
    imageUrl: themeImages[day.imageTheme ?? "forest-road"],
    navigationUrl: photo.place?.navigationUrl,
    source: photo.source ?? { provider: "roadbook-theme", fetchedAt: new Date().toISOString(), status: "estimated" },
  }];
}

export default function Recommendations({ day, planId, readOnly = false }: { day: DayPlan; planId?: string; readOnly?: boolean }) {
  const [tab, setTab] = useState<"hotel" | "attraction" | "restaurant">("hotel");
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === "hotel") { setItems((day.hotels ?? []).map((hotel) => ({ ...hotel, source: hotel.source }))); return; }
    if (!planId || readOnly) { setItems(tab === "attraction" ? scenicFallback(day) : []); return; }
    setLoading(true);
    fetch(`/api/plans/${encodeURIComponent(planId)}/recommendations?day=${day.dayIndex}&type=${tab}`)
      .then((response) => response.ok ? response.json() : { items: [] })
      .then((data: { items?: Recommendation[] }) => setItems(data.items?.length ? data.items : scenicFallback(day)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [day, planId, readOnly, tab]);

  return <section className="mt-6 rounded-[18px] border border-gold/20 bg-[#171e19] p-5">
    <div className="flex items-end justify-between gap-3">
      <div><div className="text-[10px] font-bold tracking-[0.2em] text-gold">CURATED NEARBY</div><h4 className="serif mt-1 text-[22px]">附近推荐</h4></div>
      <span className="text-[11px] text-soft">{day.end.name} · 实时检索</span>
    </div>
    <div className="mt-4 flex gap-2 border-b border-white/10 pb-3">
      {([["hotel", "住宿"], ["attraction", "景点"], ["restaurant", "餐厅"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-full px-3 py-1.5 text-xs ${tab === value ? "bg-gold text-[#171610]" : "border border-line text-muted"}`}>{label}</button>)}
    </div>
    {loading ? <p className="py-5 text-sm text-muted">正在搜索附近推荐…</p> : items.length ? <div className="mt-4 grid gap-3 md:grid-cols-3">{items.slice(0, 3).map((item) => <article key={`${item.id ?? item.name}-${item.address ?? ""}`} className="overflow-hidden rounded-[14px] border border-line bg-panel2">
      {tab === "attraction" && item.imageUrl && <div className="relative h-32 overflow-hidden"><Image src={item.imageUrl} alt={`${item.name} 景色`} fill unoptimized sizes="(max-width: 900px) 100vw, 320px" className="object-cover transition duration-500 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#171e19]/70 to-transparent" /><span className="absolute bottom-2 left-3 text-[10px] tracking-[0.14em] text-[#f2d18b]">SCENIC STOP</span></div>}
      <div className="p-4"><div className="flex items-start justify-between gap-2"><strong className="text-sm text-ink">{item.name}</strong>{item.rating && <span className="text-xs text-gold">★ {item.rating}</span>}</div>
      <p className="mt-2 min-h-10 text-xs leading-6 text-muted">{item.type ?? (tab === "hotel" ? "酒店" : tab === "restaurant" ? "餐厅" : "景点")} · {item.address ?? "地址待补充"}</p>
      {item.price && <div className="text-xs text-gold">{tab === "hotel" ? `${item.price}/晚` : `人均 ${item.price}`}</div>}
      {item.bookingUrl ? <a className="mt-3 inline-flex text-xs text-gold underline underline-offset-4" href={item.bookingUrl} target="_blank" rel="noreferrer">去飞猪查看 ↗</a> : item.navigationUrl ? <a className="mt-3 inline-flex text-xs text-gold underline underline-offset-4" href={item.navigationUrl} target="_blank" rel="noreferrer">高德导航 ↗</a> : <span className="mt-3 inline-flex text-xs text-soft">数据来源：高德</span>}
      </div></article>)}</div> : <p className="py-5 text-sm text-muted">暂未找到可靠推荐，稍后可重新核验。</p>}
  </section>;
}
