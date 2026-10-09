import { NextResponse } from "next/server";
import { requireSessionId } from "@/lib/session";
import { getPlanRow, setChecklistChecked } from "@/lib/db";
import { jsonError, parseBody } from "@/lib/api";
import { ChecklistPatchBodySchema } from "@/lib/schemas";

/**
 * PATCH /api/plans/:id/checklist/:itemId —— 保存待办勾选状态（所属会话）。
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const sessionId = await requireSessionId();
  const { id, itemId } = await params;

  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书");

  const parsed = await parseBody(request, ChecklistPatchBodySchema);
  if (!parsed.ok) return parsed.response;

  const ok = setChecklistChecked(id, itemId, parsed.data.checked);
  if (!ok) return jsonError(404, "ITEM_NOT_FOUND", "待办项不存在");
  return NextResponse.json({ checked: parsed.data.checked });
}
