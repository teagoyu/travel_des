import { formatBudgetRange } from "@/lib/tripForm";
import type { TripPlan } from "@/lib/types";

/** 预算面板：区间估算，明确"非报价"（方案 §8.4） */
export default function BudgetPanel({ plan }: { plan: TripPlan }) {
  const total = plan.totalBudgetCny;
  if (!total) return null;

  const nights = plan.days.length - 1;
  // 示意拆分比例：住宿约 38%、交通约 30%、餐饮约 24%、其他约 8%
  const share = (ratio: number, min: number, max: number) => ({
    min: Math.round((min * ratio) / 100 / 50) * 50,
    max: Math.round((max * ratio) / 100 / 50) * 50,
  });
  const rows = [
    { label: `住宿 · ${nights} 晚`, ...share(38, total.min, total.max) },
    { label: "交通 · 油费/路费", ...share(30, total.min, total.max) },
    { label: "餐饮 · 全程", ...share(24, total.min, total.max) },
    { label: "其他 · 门票/停车", ...share(8, total.min, total.max) },
  ];

  return (
    <div className="side-card">
      <div className="section-kicker">ESTIMATED COST</div>
      <h3 className="serif mb-2 text-xl font-medium">预算大概多少</h3>
      <p className="mt-0 mb-4 text-[13px] leading-[1.8] text-muted">
        {plan.request.partySize} 人合计，演示估算。正式版需按真实路线和用户预算重新计算。
      </p>
      <p className="serif m-0 mb-4 text-[26px] font-medium text-gold">
        {formatBudgetRange(total)}
      </p>
      <dl className="m-0 grid gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-[13px]">
            <dt className="text-muted">{row.label}</dt>
            <dd className="m-0 font-medium">{formatBudgetRange(row)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 mb-0 text-[11px] leading-[1.7] text-soft">
        以上为区间估算，非报价；日均约 {formatBudgetRange(dailyAvg(total, plan.days.length))}。
        正式版将按核验里程、人数与住宿晚数重新计算。
      </p>
    </div>
  );
}

function dailyAvg(total: { min: number; max: number }, days: number) {
  return {
    min: Math.round(total.min / days / 50) * 50,
    max: Math.round(total.max / days / 50) * 50,
  };
}
