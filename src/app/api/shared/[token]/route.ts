import { NextResponse } from "next/server";
import { getPlanRow, getPlanVersion, getShareToken } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { toSharedView } from "@/lib/shareView";

/**
 * GET /api/shared/:token —— 公开字段投影。
 * 不含编辑令牌、私人备注与内部错误；过期/撤销返回 410。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const share = getShareToken(token);
  if (!share) return jsonError(404, "SHARE_NOT_FOUND", "分享链接不存在");
  if (share.revoked_at) return jsonError(410, "SHARE_REVOKED", "分享链接已被撤销");
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return jsonError(410, "SHARE_EXPIRED", "分享链接已过期");
  }

  const row = getPlanRow(share.plan_id);
  if (!row || row.current_version < 1) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  const plan = getPlanVersion(share.plan_id, row.current_version);
  if (!plan) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");

  return NextResponse.json(toSharedView(plan, new Date().toISOString()));
}
