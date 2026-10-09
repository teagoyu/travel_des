/**
 * 生成任务引擎（阶段 B）。
 *
 * 状态流：queued → planning → verifying → writing → complete（失败为 failed）。
 * 阶段 B 的"生成"是确定性操作：把 TripRequest 组装成一份新的示例路书
 * （结构来自 fixture 模板，数值按请求天数裁剪并标注 estimated）。
 * 阶段 C 将把 planning/verifying 两步替换为 AI 骨架 + 地图算路。
 *
 * 推进模型：惰性推进——读取任务时按 elapsed 时间推进状态并落库，
 * 无需常驻 worker；刷新页面后从数据库恢复进度（方案 §9-B 验收项）。
 */

import {
  createPlanRow,
  getJob,
  getPlanRow,
  getPlanVersion,
  insertJob,
  insertVersion,
  replaceChecklist,
  setCurrentVersion,
  updateJobState,
} from "./db";
import { buildFixturePlan } from "./fixtureFactory";
import { enrichPlanWithAmap } from "./amap";
import { planRouteWithDeepSeek } from "./deepseek";
import type { GenerationJob, PlanErrorCode, TripPlan, TripRequest } from "./types";

/** 每个状态的停留时长（毫秒）——模拟真实生成耗时，阶段 C 替换为真实工作 */
const STATE_DURATIONS: Record<string, number> = {
  queued: 1200,
  planning: 2600,
  verifying: 2600,
  writing: 2200,
};
const TOTAL_MS = Object.values(STATE_DURATIONS).reduce((a, b) => a + b, 0);
const STATE_ORDER = ["queued", "planning", "verifying", "writing"] as const;

export function createJob(sessionId: string, request: TripRequest): { jobId: string; planId: string } {
  // 阶段 B：一个请求对应一个 plan 行 + 一个 job；生成完成时写入 v1。
  const planId = `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // 先建 plan 行（jobs.plan_id 外键引用它），再建任务
  createPlanRow(sessionId, planId, new Date().toISOString());
  insertJob({ jobId, planId, sessionId, state: "queued", progress: 0 });
  // request 以 v0 种子版本持久化，finalize 时读取（避免加列）
  insertVersion({
    ...emptyPlanShell(planId),
    request,
  } as unknown as TripPlan & { version: number });
  return { jobId, planId };
}

function emptyPlanShell(planId: string): { id: string; version: number; createdAt: string } {
  return { id: planId, version: 0, createdAt: new Date().toISOString() };
}

/**
 * 读取并推进任务。返回给前端的只读视图；
 * complete 时已把生成结果落库为 plan v1。
 */
export async function pollJob(jobId: string): Promise<GenerationJob | undefined> {
  const job = getJob(jobId);
  if (!job) return undefined;

  if (job.state === "complete" || job.state === "failed") {
    return {
      jobId: job.job_id,
      state: job.state as GenerationJob["state"],
      progress: job.progress,
      planId: job.plan_id,
      errorCode: (job.error_code ?? undefined) as PlanErrorCode | undefined,
    };
  }

  const elapsed = Date.now() - new Date(job.created_at).getTime();
  let acc = 0;
  let state = "queued" as (typeof STATE_ORDER)[number] | "complete";
  let progress = 0;
  for (const s of STATE_ORDER) {
    const dur = STATE_DURATIONS[s];
    if (elapsed < acc + dur) {
      state = s;
      progress = Math.min(99, Math.round(((acc + (elapsed - acc)) / TOTAL_MS) * 100));
      break;
    }
    acc += dur;
    state = "complete";
    progress = 100;
  }

  if (state !== job.state || progress !== job.progress) {
    updateJobState(jobId, state, progress);
  }

  if (state === "complete") {
    await finalizeJob(job.plan_id, job.job_id);
  }

  return {
    jobId: job.job_id,
    state: state as GenerationJob["state"],
    progress,
    planId: job.plan_id,
    errorCode: (job.error_code ?? undefined) as PlanErrorCode | undefined,
  };
}

/** 生成完成：写入 plan v1 并把指针指过去 */
async function finalizeJob(planId: string, jobId: string): Promise<void> {
  const row = getPlanRow(planId);
  if (!row) return;
  const existing = getPlanVersion(planId, 1);
  if (existing) return; // 已落库，幂等
  const job = getJob(jobId);
  if (!job) return;
  // request 存于 v0 种子版本（createJob 时写入）
  const seed = getPlanVersion(planId, 0);
  if (!seed) return;
  const skeleton = await planRouteWithDeepSeek(buildFixturePlan(seed.request, planId));
  const plan = await enrichPlanWithAmap(skeleton);
  insertVersion(plan);
  setCurrentVersion(planId, 1);
  replaceChecklist(plan.id, plan.checklist);
}
