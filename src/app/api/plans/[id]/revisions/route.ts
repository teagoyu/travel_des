import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion, insertVersion, setCurrentVersion } from "@/lib/db";
import { jsonError, parseBody } from "@/lib/api";
import { RevisionBodySchema } from "@/lib/schemas";
import type { TripPlan } from "@/lib/types";
import { interpretRevisionWithDeepSeek } from "@/lib/deepseek";
import { enrichPlanWithAmap } from "@/lib/amap";

/**
 * POST /api/plans/:id/revisions —— 基于当前版本生成新版本。
 * 阶段 B：对指定天做确定性调整（按 instruction 关键词），生成变更摘要。
 * 冲突（baseVersion 落后于当前版本）返回 409。
 * 阶段 E 将替换为自然语言 → AI 重新规划。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getSessionId();
  const { id } = await params;

  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书");

  const parsed = await parseBody(request, RevisionBodySchema);
  if (!parsed.ok) return parsed.response;
  const { baseVersion, dayIndex, instruction } = parsed.data;

  if (baseVersion !== row.current_version) {
    return jsonError(409, "VERSION_CONFLICT", "路书已有更新版本，请刷新后重试", {
      currentVersion: row.current_version,
    });
  }

  const base = getPlanVersion(id, row.current_version);
  if (!base) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");

  const { plan: next, changes } = await applyRevision(base, dayIndex, instruction);
  insertVersion(next);
  setCurrentVersion(id, next.version);

  return NextResponse.json({ version: next.version, changes }, { status: 201 });
}

/** 阶段 B 的确定性修改规则（演示影响预览；阶段 E 换成 AI） */
async function applyRevision(base: TripPlan, dayIndex: number, instruction: string): Promise<{
  plan: TripPlan;
  changes: string[];
}> {
  const plan: TripPlan = structuredClone(base);
  plan.version = base.version + 1;
  plan.createdAt = new Date().toISOString();
  const changes: string[] = [];
  const day = plan.days.find((d) => d.dayIndex === dayIndex);
  if (!day) return { plan, changes: [`第 ${dayIndex} 天不存在，未做修改`] };

  // 返程长距离时，把“先睡一晚”落实成真实的连续两天，而不是只改一段文案。
  // 默认落脚点选择百色：深圳—大理返程中间位置，且高德会在后续步骤重新核验两段路线。
  if (instruction.includes("增加中途住宿") || instruction.includes("百色住宿")) {
    if (!plan.request.returnTrip || day.dayIndex !== plan.days.length || day.end.name !== plan.request.origin) {
      return { plan, changes: [`第 ${dayIndex} 天不是返程终点日，暂未插入中途住宿`] };
    }
    const stopName = "百色";
    const returnDay = structuredClone(day);
    day.end = { name: stopName };
    day.title = `${day.start.name} → ${stopName}`;
    day.summary = `返程先到${stopName}休息一晚，避免当天连续长时间驾驶。`;
    day.stayAdvice = `建议在${stopName}入住，第二天再返回${plan.request.origin}。`;
    day.legs = [];
    day.schedule = [
      { time: "白天", title: `${day.start.name} → ${stopName}`, description: "返程拆分为两段，今天控制驾驶强度并在百色住宿。" },
      { time: "晚上", title: `${stopName}入住`, description: "优先选择靠近高速出口、方便停车和第二天出发的住宿。" },
    ];
    day.risks = [...day.risks.filter((risk) => !risk.includes("单日驾驶约18小时") && !risk.includes("18.0 小时")), "返程已拆分：今天到百色住宿，第二天继续返回。"];

    returnDay.dayIndex = day.dayIndex + 1;
    returnDay.date = nextDate(day.date);
    returnDay.start = { name: stopName };
    returnDay.end = { name: plan.request.origin };
    returnDay.title = `${stopName} → ${plan.request.origin}`;
    returnDay.summary = `从${stopName}继续返回${plan.request.origin}，路线已拆分为更容易执行的返程段。`;
    returnDay.legs = [];
    returnDay.schedule = [
      { time: "上午", title: `${stopName} → ${plan.request.origin}`, description: "早餐后出发，按实时路况安排服务区和午餐休息。" },
      { time: "晚上", title: `${plan.request.origin}抵达`, description: "到达后结束本次返程，疲劳时优先在途中再次停留。" },
    ];
    returnDay.stayAdvice = `抵达${plan.request.origin}后结束行程；如当天状态不佳，优先继续在沿途休息。`;
    returnDay.risks = ["返程仍可能较长，请根据实时路况和体力增加服务区休息。"];
    returnDay.weather = undefined;
    returnDay.recommendations = undefined;
    returnDay.hotels = undefined;
    plan.days = [...plan.days, returnDay];
    plan.request = { ...plan.request, days: plan.request.days + 1 };
    plan.title = `${plan.request.days} 天，${plan.request.origin} → ${plan.request.destination} → ${plan.request.origin}。`;
    const routed = await enrichPlanWithAmap(plan, { rewriteWithAi: false });
    routed.version = base.version + 1;
    routed.createdAt = new Date().toISOString();
    return { plan: routed, changes: [`返程已增加${stopName}住宿，拆分为第 ${dayIndex} 天和第 ${dayIndex + 1} 天`] };
  }

  const aiRevision = await interpretRevisionWithDeepSeek(base, dayIndex, instruction);
  if (aiRevision) {
    if (aiRevision.targetEnd && aiRevision.targetEnd !== day.end.name) {
      day.end = { name: aiRevision.targetEnd };
      day.legs = [];
      changes.push(`第 ${dayIndex} 天落脚点调整为 ${aiRevision.targetEnd}，正在重新核验路线`);
    }
    if (aiRevision.summary) day.summary = aiRevision.summary;
    if (aiRevision.alternative) day.alternative = aiRevision.alternative;
    if (aiRevision.schedule?.length) day.schedule = aiRevision.schedule.map((item) => ({
      time: item.time,
      title: item.title ?? "当日安排",
      description: item.description ?? "根据当天节奏灵活安排。",
    }));
    if (aiRevision.risks?.length) day.risks = aiRevision.risks;
    changes.push(`第 ${dayIndex} 天已由 AI 解析调整要求`);
    const routed = await enrichPlanWithAmap(plan, { rewriteWithAi: false });
    routed.version = base.version + 1;
    routed.createdAt = new Date().toISOString();
    return { plan: routed, changes };
  }

  const text = instruction.toLowerCase();
  if (text.includes("少开") || text.includes("轻松")) {
    if (day.legs.length) {
      const leg = day.legs[0];
      const cut = Math.round((leg.distanceKm ?? 0) * 0.3);
      leg.distanceKm = (leg.distanceKm ?? 0) - cut;
      leg.durationMinutes = Math.round((leg.durationMinutes ?? 0) * 0.7);
      leg.source = { provider: "sample-fixture", fetchedAt: new Date().toISOString(), status: "estimated" };
      changes.push(`第 ${dayIndex} 天示意里程减少约 ${cut} km`);
    } else {
      changes.push(`第 ${dayIndex} 天为原地活动日，无需调整驾驶`);
    }
  }
  if (text.includes("日落") || text.includes("拍摄")) {
    day.photoTips = [
      {
        title: "日落优先",
        bestTime: "日落前一小时",
        description: "已把日落拍摄加入当天建议；正式版将按日出日落时间核验可达性。",
      },
    ];
    changes.push(`第 ${dayIndex} 天摄影建议更新为日落优先`);
  }
  if (text.includes("徒步")) {
    day.schedule.push({ time: "15:00", title: "轻徒步", description: "新增一段轻量步行，按体力与天气调整。" });
    changes.push(`第 ${dayIndex} 天新增轻徒步安排`);
  }
  if (text.includes("雨") || text.includes("备选")) {
    day.alternative = "雨天备选：减少户外停留，改为室内与沿途观景，缩短徒步段。";
    changes.push(`第 ${dayIndex} 天已配置雨天备选方案`);
  }
  if (text.includes("减少户外") || text.includes("核心景点") || text.includes("plan b")) {
    day.alternative = "Plan B：保留当天最核心的一个景点，取消次要户外停留；优先选择交通方便、可随时离开的室内或城市活动，并预留返程缓冲。";
    changes.push(`第 ${dayIndex} 天已生成可执行的 Plan B`);
  }
  if (!changes.length) {
    day.summary = `${day.summary}（已按「${instruction}」记录调整意图，正式版将重新规划该日）`;
    changes.push(`已记录第 ${dayIndex} 天的修改意图，生成新版本 v${plan.version}`);
  }

  // 重算总额
  plan.totalBudgetCny = plan.days.reduce(
    (acc, d) => ({
      min: acc.min + (d.budgetCny?.min ?? 0),
      max: acc.max + (d.budgetCny?.max ?? 0),
    }),
    { min: 0, max: 0 },
  );
  plan.totalDistanceKm = plan.days.reduce(
    (s, d) => s + d.legs.reduce((x, l) => x + (l.distanceKm ?? 0), 0),
    0,
  );
  return { plan, changes };
}

function nextDate(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
