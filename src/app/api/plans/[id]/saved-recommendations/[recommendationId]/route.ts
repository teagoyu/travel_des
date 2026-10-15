import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, removeSavedRecommendation } from "@/lib/db";
import { jsonError } from "@/lib/api";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; recommendationId: string }> }) {
  const { id, recommendationId } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== await getSessionId()) return jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书");
  const day = Number(new URL(request.url).searchParams.get("day"));
  if (!Number.isInteger(day) || day < 1) return jsonError(400, "DAY_NOT_FOUND", "行程日期不存在");
  const removed = removeSavedRecommendation(id, day, recommendationId);
  if (!removed) return jsonError(404, "RECOMMENDATION_NOT_FOUND", "收藏不存在");
  return NextResponse.json({ removed: true });
}
