import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, revokeShareToken } from "@/lib/db";
import { jsonError } from "@/lib/api";

/**
 * DELETE /api/plans/:id/share/:token —— 撤销只读链接（仅所属会话）。
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; token: string }> },
) {
  const sessionId = await getSessionId();
  const { id, token } = await params;

  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权撤销该链接");

  const ok = revokeShareToken(id, token);
  if (!ok) return jsonError(404, "TOKEN_NOT_FOUND", "链接不存在或已撤销");
  return new NextResponse(null, { status: 204 });
}
