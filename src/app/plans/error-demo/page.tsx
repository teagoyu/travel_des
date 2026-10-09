import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "山海之间 · 生成失败",
  robots: { index: false },
};

/**
 * 错误状态演示页 /plans/error-demo
 * 阶段 A：展示生成失败态的界面约定（不编造数字，提供重试与修改入口）；
 * 阶段 B：由 GET /api/jobs/:jobId 返回 errorCode 时渲染对应文案。
 */
export default function PlanErrorPage() {
  return (
    <>
      <TopBar />
      <main className="grid min-h-[calc(100vh-72px)] place-items-center px-6 py-16 text-center">
        <div>
          <p className="eyebrow m-0">生成失败</p>
          <h1 className="serif m-0 mt-3 mb-3 text-[clamp(30px,5vw,52px)] font-medium">
            这次没有生成出路书
          </h1>
          <p className="mx-auto mb-2 max-w-[560px] text-sm leading-[1.8] text-muted">
            错误码：<code className="rounded bg-panel px-2 py-0.5 text-xs">ROUTE_UNAVAILABLE</code>
          </p>
          <p className="mx-auto mb-8 max-w-[560px] text-sm leading-[1.8] text-muted">
            未能核验出可行的每日路线，因此不展示任何编造的里程或时间。可以修改出发地、目的地或天数后重试。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/plans/new?job=demo-retry" className="btn btn-primary">
              重试生成
            </Link>
            <Link href="/#plan-form" className="btn">
              修改需求
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
