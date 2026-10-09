"use client";

import { useEffect, useRef } from "react";
import type { TripPlan } from "@/lib/types";

// 高德 JS SDK 没有随项目安装类型定义，运行时对象保持最小兼容声明。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { AMap?: any } }

export default function AmapRouteMap({ plan }: { plan: TripPlan }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_AMAP_JS_KEY;
    if (!ref.current || !key) return;
    const load = async () => {
      if (!window.AMap) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("AMap load failed"));
          document.head.appendChild(script);
        });
      }
      if (!ref.current || !window.AMap) return;
      const points = plan.days.flatMap((day) => day.legs.flatMap((leg) => leg.geometry ?? []));
      const places = plan.days.flatMap((day) => [day.start, day.end]).filter((place, index, all) => place.lng !== undefined && place.lat !== undefined && all.findIndex((candidate) => candidate.lng === place.lng && candidate.lat === place.lat) === index);
      const center = points[0] ?? [places[0]?.lng ?? 116.397428, places[0]?.lat ?? 39.90923];
      const map = new window.AMap.Map(ref.current, { zoom: points.length > 1 ? 6 : 8, center: [center[0], center[1]], mapStyle: "amap://styles/normal", viewMode: "2D" });
      if (points.length > 1) {
        const path = points.map(([lng, lat]) => [lng, lat]);
        new window.AMap.Polyline({ map, path, strokeColor: "#e7c780", strokeWeight: 6, lineJoin: "round", lineCap: "round" });
      }
      places.forEach((place, index) => {
        if (place.lng === undefined || place.lat === undefined) return;
        new window.AMap.Marker({ map, position: [place.lng, place.lat], label: { content: `${String(index + 1).padStart(2, "0")} ${place.name}`, direction: "top" } });
      });
      try {
        map.addControl(new window.AMap.Scale());
        map.addControl(new window.AMap.ToolBar({ position: "RB" }));
      } catch {
        // 地图主体已经可用；部分 Key 配置下控件插件可能不可用，不遮挡底图。
      }
      map.setFitView();
    };
    load().catch(() => undefined);
  }, [plan]);
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-line bg-[#e8eee8]">
      <div ref={ref} className="h-[480px] w-full" aria-label="高德地图路线" />
    </div>
  );
}
