import { NextResponse } from "next/server";
import { requireSessionId } from "@/lib/session";
import { createJob } from "@/lib/jobEngine";
import { CreatePlanBodySchema } from "@/lib/schemas";
import { parseBody } from "@/lib/api";

/**
 * POST /api/plans —— 校验 TripRequest，创建生成任务。
 * 返回 202 { jobId, planId }；生成结果由 GET /api/jobs/:jobId 轮询获取。
 */
export async function POST(request: Request) {
  const sessionId = await requireSessionId();
  const parsed = await parseBody(request, CreatePlanBodySchema);
  if (!parsed.ok) return parsed.response;
  const tripRequest = parsed.data;

  const { jobId, planId } = createJob(sessionId, tripRequest);
  return NextResponse.json({ jobId, planId }, { status: 202 });
}
