import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { createShareToken, getPlanRow } from "@/lib/db";
import { jsonError, parseBody } from "@/lib/api";
import { ShareBodySchema } from "@/lib/schemas";

/**
 * POST /api/plans/:id/share —— 创建只读分享链接。
 * 返回 { url, token }；可带 expiresAt。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getSessionId();
  const { id } = await params;

  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权分享该路书");
  if (row.current_version < 1) return jsonError(409, "PLAN_NOT_READY", "路书尚未生成完成");

  const parsed = await parseBody(request, ShareBodySchema);
  if (!parsed.ok) return parsed.response;

  const { token, expiresAt } = createShareToken(id, parsed.data.expiresAt);
  const origin = new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/s/${token}`, token, ...(expiresAt ? { expiresAt } : {}) }, { status: 201 });
}
