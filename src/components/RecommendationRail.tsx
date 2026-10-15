"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { DayPlan, Recommendation } from "@/lib/types";
import { getDayImageTheme } from "@/lib/dayTheme";

const themeImages: Record<string, string> = {
  "city-day": "/themes/city-day.png",
  "city-night": "/themes/city-night.png",
  "snow-mountain": "/themes/snow-mountain.png",
  "lake-sunset": "/themes/lake-sunset.png",
  "old-town": "/themes/old-town.png",
  "highway-return": "/themes/highway-return.png",
  "forest-road": "/themes/forest-road.png",
};

export default function RecommendationRail({ day, days, planId, readOnly = false }: { day: DayPlan; days?: DayPlan[]; planId?: string; readOnly?: boolean }) {
  const [attraction, setAttraction] = useState<Recommendation | null>(null);
  const [restaurant, setRestaurant] = useState<Recommendation | null>(null);
  const [sceneryImages, setSceneryImages] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!planId || readOnly) { setSavedIds([]); return; }
    fetch(`/api/plans/${encodeURIComponent(planId)}/saved-recommendations?day=${day.dayIndex}`)
      .then((response) => response.ok ? response.json() as Promise<{ items?: { recommendationId: string }[] }> : { items: [] })
      .then((data) => setSavedIds((data.items ?? []).map((item) => item.recommendationId)))
      .catch(() => setSavedIds([]));
  }, [day.dayIndex, planId, readOnly]);

  const recommendationId = (item: Recommendation) => item.id ?? `${item.type ?? "recommendation"}-${item.name}`;
  const toggleSaved = async (item: Recommendation) => {
    if (!planId || readOnly || savingId) return;
    const id = recommendationId(item);
    const saved = savedIds.includes(id);
    setSavingId(id);
    setSavedIds((current) => saved ? current.filter((value) => value !== id) : [...current, id]);
    try {
      const response = saved
        ? await fetch(`/api/plans/${encodeURIComponent(planId)}/saved-recommendations/${encodeURIComponent(id)}?day=${day.dayIndex}`, { method: "DELETE" })
        : await fetch(`/api/plans/${encodeURIComponent(planId)}/saved-recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayIndex: day.dayIndex, recommendationId: id, name: item.name, type: item.type, address: item.address, imageUrl: item.imageUrl, navigationUrl: item.navigationUrl, source: item.source }) });
      if (!response.ok) throw new Error("收藏失败");
      window.dispatchEvent(new CustomEvent("roadbook:saved-recommendation", { detail: { dayIndex: day.dayIndex } }));
    } catch {
      setSavedIds((current) => saved ? [...current, id] : current.filter((value) => value !== id));
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (!days?.length) return;
    let cancelled = false;
    const cities = [...new Set(days.map((scenicDay) => scenicDay.end.name))];
    fetch(`/api/amap/scenery?cities=${encodeURIComponent(cities.join(","))}`)
      .then((response) => response.ok ? response.json() as Promise<{ items?: Record<string, { imageUrl?: string }> }> : { items: {} })
      .then((data) => {
        if (cancelled) return;
        setSceneryImages(Object.fromEntries(Object.entries(data.items ?? {}).flatMap(([city, item]) => item.imageUrl ? [[city, item.imageUrl]] : [])));
      })
      .catch(() => { if (!cancelled) setSceneryImages({}); });
    return () => { cancelled = true; };
  }, [days]);

  useEffect(() => {
    if (!planId || readOnly) {
      setAttraction(fallbackAttraction(day));
      setRestaurant(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(`/api/plans/${encodeURIComponent(planId)}/recommendations?day=${day.dayIndex}&type=attraction`).then((response) => response.ok ? response.json() : { items: [] }),
      fetch(`/api/plans/${encodeURIComponent(planId)}/recommendations?day=${day.dayIndex}&type=restaurant`).then((response) => response.ok ? response.json() : { items: [] }),
    ]).then(([scenic, food]: [{ items?: Recommendation[] }, { items?: Recommendation[] }]) => {
      if (cancelled) return;
      setAttraction(scenic.items?.[0] ?? fallbackAttraction(day));
      setRestaurant(food.items?.[0] ?? null);
    }).catch(() => {
      if (!cancelled) { setAttraction(fallbackAttraction(day)); setRestaurant(null); }
    });
    return () => { cancelled = true; };
  }, [day, planId, readOnly]);

  return <section className="editorial-rail-shell editorial-recommendations rounded-[20px] border border-gold/25 bg-[#172019] p-5" aria-label="今日侧栏">
    {days && <>
      <div className="section-kicker mb-2">SCENIC JOURNAL</div>
      <h3 className="serif m-0 text-[25px]">每日风景</h3>
      <p className="mt-1 text-xs text-soft">按天收藏沿途值得停留的画面</p>
      <div className="mt-4 mb-5 grid gap-2 border-b border-white/10 pb-5">
        {days.map((scenicDay, dayPosition) => {
          const actualImage = sceneryImages[scenicDay.end.name];
          return <button key={scenicDay.dayIndex} type="button" className="group flex items-center gap-3 overflow-hidden rounded-[12px] border border-transparent bg-[#202a2388] p-2 text-left transition hover:-translate-y-0.5 hover:border-gold/60" onClick={() => document.getElementById(`day-detail-${scenicDay.dayIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <span className="relative block h-[58px] w-[78px] shrink-0 overflow-hidden rounded-[9px]">
            <ResilientImage src={actualImage} fallbackImage={themeImages[getDayImageTheme(scenicDay, dayPosition)]} alt={`${scenicDay.end.name} 风景`} />
            <span className="scenery-photo-source absolute bottom-1 right-1 rounded bg-[#111812cc] px-1.5 py-0.5 text-[8px] text-[#f2d18b]">{actualImage ? "高德实景" : "主题图"}</span>
          </span>
          <span className="min-w-0"><span className="block text-[10px] font-bold tracking-[0.14em] text-gold">DAY {String(scenicDay.dayIndex).padStart(2, "0")}</span><strong className="mt-1 block truncate text-xs text-ink">{scenicDay.photoTips[0]?.title?.replace(/\s*·.*$/, "") ?? scenicDay.end.name}</strong><span className="mt-0.5 block truncate text-[10px] text-soft">{scenicDay.start.name} → {scenicDay.end.name}</span></span>
          </button>;
        })}
      </div>
    </>}
    <div className="section-kicker mb-2">TODAY&apos;S NOTES</div>
    <div className="flex items-end justify-between gap-3">
      <div><h3 className="serif m-0 text-[25px]">今日侧栏</h3><p className="mt-1 text-xs text-soft">风景、美食与今晚落脚</p></div>
      <span className="text-[11px] text-gold">DAY {String(day.dayIndex).padStart(2, "0")}</span>
    </div>
    <div className="rail-fact-strip mt-4 grid grid-cols-2 gap-2 border-y border-line py-3 text-[11px]">
      <div><span className="block text-soft">天气</span><strong className="mt-1 block text-ink">{day.weather?.dayWeather ?? "预报待发布"}</strong><span className="mt-0.5 block text-soft">{day.weather?.dayTemp ? `${day.weather.dayTemp}°C` : "出发前更新"}</span></div>
      <div><span className="block text-soft">路线提醒</span><strong className="mt-1 block text-ink">{day.risks.length ? "有 1 项提醒" : "路况平稳"}</strong><span className="mt-0.5 block truncate text-soft">{day.risks[0] ?? "保持弹性停留"}</span></div>
    </div>
    <div className="mt-4 grid gap-3">
      <RailCard label="沿途风景" item={attraction} fallbackImage={themeImages[getDayImageTheme(day, Math.max(0, (days?.findIndex((item) => item.dayIndex === day.dayIndex) ?? 1)))]} readOnly={readOnly} saved={attraction ? savedIds.includes(recommendationId(attraction)) : false} saving={savingId === (attraction ? recommendationId(attraction) : "")} onToggleSave={attraction ? () => toggleSaved(attraction) : undefined} />
      <RailCard label="当地美食" item={restaurant} fallbackImage="/themes/city-night.png" emptyText="切换到真实路书后获取当地美食" readOnly={readOnly} saved={restaurant ? savedIds.includes(recommendationId(restaurant)) : false} saving={savingId === (restaurant ? recommendationId(restaurant) : "")} onToggleSave={restaurant ? () => toggleSaved(restaurant) : undefined} />
      <RailCard label="今晚住宿" item={day.hotels?.[0] ? { ...day.hotels[0], type: "住宿", imageUrl: day.hotels[0].imageUrl } : null} fallbackImage={themeImages[day.imageTheme ? day.imageTheme : "city-night"]} emptyText="路线核验后推荐落脚酒店" readOnly={readOnly} saved={false} saving={false} />
    </div>
  </section>;
}

