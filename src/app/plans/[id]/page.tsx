import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import TopBar from "@/components/TopBar";
import PlanView from "@/components/PlanView";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion, getChecklist } from "@/lib/db";
import { SAMPLE_TRIP_PLAN } from "@/lib/fixtures";
import { buildFixturePlan } from "@/lib/fixtureFactory";
import type { TripPlan } from "@/lib/types";
import { getTravelTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "山海之间 · 路书详情",
};

/**
 * 路书详情页 /plans/:id
 * 阶段 B：数据库读取 + 会话归属校验；`sample-chuanxi-2026` 保留为公开示例。
 */
export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ theme?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const initialTheme = getTravelTheme(query?.theme);

  // 公开示例路书（fixture 驱动，无会话要求）
  if (id === SAMPLE_TRIP_PLAN.id) {
    return (
      <>
        <TopBar />
        <main>
          <PlanView plan={SAMPLE_TRIP_PLAN} readOnly initialTheme={initialTheme} />
        </main>
      </>
    );
  }

  const sessionId = await getSessionId();
  const row = getPlanRow(id);
  if (!row) notFound();
  if (row.session_id !== sessionId) {
    // 不属于当前会话：按方案要求不可访问（页面说明清除 Cookie 会失去编辑权）
    redirect("/?forbidden=1");
  }
  if (row.current_version < 1) {
    // 生成尚未完成：回到生成页恢复进度
    redirect(`/plans/new?job=pending-${id}`);
  }

  const plan = getPlanVersion(id, row.current_version);
  if (!plan) notFound();
  // 兼容之前已经落库的旧版模板数据：页面读取时按原始请求重新生成草稿，
  // 避免旧版本继续显示硬编码站点和虚构里程。
  const hasLegacyFixture = plan.days.some((day) =>
    day.legs.some((leg) => leg.source.provider === "sample-fixture"),
  );
  const refreshedPlan = hasLegacyFixture
    ? { ...buildFixturePlan(plan.request, id), version: plan.version, createdAt: plan.createdAt }
    : plan;
  const withChecklist: TripPlan = { ...refreshedPlan, checklist: getChecklist(id) };

  return (
    <>
      <TopBar />
      <main>
        <PlanView plan={withChecklist} initialTheme={initialTheme} />
      </main>
    </>
  );
}
