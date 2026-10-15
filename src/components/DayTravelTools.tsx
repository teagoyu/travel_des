import type { DayPlan } from "@/lib/types";
import { estimateDayCosts, getDayRisk, getPreparationItems } from "@/lib/tripTools";

const RISK_COPY = {
  good: { label: "适合出发", tone: "good", body: "天气和驾驶强度相对平稳，按计划出发即可。" },
  buffer: { label: "留出缓冲", tone: "buffer", body: "建议提前出发，给天气或山路留出机动时间。" },
  risk: { label: "需要谨慎", tone: "risk", body: "天气或驾驶强度存在风险，建议先核验再出发。" },
} as const;

export default function DayTravelTools({ day, partySize }: { day: DayPlan; partySize: number }) {
  const risk = RISK_COPY[getDayRisk(day)];
  const costs = estimateDayCosts(day, partySize);
  const preparations = getPreparationItems(day);
  const money = (range: { min: number; max: number }) => range.min || range.max ? `¥${range.min.toLocaleString("zh-CN")}–${range.max.toLocaleString("zh-CN")}` : "待核验";
  const estimated = costs.total.status === "estimated";

  return (
    <section className="day-travel-tools" aria-label="当天出行工具">
      <div className={`day-tool-card day-tool-card--${risk.tone}`}>
        <div className="day-tool-card__label">出发判断</div>
        <strong>{risk.label}</strong>
        <p>{risk.body}</p>
      </div>
      <div className="day-tool-card day-tool-card--cost">
        <div className="day-tool-card__label">费用估算 · {estimated ? "示意" : "待核验"}</div>
        <strong>{money(costs.total)}</strong>
        <p>油费 {money(costs.fuel)} · 过路费 {money(costs.toll)}</p>
      </div>
      <div className="day-tool-card day-tool-card--prep">
        <div className="day-tool-card__label">准备事项 · 出发前</div>
        {preparations.length ? <ul>{preparations.map((item) => <li key={item}>{item}</li>)}</ul> : <p>暂无新增事项，仍需在出发前核验天气和路况。</p>}
      </div>
    </section>
  );
}
