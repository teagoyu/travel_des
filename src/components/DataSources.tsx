import { FACT_STATUS_LABEL, type TripPlan } from "@/lib/types";

/** 数据来源与更新时间（方案 §3：路书详情最后一个模块） */
export default function DataSources({ plan }: { plan: TripPlan }) {
  const sources = new Map<string, { provider: string; fetchedAt: string; status: string }>();
  for (const day of plan.days) {
    for (const leg of day.legs) {
      sources.set(leg.source.provider, {
        provider: leg.source.provider,
        fetchedAt: leg.source.fetchedAt,
        status: leg.source.status,
      });
    }
  }

  return (
    <section aria-labelledby="sources-title" className="mt-14 border-t border-line pt-7">
      <div className="section-kicker">DATA &amp; SOURCES</div>
      <h2 id="sources-title" className="serif m-0 mb-3 text-2xl font-medium">
        数据来源与更新时间
      </h2>
      <p className="mt-0 mb-4 max-w-[680px] text-[13px] leading-[1.8] text-muted">
        本页所有数值均为阶段 A 的固定示例（状态：{FACT_STATUS_LABEL.estimated} /
        {FACT_STATUS_LABEL.needs_check}），不作为导航或预订依据。正式版中，路线来自地图服务、天气来自预报接口，并逐项标注来源与获取时间。
      </p>
      <ul className="m-0 grid list-none gap-2 p-0 text-xs text-muted md:grid-cols-2">
        {[...sources.values()].map((s) => (
          <li key={s.provider} className="rounded-[10px] border border-line bg-panel px-4 py-3">
            <span className="font-medium text-ink">{s.provider}</span>
            <span className="mx-2 text-soft">·</span>
            状态：{s.status === "verified" ? FACT_STATUS_LABEL.verified : s.status === "estimated" ? FACT_STATUS_LABEL.estimated : FACT_STATUS_LABEL.needs_check}
            <span className="mx-2 text-soft">·</span>
            获取于 {new Date(s.fetchedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}
          </li>
        ))}
        <li className="rounded-[10px] border border-line bg-panel px-4 py-3">
          <span className="font-medium text-ink">factsUpdatedAt</span>
          <span className="mx-2 text-soft">·</span>
          {new Date(plan.factsUpdatedAt).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" })}
        </li>
      </ul>
    </section>
  );
}
