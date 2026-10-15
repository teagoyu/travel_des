import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion, insertVersion, setCurrentVersion } from "@/lib/db";
import { jsonError, parseBody } from "@/lib/api";
import { VersionRollbackBodySchema } from "@/lib/schemas";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== await getSessionId()) return jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书");
  const parsed = await parseBody(request, VersionRollbackBodySchema);
  if (!parsed.ok) return parsed.response;
  const { targetVersion, baseVersion } = parsed.data;
  if (baseVersion !== row.current_version) return jsonError(409, "VERSION_CONFLICT", "路书已有更新版本，请刷新后重试", { currentVersion: row.current_version });
  const target = getPlanVersion(id, targetVersion);
  if (!target) return jsonError(404, "VERSION_NOT_FOUND", "目标版本不存在");
  const next = structuredClone(target);
  const newVersion = row.current_version + 1;
  next.version = newVersion;
  next.createdAt = new Date().toISOString();
  const changes = [`已从 v${targetVersion} 回退，生成新版本 v${newVersion}`];
  insertVersion(next, changes);
  setCurrentVersion(id, newVersion);
  return NextResponse.json({ version: newVersion, changes }, { status: 201 });
}
