import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, listPlanVersions } from "@/lib/db";
import { jsonError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== await getSessionId()) return jsonError(403, "PLAN_FORBIDDEN", "无权查看该路书");
  return NextResponse.json({ currentVersion: row.current_version, versions: listPlanVersions(id) });
}