function RailCard({ label, item, fallbackImage, emptyText, readOnly, saved, saving, onToggleSave }: { label: string; item: Recommendation | null; fallbackImage: string; emptyText?: string; readOnly: boolean; saved: boolean; saving: boolean; onToggleSave?: () => void }) {
  return <article className="editorial-rail-card overflow-hidden rounded-[15px] border border-white/10 bg-[#202a2366]">
    <div className="relative h-[108px] overflow-hidden">
      <ResilientImage src={item?.imageUrl} fallbackImage={fallbackImage} alt={item?.name ? `${item.name} 图片` : label} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111812e8] via-transparent to-transparent" />
      <span className="absolute bottom-2 left-3 text-[10px] font-bold tracking-[0.16em] text-[#f2d18b]">{label}</span>
    </div>
    <div className="p-3.5">
      <strong className="block text-sm text-ink">{item?.name ?? emptyText ?? "推荐待补充"}</strong>
      <p className="mt-1.5 min-h-8 text-[11px] leading-5 text-muted">{item?.address ?? (item ? "高德地点推荐" : "接入路线后自动补充")}</p>
      {item?.navigationUrl && <a href={item.navigationUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] text-gold underline underline-offset-4">查看导航 ↗</a>}
      {item && <button type="button" className="mt-3 block text-[11px] text-gold underline underline-offset-4 disabled:cursor-not-allowed disabled:text-soft" onClick={onToggleSave} disabled={readOnly || saving} title={readOnly ? "示例路书仅供浏览" : undefined}>{readOnly ? "示例路书仅供浏览" : saving ? "保存中…" : saved ? "已加入当天 · 移除收藏" : "加入当天"}</button>}
    </div>
  </article>;
}

function ResilientImage({ src, fallbackImage, alt }: { src?: string; fallbackImage: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src ?? fallbackImage);

  useEffect(() => {
    setImageSrc(src ?? fallbackImage);
  }, [src, fallbackImage]);

  return <Image
    src={imageSrc}
    alt={alt}
    fill
    sizes="(max-width: 900px) 100vw, 320px"
    unoptimized={imageSrc !== fallbackImage}
    className="object-cover transition duration-500"
    onError={() => setImageSrc(fallbackImage)}
  />;
}

function fallbackAttraction(day: DayPlan): Recommendation | null {
  const photo = day.photoTips[0];
  if (!photo) return null;
  return { id: `rail-${day.dayIndex}`, name: photo.title.replace(/\s*·.*$/, ""), address: photo.place?.address ?? day.end.name, type: "沿途风景", imageUrl: themeImages[getDayImageTheme(day, day.dayIndex - 1)], navigationUrl: photo.place?.navigationUrl, source: photo.source ?? { provider: "roadbook-theme", fetchedAt: new Date().toISOString(), status: "estimated" } };
}
