"use client";

import { formatBudgetRange, formatDuration } from "@/lib/tripForm";
import type { DayPlan } from "@/lib/types";
import { getDayImageTheme } from "@/lib/dayTheme";
import type { TravelTheme } from "@/lib/theme";

/** 每日行程详情：今天去哪 → 驾驶距离/时间 → 时间安排 → 摄影 → 住宿 → 风险（方案 §4 信息优先级） */
export default function DayDetail({
  day,
  dayNumber,
  onEdit,
  onPlanB,
  planId,
  readOnly = false,
  theme = "childhood",
}: {
  day: DayPlan;
  dayNumber: number; // 1-based
  onEdit: () => void;
  onPlanB: () => void;
  planId?: string;
  readOnly?: boolean;
  theme?: TravelTheme;
}) {
  const legsDistance = day.legs.reduce((sum, leg) => sum + (leg.distanceKm ?? 0), 0);
  const legsDuration = day.legs.reduce((sum, leg) => sum + (leg.durationMinutes ?? 0), 0);
  const drivingDay = day.legs.length > 0;
  const schedule = day.schedule?.length ? day.schedule : [
    { time: "待定", title: `${day.start.name} → ${day.end.name}`, description: "根据路线和出行节奏安排当天驾驶与停留。" },
    { time: "待定", title: "沿途停留与午餐", description: "结合当天路况和体力，在安全服务区或沿途城市休整。" },
    { time: "待定", title: "抵达后安排", description: `抵达${day.end.name}后办理入住，并根据时间安排当地活动。` },
  ];

  const metrics: { value: string; label: string }[] = drivingDay
    ? [
        { value: `约 ${Math.round(legsDistance).toLocaleString("zh-CN")} km`, label: "已核验里程" },
        { value: formatDriveHours(Math.round(legsDuration)), label: "已核验驾驶" },
        { value: `${day.start.name} → ${day.end.name}`, label: "已核验路线" },
      ]
    : [
        { value: "待核验", label: "路线里程" },
        { value: "待核验", label: "驾驶时长" },
        { value: day.end.name, label: "计划落脚" },
      ];

  return (
    <article
      id={`day-detail-${day.dayIndex}`}
      role="tabpanel"
      aria-label={`第 ${dayNumber} 天行程`}
      className="daily-editorial-card overflow-hidden rounded-[22px] border border-line bg-[linear-gradient(145deg,#202b24_0%,#171d19_55%,#151917_100%)] px-8 py-8 shadow-[0_12px_36px_#0002] max-sm:px-5 max-sm:py-6"
      style={{
        backgroundImage: `linear-gradient(115deg, ${theme === "childhood" ? "rgba(255,253,245,.96)" : theme === "detective" ? "rgba(251,252,255,.96)" : "rgba(255,250,255,.96)"} 0%, ${theme === "childhood" ? "rgba(255,253,245,.84)" : theme === "detective" ? "rgba(251,252,255,.86)" : "rgba(255,250,255,.86)"} 50%, rgba(255,255,255,.68) 100%), url('${imageThemeAsset(getDayImageTheme(day, dayNumber - 1))}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="daily-day-header relative grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-6 border-b border-white/[0.08] pb-6 max-sm:block">
        <div className={`daily-cover relative min-h-[220px] overflow-hidden rounded-[16px] border border-white/[0.14] bg-cover bg-center p-5 max-lg:min-h-[190px] ${imageThemeClass(getDayImageTheme(day, dayNumber - 1))}`} aria-hidden="true">
          <div className="relative z-10 text-[10px] font-bold tracking-[0.22em] text-gold">ROADBOOK</div>
          <div className="serif relative z-10 mt-12 text-[42px] leading-none text-[#f0d18b] max-lg:text-[34px]">DAY {String(dayNumber).padStart(2, "0")}</div>
          <div className="absolute bottom-9 left-5 right-5 z-10 truncate text-sm text-[#f1eee5]">{day.photoTips[0]?.title?.replace(/\s*·.*$/, "") ?? day.end.name}</div>
          <div className="absolute bottom-4 left-5 right-5 flex gap-1">
            {[0, 1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full ${item === 0 ? "bg-gold" : "bg-white/20"}`} />)}
          </div>
        </div>
        <div>
          <p className="serif m-0 text-lg font-medium text-gold">
            DAY {String(dayNumber).padStart(2, "0")} · {formatDate(day.date)}
          </p>
          <h3 className="serif m-0 mt-2.5 mb-2 text-[clamp(29px,3.4vw,42px)] leading-[1.3]">
            {day.title}
          </h3>
          <p className="max-w-[620px] text-[13px] leading-[1.8] text-muted">{day.summary}</p>
        </div>
        <button type="button" className="btn btn-small shrink-0 max-sm:mt-3" onClick={onEdit}>
          调整这一天 <span aria-hidden="true">↗</span>
        </button>
      </div>

      <div className="my-6 grid grid-cols-3 rounded-[16px] border border-white/[0.1] bg-black/15 py-4 max-sm:gap-3">
        {metrics.map((m, i) => (
          <div key={m.label} className={`px-5 max-sm:px-3 ${i > 0 ? "border-l border-line" : ""}`}>
            <strong className="serif block text-[22px] font-medium max-sm:text-[17px]">
              {m.value}
            </strong>
            <span className="text-[11px] text-soft max-sm:text-[10px]">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-gold">DAY PLAN</div>
          <h4 className="serif m-0 mt-1 text-[20px] font-medium">当日安排</h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-soft">
          <span className={`daily-intensity ${intensityTone(legsDuration)}`}>{intensityLabel(legsDuration)}</span>
          <span>按时间顺序</span>
        </div>
      </div>

      <div className={`mb-3 rounded-[16px] border px-4 py-3 text-sm ${weatherTone(day.weather?.dayWeather)}`}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <strong className="text-ink">天气 · {day.end.name}</strong>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-soft">{day.weather ? `${day.weather.source.provider === "qweather" ? "和风天气" : "高德天气"}已核验` : "预报待发布"}</span>
        </div>
        {day.weather ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{day.weather.dayWeather ?? "天气待定"} / {day.weather.nightWeather ?? "夜间待定"}</span>
            <span>{day.weather.dayTemp ?? "-"}°C / {day.weather.nightTemp ?? "-"}°C</span>
            <span>{day.weather.dayWind ?? "风力待定"}</span>
          </div>
        ) : (
          <p className="m-0 text-[12px] leading-[1.7] text-muted">高德暂未发布 {formatDate(day.date)} 的具体预报。出发前 3–5 天会自动补充天气、温度和风力。</p>
        )}
        <div className="mt-2 text-[11px] text-soft">数据来源：{day.weather?.source.provider === "qweather" ? "和风天气" : "高德天气"} · 计划日期：{formatDate(day.date)}</div>
      </div>

      <div className="grid gap-2">
        {schedule.map((item, scheduleIndex) => (
          <div
            key={`${day.dayIndex}-${scheduleIndex}-${item.time ?? "time"}-${item.title}`}
            className="daily-schedule-row grid min-h-[70px] grid-cols-[58px_15px_1fr] gap-3.5 rounded-[14px] border border-line bg-panel2 px-4 py-3 text-[13px] text-muted transition-colors hover:border-gold/50 max-sm:grid-cols-[48px_12px_1fr] max-sm:px-3"
          >
            <time className="serif pt-0.5 text-xs font-medium text-gold">{displayScheduleTime(item.time, scheduleIndex)}</time>
            <span className="timeline-dot mt-1" aria-hidden="true" />
            <div>
              <strong className="mb-1 block font-medium leading-[1.5] text-ink">{item.title}</strong>
              <p className="m-0 leading-[1.75]">{formatScheduleDescription(item.description)}</p>
              {item.place?.address && <div className="mt-2 text-[11px] text-soft">{item.place.address}</div>}
              {item.place?.navigationUrl && <a className="mt-2 inline-flex text-[11px] text-gold underline decoration-gold/40 underline-offset-4" href={item.place.navigationUrl} target="_blank" rel="noreferrer">在高德中导航 ↗</a>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <MiniPanel
            label="PHOTO MOMENT"
          title={day.photoTips[0]?.title ?? "拍摄建议待补充"}
          body={
            [
              day.photoTips[0]?.bestTime ? `建议时段：${day.photoTips[0].bestTime}。` : "",
              day.photoTips[0]?.description ?? "正式版将结合日出日落时间与可达机位给出建议。",
            ]
              .filter(Boolean)
              .join("")
          }
        />
        <MiniPanel label="WHERE TO STAY" title={day.stayAdvice.split("：")[0]} body={day.stayAdvice.split("：").slice(1).join("：") || day.stayAdvice} />
        {day.hotels?.[0] && <div className="rounded-[16px] border border-[#b9953f]/35 bg-[#2d291d] p-5 text-xs text-muted">
          <div className="text-[10px] font-bold tracking-[0.2em] text-gold">FLIGGY HOTEL</div>
          <strong className="mt-2 block text-sm text-ink">{day.hotels[0].name}</strong>
          <div className="mt-1 flex flex-wrap gap-3"><span>{day.hotels[0].price ?? "价格待定"}/晚</span><span>评分 {day.hotels[0].rate ?? "-"}</span></div>
          {day.hotels[0].bookingUrl && <a className="mt-3 inline-flex text-gold underline decoration-gold/40 underline-offset-4" href={day.hotels[0].bookingUrl} target="_blank" rel="noreferrer">去飞猪查看 ↗</a>}
        </div>}
        <MiniPanel label="ON THE ROAD" title="路况与风险" body={day.risks.join(" ")} />
        <MiniPanel
          label="PLAN B"
          title="天气与体力备选"
          body={day.alternative ?? "正式版依据当日天气、路况和用户偏好重新安排停留与落脚点。"}
          actionLabel="生成 Plan B"
          onAction={onPlanB}
        />
      </div>

      {day.budgetCny && (
        <p className="mt-4 mb-0 text-xs text-soft">
          当日花费估算：{formatBudgetRange(day.budgetCny)}（示意，非报价）
        </p>
      )}

    </article>
  );
}

function MiniPanel({ label, title, body, actionLabel, onAction }: { label: string; title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  const tone = label === "PHOTO MOMENT"
    ? "border-[#b9953f]/40 bg-[linear-gradient(145deg,#3a3020,#211f19)]"
    : label === "WHERE TO STAY"
      ? "border-[#3b806d]/40 bg-[linear-gradient(145deg,#20352d,#1a2520)]"
      : label === "ON THE ROAD"
        ? "border-[#a45f4e]/45 bg-[linear-gradient(145deg,#382622,#211b1a)]"
        : "border-[#6873b0]/45 bg-[linear-gradient(145deg,#252b48,#1b1e2c)]";
  return (
    <div className={`rounded-[16px] border p-5 transition-transform hover:-translate-y-0.5 ${tone}`}>
      <div className="text-[10px] font-bold tracking-[0.2em] text-soft">{label}</div>
      <h4 className="serif mb-1.5 mt-2 text-[17px] font-medium">{title}</h4>
      <p className="m-0 text-xs leading-[1.8] text-muted">{body}</p>
      {actionLabel && onAction && <button type="button" className="mt-3 text-[11px] text-gold underline decoration-gold/40 underline-offset-4" onClick={onAction}>{actionLabel} ↗</button>}
    </div>
  );
}

function weatherTone(weather?: string): string {
  if (!weather) return "border-line bg-panel2";
  if (weather.includes("雨")) return "border-[#4d79a8]/50 bg-[linear-gradient(145deg,#24354a,#1c252e)]";
  if (weather.includes("雪")) return "border-[#93a9c0]/50 bg-[linear-gradient(145deg,#32404c,#20282e)]";
  if (weather.includes("阴")) return "border-[#777c78]/50 bg-[linear-gradient(145deg,#303532,#202522)]";
  return "border-[#b9953f]/50 bg-[linear-gradient(145deg,#3a3020,#24221b)]";
}

function imageThemeClass(theme: NonNullable<DayPlan["imageTheme"]>): string {
  const themes: Record<NonNullable<DayPlan["imageTheme"]>, string> = {
    "city-day": "bg-[linear-gradient(145deg,#9b704855,#101511dd),url('/themes/city-day.png')] bg-[position:center_65%]",
    "city-night": "bg-[linear-gradient(145deg,#26385d66,#10131add),url('/themes/city-night.png')] bg-[position:center_35%]",
    "snow-mountain": "bg-[linear-gradient(145deg,#8296a855,#101511dd),url('/themes/snow-mountain.png')] bg-[position:center_10%]",
    "lake-sunset": "bg-[linear-gradient(145deg,#b5794a66,#101511dd),url('/themes/lake-sunset.png')] bg-[position:center_78%]",
    "old-town": "bg-[linear-gradient(145deg,#a45f3f66,#101511dd),url('/themes/old-town.png')] bg-[position:left_center]",
    "highway-return": "bg-[linear-gradient(145deg,#4d608866,#101511dd),url('/themes/highway-return.png')] bg-[position:right_center]",
    "forest-road": "bg-[linear-gradient(145deg,#3d765e66,#101511dd),url('/themes/forest-road.png')] bg-[position:center_55%]",
  };
  return themes[theme ?? "forest-road"];
}

function imageThemeAsset(theme: NonNullable<DayPlan["imageTheme"]>): string {
  return `/themes/${theme}.png`;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)} / ${Number(d)}`;
}

function displayScheduleTime(time: string | undefined, index: number): string {
  if (time && time !== "待定") return time;
  return ["08:00", "12:30", "18:00", "20:00"][Math.min(index, 3)];
}

function formatScheduleDescription(description: string): string {
  return description.replace(/预计\s*(\d+)\s*分钟/g, (_, minutes: string) => `预计 ${formatDuration(Number(minutes))}`);
}

function formatDriveHours(minutes: number): string {
  if (minutes <= 0) return "待核验";
  if (minutes < 60) return `约 ${minutes} 分钟`;
  return `约 ${(minutes / 60).toFixed(1)} 小时`;
}

function intensityLabel(minutes: number): string {
  if (!minutes) return "强度待核验";
  if (minutes <= 180) return "轻松驾驶";
  if (minutes <= 360) return "平衡驾驶";
  return "长途驾驶";
}

function intensityTone(minutes: number): string {
  if (!minutes) return "is-pending";
  if (minutes <= 180) return "is-easy";
  if (minutes <= 360) return "is-balanced";
  return "is-heavy";
}
