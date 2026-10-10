"use client";

import Image from "next/image";
import type { DayPlan } from "@/lib/types";
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

export default function DailySceneryRail({ days }: { days: DayPlan[] }) {
  return <section className="daily-scenery-rail rounded-[20px] border border-white/10 bg-[#151d18cc] p-5">
    <div className="section-kicker mb-2">SCENIC JOURNAL</div>
    <h3 className="serif m-0 text-[25px]">每日风景</h3>
    <p className="mt-1 text-xs text-soft">按天收藏沿途值得停留的画面</p>
    <div className="mt-4 grid gap-2.5">
      {days.map((day, dayPosition) => {
        const photoTitle = day.photoTips[0]?.title?.replace(/\s*·.*$/, "") ?? day.end.name;
        return <button key={day.dayIndex} type="button" className="group flex items-center gap-3 overflow-hidden rounded-[14px] border border-white/10 bg-[#202a23] p-2 text-left transition hover:-translate-y-0.5 hover:border-gold/60" onClick={() => document.getElementById(`day-detail-${day.dayIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          <Image src={themeImages[getDayImageTheme(day, dayPosition)]} alt={`${photoTitle} 风景`} width={156} height={116} sizes="78px" className="h-[58px] w-[78px] shrink-0 rounded-[9px] object-cover transition duration-500 group-hover:scale-105" />
          <span className="min-w-0">
            <span className="block text-[10px] font-bold tracking-[0.14em] text-gold">DAY {String(day.dayIndex).padStart(2, "0")}</span>
            <strong className="mt-1 block truncate text-xs text-ink">{photoTitle}</strong>
            <span className="mt-0.5 block truncate text-[10px] text-soft">{day.start.name} → {day.end.name}</span>
          </span>
        </button>;
      })}
    </div>
  </section>;
}
