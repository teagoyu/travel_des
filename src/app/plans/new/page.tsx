import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import GeneratingView from "@/components/GeneratingView";

export const metadata: Metadata = {
  title: "山海之间 · 正在生成路书",
  robots: { index: false },
};

/**
 * 生成过程页 /plans/new?job=...
 * 阶段 B：客户端轮询 /api/jobs/:jobId；jobId 在 URL 中，刷新后恢复进度。
 */
export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const jobParam = params.job;
  const jobId = Array.isArray(jobParam) ? jobParam[0] : jobParam;

  if (!jobId) {
    redirect("/");
  }

  return (
    <>
      <TopBar />
      <main>
        <GeneratingView jobId={jobId} />
      </main>
    </>
  );
}
