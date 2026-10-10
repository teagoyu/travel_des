"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JOB_STATE_LABEL, type GenerationJob } from "@/lib/types";

const STEPS: { key: GenerationJob["state"]; label: string; text: string }[] = [
  { key: "queued", label: "01 路线骨架", text: "从城市之间，找到刚好的驾驶节奏。" },
  { key: "planning", label: "02 每日节奏", text: "让每日里程和停留时间相互匹配。" },
  { key: "verifying", label: "03 风景与光线", text: "给雪山、草原与日落留下好光线。" },
  { key: "writing", label: "04 出行提醒", text: "把住宿、预算和风险整理成文。" },
];

const ERROR_TEXT: Record<string, string> = {
  PLACE_AMBIGUOUS: "出发地或目的地有歧义，请补充城市或地标后重试。",
  ROUTE_UNAVAILABLE: "未能核验出可行的每日路线，可修改日期或天数后重试。",
  PROVIDER_TIMEOUT: "地图或天气服务超时，请稍后重试。",
};

/**
 * 生成过程视图（阶段 B）：轮询 GET /api/jobs/:jobId。
 * jobId 在 URL 中，刷新后自动恢复进度；失败提供重试与修改入口。
 */
export default function GeneratingView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [failed, setFailed] = useState(false);
  const doneRef = useRef(false);

  const finish = useCallback(
    (planId: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      router.replace(`/plans/${planId}`);
    },
    [router],
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" });
        if (res.status === 403 || res.status === 404) {
          setFailed(true);
          return;
        }
        const data = (await res.json()) as GenerationJob;
        setJob(data);
        if (data.state === "complete" && data.planId) {
          finish(data.planId);
          return;
        }
        if (data.state === "failed") {
          setFailed(true);
          return;
        }
      } catch {
        // 网络抖动：继续轮询
      }
      if (!stopped) timer = setTimeout(tick, 700);
    };

    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [jobId, finish]);

  const stepIndex = job ? STEPS.findIndex((s) => s.key === job.state) : 0;
  const activeIndex = stepIndex >= 0 ? stepIndex : STEPS.length - 1;

  return (
    <div className="generation-page grid min-h-[calc(100vh-72px)] place-items-center px-5 py-11 text-center">
      <span className="generation-page__sun" aria-hidden="true" />
      <span className="generation-page__route" aria-hidden="true" />
      <div className="generation-card relative z-[1] w-full max-w-[760px] rounded-[28px] px-6 py-10 sm:px-12 sm:py-14">
        <div className="generation-mark loading-icon serif mx-auto mb-7 grid size-[94px] place-items-center rounded-full text-[44px]">
          山
        </div>
        {failed ? (
          <>
            <p className="eyebrow m-0">生成失败</p>
            <h1 className="serif m-0 mt-3 mb-3 text-[clamp(30px,5vw,52px)] font-medium">
              这次没有生成出路书
            </h1>
            <p className="generation-copy mx-auto mb-8 max-w-[560px] text-sm leading-[1.8]">
              {job?.errorCode
                ? ERROR_TEXT[job.errorCode] ?? "生成过程中出现问题，请重试。"
                : "任务不存在或不属于当前会话（会话 Cookie 可能已被清除）。"}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                重试
              </button>
              <Link href="/#plan-form" className="btn">
                修改需求
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow m-0">构思你的下一段路</p>
            <h1 className="serif m-0 mt-3 mb-3 text-[clamp(36px,5vw,66px)] font-medium">
              正在整理一份路书
            </h1>
            <p className="generation-copy m-0 text-[15px]" aria-live="polite">
              {STEPS[activeIndex].text}
            </p>
            <p className="generation-meta mt-2 text-xs">
              任务 {jobId} · 进度 {job?.progress ?? 0}%（刷新本页可恢复进度）
            </p>
            <div className="generation-steps mt-9 grid gap-2 text-left sm:grid-cols-4">
              {STEPS.map((step, index) => (
                <span key={step.key} className={`generation-step ${index <= activeIndex ? "is-active" : ""}`}>
                  {step.label}
                  <span className="sr-only">
                    {index <= activeIndex ? `（${JOB_STATE_LABEL[step.key]}）` : ""}
                  </span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
