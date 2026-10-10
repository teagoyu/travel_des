import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getCurrentPlan, getPlanRow } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { createMapMotionJob, findLatestMapMotionJob } from "@/lib/mapMotion";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionId = await getSessionId();
  const { id } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权查看该路书");
  const job = await findLatestMapMotionJob(id, sessionId);
  if (!job) return jsonError(404, "ANIMATION_NOT_FOUND", "暂无路线动画任务");
  return NextResponse.json({ ...job, jobId: job.id });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sessionId = await getSessionId();
  const { id } = await params;
  const row = getPlanRow(id);
  if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
  if (row.session_id !== sessionId) return jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书");
  const plan = getCurrentPlan(id);
  if (!plan) return jsonError(409, "PLAN_NOT_READY", "路书尚未生成完成");
  try {
    const body = await request.json().catch(() => ({})) as { theme?: string; force?: boolean };
    const existingJob = await findLatestMapMotionJob(id, sessionId);
    if (body.force !== true && existingJob && ["queued", "rendering", "complete"].includes(existingJob.status)) {
      return NextResponse.json({ ...existingJob, jobId: existingJob.id }, { status: existingJob.status === "complete" ? 200 : 202 });
    }
    const job = await createMapMotionJob(plan, sessionId, body.theme as Parameters<typeof createMapMotionJob>[2]);
    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  } catch (error) {
    return jsonError(503, "ANIMATION_UNAVAILABLE", error instanceof Error ? error.message : "路线动画服务暂不可用");
  }
}
