import type { TripPlan } from "@/lib/types";
import { formatDuration } from "@/lib/tripForm";

/** 侧栏"这趟旅行"摘要卡 */
export default function TripSummary({ plan }: { plan: TripPlan }) {
  const durations = plan.days
    .flatMap((d) => d.legs.map((l) => l.durationMinutes ?? 0))
    .filter((m) => m > 0);
  const maxDrivingMinutes = durations.length ? Math.max(...durations) : null;

  return (
    <div className="side-card">
      <div className="section-kicker">AT A GLANCE</div>
      <h3 className="serif mb-2 text-xl font-medium">这趟旅行</h3>
      <p className="mt-0 mb-4 text-[13px] leading-[1.8] text-muted">
        从{plan.request.origin}出发，前往{plan.request.destination.replace(/^.*·\s*/, "")}。路线核验完成后，这里会汇总真实里程、耗时与预算。
      </p>
      <p className="serif m-0 mb-4 text-[26px] font-medium">
        {plan.days.length} <span className="text-sm text-muted">天 / {plan.days.length - 1} 晚</span>
      </p>
      <dl className="m-0 grid gap-2.5 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">行程里程</dt>
          <dd className="m-0 flex items-center gap-1.5 font-medium">
            {plan.totalDistanceKm ? `约 ${plan.totalDistanceKm.toLocaleString("zh-CN")} km` : "待核验"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">最长单日驾驶</dt>
          <dd className="m-0 font-medium">{maxDrivingMinutes === null ? "待核验" : formatDuration(maxDrivingMinutes)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">旅行风格</dt>
          <dd className="m-0 font-medium">
            {plan.request.interests[0] ?? "风景"} / 摄影
          </dd>
        </div>
      </dl>
      <p className="mt-3 mb-0 text-[11px] text-soft">当前未接入真实地图数据，暂不展示虚构的里程与驾驶时长。</p>
    </div>
  );
}
