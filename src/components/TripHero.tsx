import Image from "next/image";
import type { TripPlan } from "@/lib/types";
import type { TravelTheme } from "@/lib/theme";

/** 路书封面摘要（方案 §3：路书详情第一屏） */
export default function TripHero({ plan, theme = "childhood" }: { plan: TripPlan; theme?: TravelTheme }) {
  const { request } = plan;
  const meta = [
    `${plan.days.length} 天 ${plan.days.length - 1} 晚`,
    plan.totalDistanceKm
      ? `约 ${Math.round(plan.totalDistanceKm).toLocaleString("zh-CN")} km · ${plan.status === "ready" ? "已核验" : "待核验"}`
      : "里程待核验",
    `${request.partySize} 人自驾`,
    request.interests.length
      ? request.interests.slice(0, 3).join(" / ")
      : "风景 / 摄影",
  ];
  const cities = [...new Set([request.origin, ...plan.days.map((day) => day.end.name)])].slice(0, 6);

  return (
    <div className="travel-editorial-hero relative min-h-[680px] overflow-hidden bg-[linear-gradient(90deg,#0d120feF_0%,#101612c9_42%,#11141235_78%),linear-gradient(0deg,#111412 0%,transparent 48%),url('/hero-mountain-road.png')] bg-[position:center_42%] bg-cover max-md:min-h-[720px] max-md:bg-[linear-gradient(0deg,#111412_0%,#1114126e_70%),linear-gradient(90deg,#111412dc,transparent),url('/hero-mountain-road.png')] max-md:bg-[position:center]">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(#d2b36a_1px,transparent_1px),linear-gradient(90deg,#d2b36a_1px,transparent_1px)] [background-size:96px_96px]" />
      <div className="shell relative pt-[74px] pb-[42px] max-md:pt-[44px]">
        <div className="travel-editorial-hero__journal-label">我的旅行地图 <span>·</span> {request.origin} → {request.destination.replace(/^.*·\s*/, "")}</div>
        <Image priority className="travel-editorial-hero__character" src={`/themes/${theme}/character.svg`} width={380} height={520} sizes="190px" alt="原创卡通旅行伙伴" />
        <div className="travel-editorial-hero__kicker flex items-center gap-3 text-[10px] font-bold tracking-[0.24em]"><span className="h-px w-8" /> THE OPEN ROAD / 路书预览</div>
        <h1 className="serif mt-5 mb-5 max-w-[800px] text-[clamp(52px,7vw,92px)] leading-[1.06] text-[#f1ede2] max-md:text-[clamp(40px,11vw,58px)]">
          {plan.title}
        </h1>
        <p className="travel-editorial-hero__copy max-w-[650px] text-[15px] leading-[1.85]">
          从{request.origin}出发，沿着山川与湖泊前往{request.destination.replace(/^.*·\s*/, "")}。每一段路线，都留一点给意外发生。
        </p>
        <div className="travel-editorial-hero__meta editorial-meta mt-8 grid max-w-[760px] grid-cols-4 gap-px overflow-hidden rounded-[16px] border border-white/15 bg-white/10 backdrop-blur-md max-md:grid-cols-2">
          {meta.map((item) => (
            <span
              key={item}
              className="bg-[#11181299] px-4 py-3 text-xs text-[#f1f1e8]"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <a href="#daily" className="btn btn-primary border-gold/70 bg-gold text-[#151a15]">
            开始阅读行程 ↓
          </a>
          <a href="#share" className="btn">
            分享路书 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="travel-editorial-hero__footer mt-10 flex items-end justify-between gap-6 border-t border-white/15 pt-4 text-[11px] max-md:mt-7">
          <span>山海之间 · 自驾路书</span>
          <span>{request.origin} → {request.destination.replace(/^.*·\s*/, "")}</span>
        </div>
        <div className="travel-editorial-hero__cities" aria-label="沿途城市路线">
          {cities.map((city, index) => {
            const state = index === 0 ? "出发" : index === cities.length - 1 ? "终点" : `DAY ${String(index + 1).padStart(2, "0")}`;
            return (
              <div key={`${city}-${index}`} className="travel-editorial-hero__city">
                <span className="travel-editorial-hero__city-icon" aria-hidden="true">{index === 0 ? "✈" : index === cities.length - 1 ? "⌂" : "•"}</span>
                <strong className="travel-editorial-hero__city-name">{city}</strong>
                <small className="travel-editorial-hero__city-state">{state}</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
