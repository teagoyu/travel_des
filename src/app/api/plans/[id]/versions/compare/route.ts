import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion } from "@/lib/db";
import { jsonError } from "@/lib/api";
import type { PlanVersionDiff } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== await getSessionId()) return jsonError(403, "PLAN_FORBIDDEN", "无权查看该路书");
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to") ?? row.current_version);
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1) return jsonError(400, "INVALID_VERSION", "版本号无效");
  const fromPlan = getPlanVersion(id, from);
  const toPlan = getPlanVersion(id, to);
  if (!fromPlan || !toPlan) return jsonError(404, "VERSION_NOT_FOUND", "目标版本不存在");
  const diffs: PlanVersionDiff[] = [];
  const maxDays = Math.max(fromPlan.days.length, toPlan.days.length);
  for (let index = 0; index < maxDays; index += 1) {
    const left = fromPlan.days[index];
    const right = toPlan.days[index];
    if (!left && right) diffs.push({ dayIndex: right.dayIndex, kind: "added", label: `新增第 ${right.dayIndex} 天：${right.title}`, to: right.title });
    else if (left && !right) diffs.push({ dayIndex: left.dayIndex, kind: "removed", label: `移除第 ${left.dayIndex} 天：${left.title}`, from: left.title });
    else if (left && right) {
      const leftStops = left.schedule.map((item) => item.title).join("、");
      const rightStops = right.schedule.map((item) => item.title).join("、");
      if (left.title !== right.title || leftStops !== rightStops || left.end.name !== right.end.name) {
        diffs.push({ dayIndex: right.dayIndex, kind: "changed", label: `第 ${right.dayIndex} 天行程调整`, from: `${left.title} · ${leftStops}`, to: `${right.title} · ${rightStops}` });
      }
    }
  }
  return NextResponse.json({ from, to, diffs });
}
