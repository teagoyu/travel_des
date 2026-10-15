import type { TripPlan } from "@/lib/types";
import { getDayRisk } from "@/lib/tripTools";

export default function TripHealthSummary({ plan, onSelectDay }: { plan: TripPlan; onSelectDay?: (index: number) => void }) {
  const longest = plan.days.reduce((current, day, index) => {
    const minutes = day.legs.reduce((sum, leg) => sum + (leg.durationMinutes ?? 0), 0);
    return minutes > current.minutes ? { index, minutes, name: day.end.name } : current;
  }, { index: 0, minutes: 0, name: plan.days[0]?.end.name ?? "待核验" });
  const risks = plan.days.map((day, index) => ({ day, index })).filter(({ day }) => getDayRisk(day) === "risk");
  const checked = plan.checklist.filter((item) => item.checked).length;
  const money = plan.totalBudgetCny ? `¥${plan.totalBudgetCny.min.toLocaleString("zh-CN")}–${plan.totalBudgetCny.max.toLocaleString("zh-CN")}` : "待核验";

  return (
    <section className="side-card trip-health-summary" aria-label="本次出行状态">
      <div className="section-kicker">TRIP HEALTH</div>
      <h3 className="serif mb-2 text-xl font-medium">本次出行状态</h3>
      <div className="trip-health-summary__grid">
        <div><span>预算</span><strong>{money}</strong><small>估算区间</small></div>
        <div><span>清单完成度</span><strong>{checked}/{plan.checklist.length}</strong><small>出发前准备</small></div>
        <div><span>最长驾驶日</span><strong>DAY {String(longest.index + 1).padStart(2, "0")}</strong><small>{longest.minutes ? `${Math.round(longest.minutes / 60)} 小时 · ${longest.name}` : "待核验"}</small></div>
      </div>
      <div className="trip-health-summary__risk-head"><span>天气风险日</span><small>{risks.length ? "建议重点查看" : "暂无高风险日"}</small></div>
      {risks.length ? <div className="trip-health-summary__risks">{risks.map(({ day, index }) => <button key={day.dayIndex} type="button" data-day-index={day.dayIndex} onClick={() => onSelectDay?.(index)}>DAY {String(day.dayIndex).padStart(2, "0")} · {day.end.name}</button>)}</div> : <p className="trip-health-summary__empty">目前没有识别到高风险天气；出发前仍建议重新核验预报。</p>}
    </section>
  );
}
