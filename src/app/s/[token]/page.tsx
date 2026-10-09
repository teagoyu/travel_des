import type { Metadata } from "next";
import TopBar from "@/components/TopBar";
import Link from "next/link";
import { getPlanRow, getPlanVersion, getShareToken } from "@/lib/db";
import { toSharedView, type SharedPlanView } from "@/lib/shareView";

export const metadata: Metadata = {
  title: "山海之间 · 只读分享",
  robots: { index: false },
};

/**
 * 只读分享页：直接读取公开字段投影，不包含编辑权限和私人备注。
 */
export default async function SharedPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const shared = readSharedPlan(token);
  return <><TopBar />{shared ? <SharedRoadbook plan={shared} /> : <UnavailableShare />}</>;
}

function SharedRoadbook({ plan }: { plan: SharedPlanView }) {
  return <main className="min-h-screen bg-[#101612] px-5 py-12 text-ink sm:px-8"><div className="mx-auto max-w-5xl">
    <div className="mb-10 border-b border-line pb-7"><p className="eyebrow m-0">READ ONLY / SHARED ROADBOOK</p><h1 className="serif m-0 mt-3 text-[clamp(32px,5vw,58px)] font-medium">{plan.title}</h1><p className="mt-3 mb-0 text-sm text-muted">只读分享 · 数据更新于 {formatDateTime(plan.factsUpdatedAt)}</p></div>
    <div className="grid gap-6">{plan.days.map((day) => <article key={day.dayIndex} className="rounded-[20px] border border-line bg-[linear-gradient(145deg,#202b24,#151a17)] p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/[0.1] pb-5"><div><p className="m-0 text-[11px] font-bold tracking-[0.2em] text-gold">DAY {String(day.dayIndex).padStart(2, "0")} · {formatDate(day.date)}</p><h2 className="serif m-0 mt-2 text-2xl sm:text-3xl">{day.title}</h2></div><span className="text-xs text-soft">{day.start} → {day.end}</span></div>
      <p className="mt-5 mb-5 text-sm leading-[1.8] text-muted">{day.summary}</p><div className="grid gap-2">{day.schedule.map((item) => <div key={`${item.time}-${item.title}`} className="grid grid-cols-[52px_1fr] gap-3 rounded-xl border border-line bg-[#121813] px-4 py-3"><span className="text-xs text-gold">{item.time ?? "待定"}</span><div><strong className="block text-sm">{item.title}</strong><p className="m-0 mt-1 text-xs leading-[1.7] text-muted">{item.description}</p></div></div>)}</div>
      <div className="mt-5 grid gap-3 text-xs leading-[1.8] text-muted sm:grid-cols-3"><div><strong className="block text-soft">拍摄建议</strong>{day.photoTips[0]?.description ?? day.photoTips[0]?.title ?? "暂无"}</div><div><strong className="block text-soft">住宿建议</strong>{day.stayAdvice}</div><div><strong className="block text-soft">注意事项</strong>{day.risks.join(" ") || "暂无"}</div></div>
    </article>)}</div><p className="mt-8 text-center text-xs text-soft">山海之间 · 这是一份只读路书分享，不包含编辑权限。</p>
  </div></main>;
}

function UnavailableShare() {
  return <main className="grid min-h-[calc(100vh-72px)] place-items-center px-6 py-16 text-center"><div><p className="eyebrow m-0">READ ONLY / 分享链接</p><h1 className="serif m-0 mt-3 mb-3 text-[clamp(30px,5vw,52px)] font-medium">分享链接不可用</h1><p className="mx-auto mb-8 max-w-[560px] text-sm leading-[1.8] text-muted">链接不存在、已过期或已被创建者撤销。</p><Link href="/" className="btn btn-primary">返回首页</Link></div></main>;
}

function readSharedPlan(token: string): SharedPlanView | null {
  const share = getShareToken(token);
  if (!share || share.revoked_at || (share.expires_at && new Date(share.expires_at) < new Date())) return null;
  const row = getPlanRow(share.plan_id);
  const plan = row && row.current_version > 0 ? getPlanVersion(share.plan_id, row.current_version) : undefined;
  return plan ? toSharedView(plan, new Date().toISOString()) : null;
}

function formatDate(iso: string): string { const [, month, day] = iso.split("-"); return `${Number(month)} / ${Number(day)}`; }
function formatDateTime(iso: string): string { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)); }
