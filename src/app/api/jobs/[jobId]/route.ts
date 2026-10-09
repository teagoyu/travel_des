import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getJob } from "@/lib/db";
import { pollJob } from "@/lib/jobEngine";
import { jsonError } from "@/lib/api";

/**
 * GET /api/jobs/:jobId —— 仅创建该任务的会话可查询。
 * 读取时惰性推进状态；complete 后 planId 可用。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const sessionId = await getSessionId();
  const { jobId } = await params;

  const row = getJob(jobId);
  if (!row) return jsonError(404, "JOB_NOT_FOUND", "任务不存在");
  if (row.session_id !== sessionId) {
    return jsonError(403, "JOB_FORBIDDEN", "无权查看该任务");
  }

  const job = await pollJob(jobId);
  if (!job) return jsonError(404, "JOB_NOT_FOUND", "任务不存在");
  return NextResponse.json(job);
}
