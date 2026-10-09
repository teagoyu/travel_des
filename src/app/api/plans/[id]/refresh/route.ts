import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion, insertVersion, setCurrentVersion } from "@/lib/db";
import { enrichPlanWithAmap } from "@/lib/amap";
import { jsonError } from "@/lib/api";

/** 重新核验已有路书的高德事实，不重新生成用户已经写好的 AI 行程。 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getSessionId();
  const { id } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书");
  const base = getPlanVersion(id, row.current_version);
  if (!base) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");

  const refreshed = await enrichPlanWithAmap(base, { rewriteWithAi: false });
  const next = { ...refreshed, version: base.version + 1, createdAt: new Date().toISOString() };
  insertVersion(next);
  setCurrentVersion(id, next.version);
  return NextResponse.json({ version: next.version, plan: next }, { status: 201 });
}
