import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion, getChecklist } from "@/lib/db";
import { jsonError } from "@/lib/api";
import type { TripPlan } from "@/lib/types";

/**
 * GET /api/plans/:id —— 仅所属会话可读取。
 * 返回当前版本 TripPlan，checklist 以独立存储的勾选状态覆盖。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getSessionId();
  const { id } = await params;

  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) {
    return jsonError(403, "PLAN_FORBIDDEN", "无权访问该路书");
  }
  if (row.current_version < 1) {
    return jsonError(409, "PLAN_NOT_READY", "路书尚未生成完成");
  }

  const plan = getPlanVersion(id, row.current_version);
  if (!plan) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");

  const withChecklist: TripPlan = { ...plan, checklist: getChecklist(id) };
  return NextResponse.json(withChecklist);
}
