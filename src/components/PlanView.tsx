"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import TripHero from "@/components/TripHero";
import RouteOverview from "@/components/RouteOverview";
import DayDetail from "@/components/DayDetail";
import BudgetPanel from "@/components/BudgetPanel";
import Checklist from "@/components/Checklist";
import TripSummary from "@/components/TripSummary";
import DataSources from "@/components/DataSources";
import RecommendationRail from "@/components/RecommendationRail";
import ShareCard from "@/components/ShareCard";
import ThemeBackground from "@/components/ThemeBackground";
import Modal, { type ModalConfig } from "@/components/Modal";
import { showToast } from "@/components/Toast";
import { getTravelTheme, getTravelThemeTokens, type TravelTheme } from "@/lib/theme";
import type { TripPlan } from "@/lib/types";

/** 路书详情交互区：日期导航 + 每日详情 + 调整弹窗（阶段 B：修改意图走 revisions API） */
export default function PlanView({ plan, readOnly = false }: { plan: TripPlan; readOnly?: boolean }) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(0);
  const [modal, setModal] = useState<ModalConfig | null>(null);
  const [revisionBusy, setRevisionBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [shareImageName, setShareImageName] = useState("旅行路线.png");
  const [animationJob, setAnimationJob] = useState<{ jobId: string; status: string; progress?: number; mp4Url?: string; gifUrl?: string; error?: string } | null>(null);
  const [theme, setTheme] = useState<TravelTheme>("childhood");
  const shareTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = getTravelTheme(params.get("theme"));
    setTheme(initial);
    document.body.dataset.travelTheme = initial;
    return () => { delete document.body.dataset.travelTheme; };
  }, []);

  const generateShareImage = async () => {
    if (!shareTargetRef.current || shareBusy) return;
    setShareBusy(true);
    try {
      const dataUrl = await toPng(shareTargetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#101612",
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `山海之间-${plan.request.origin}-${plan.request.destination}.png`, { type: "image/png" });
      setShareImageUrl(dataUrl);
      setShareImageName(file.name);
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: plan.title, text: "我的旅行路线", files: [file] });
        showToast("分享图片已生成");
      } else {
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
        showToast("截图已生成并下载");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      showToast(`截图生成失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally {
      setShareBusy(false);
    }
  };

  const shareCopy = `我的旅行路书｜${plan.title}\n${plan.request.origin} → ${plan.request.destination}\n${plan.request.days}天${Math.max(plan.request.days - 1, 0)}晚 · ${plan.request.interests.slice(0, 3).join(" / ") || "自驾旅行"}\n\n${plan.days.slice(0, 5).map((day) => `DAY ${String(day.dayIndex).padStart(2, "0")} · ${day.title}`).join("\n")}\n\n在「山海之间」生成你的完整路线`;

  const copyShareCopy = async () => {
    try { await navigator.clipboard.writeText(shareCopy); showToast("分享文案已复制"); }
    catch { showToast("复制失败，请稍后重试"); }
  };

  const generateSocialPoster = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const posterTheme = getTravelThemeTokens(theme);
      const rows = plan.days.slice(0, 6).map((day, index) => {
        const y = 242 + index * 82;
        return `<text x="42" y="${y}" class="kicker">DAY ${String(day.dayIndex).padStart(2, "0")}</text><text x="42" y="${y + 29}" class="route">${escapeXml(day.title)}</text><text x="42" y="${y + 52}" class="summary">${escapeXml(day.summary.slice(0, 46))}</text><line x1="42" y1="${y + 68}" x2="372" y2="${y + 68}" class="line"/>`;
      }).join("");
      const posterHeight = 780;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="414" height="${posterHeight}" viewBox="0 0 414 ${posterHeight}"><rect width="414" height="${posterHeight}" fill="${posterTheme.background}"/><path d="M0 150H414M0 730H414" stroke="${posterTheme.secondary}" opacity=".2"/><circle cx="365" cy="56" r="30" fill="${posterTheme.accent}" opacity=".2"/><text x="42" y="48" class="brand">TRAVEL JOURNAL · ${posterTheme.shortLabel}</text><text x="42" y="105" class="title">${escapeXml(plan.title)}</text><text x="42" y="137" class="meta">${escapeXml(plan.request.origin)} → ${escapeXml(plan.request.destination)} · ${plan.request.days}天${Math.max(plan.request.days - 1, 0)}晚</text><line x1="42" y1="176" x2="372" y2="176" class="line"/>${rows}<text x="42" y="758" class="footer">山海之间 · 自驾路书</text><style>.brand,.kicker{font:700 11px Arial;letter-spacing:3px;fill:${posterTheme.accent}}.title{fill:${posterTheme.ink};font:28px Georgia,serif}.meta,.summary,.footer{fill:${posterTheme.muted};font:13px Arial}.route{fill:${posterTheme.ink};font:21px Georgia,serif}.line{stroke:${posterTheme.secondary};stroke-width:1;opacity:.28}</style></svg>`;
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const file = new File([blob], `山海之间-${plan.request.destination}-小红书长图.svg`, { type: "image/svg+xml" });
      setShareImageUrl(dataUrl); setShareImageName(file.name);
      showToast("小红书长图已生成，请在预览中下载");
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) showToast(`长图生成失败：${error instanceof Error ? error.message : "请稍后重试"}`);
    } finally { setShareBusy(false); }
  };

  const refreshFacts = async () => {
    if (readOnly) { showToast("示例路书仅供浏览，请创建自己的路书后使用此功能"); return; }
    if (refreshBusy) return;
    setRefreshBusy(true);
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(plan.id)}/refresh`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { version: number };
      showToast(`已重新核验路线与地点，生成 v${data.version}`);
      router.refresh();
    } catch (error) {
      showToast(`核验失败：${error instanceof Error ? error.message : "网络错误"}`);
    } finally {
      setRefreshBusy(false);
    }
  };

  const generateRouteAnimation = async () => {
    if (readOnly || animationJob?.status === "queued" || animationJob?.status === "rendering") return;
    setAnimationJob({ jobId: "pending", status: "queued", progress: 0 });
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(plan.id)}/animation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme }) });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? `HTTP ${res.status}`);
      const data = (await res.json()) as { jobId: string; status: string };
      setAnimationJob(data);
    } catch (error) {
      setAnimationJob({ jobId: "error", status: "failed", error: error instanceof Error ? error.message : "生成失败" });
    }
  };

  useEffect(() => {
    const jobId = animationJob?.jobId;
    const status = animationJob?.status;
    if (!jobId || status === "complete" || status === "failed" || jobId === "pending") return;
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/plan-animations/${encodeURIComponent(jobId)}`, { cache: "no-store" });
      if (!res.ok) return;
      const next = await res.json() as typeof animationJob;
      setAnimationJob(next);
      if (next.status === "complete" || next.status === "failed") window.clearInterval(timer);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [animationJob?.jobId, animationJob?.status]);

  useEffect(() => {
    if (readOnly || animationJob) return;
    void fetch(`/api/plans/${encodeURIComponent(plan.id)}/animation`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const job = await res.json() as { jobId?: string; status: string; progress?: number; mp4Url?: string; gifUrl?: string; error?: string };
        if (job?.jobId) setAnimationJob({ ...job, jobId: job.jobId });
      })
      .catch(() => undefined);
  }, [animationJob, plan.id, readOnly]);

  const submitRevision = async (instruction: string, targetDay = selectedDay) => {
    if (readOnly) { showToast("示例路书仅供浏览，请创建自己的路书后调整行程"); return; }
    if (revisionBusy) return;
    setRevisionBusy(true);
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(plan.id)}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseVersion: plan.version, dayIndex: targetDay + 1, instruction }),
      });
      if (res.status === 409) {
        setModal(null);
        showToast("路书已有更新版本，正在刷新…");
        router.refresh();
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { version: number; changes: string[] };
      setModal(null);
      showToast(`已生成 v${data.version}：${data.changes.join("；")}`);
      router.refresh();
    } catch (error) {
      showToast(`修改失败：${error instanceof Error ? error.message : "网络错误"}`);
    } finally {
      setRevisionBusy(false);
    }
  };

  const openEditModal = () => {
    setModal({
      title: `调整第 ${selectedDay + 1} 天`,
      description:
        "选择一种调整意图，系统会生成新版本并显示变更摘要；可随时对比或回退（阶段 E 提供版本对比视图）。",
      suggestions: ["返程增加百色住宿", "今天少开一点", "把日落拍摄留久一些", "增加轻徒步", "改成下雨备选方案"].map(
        (label) => ({
          label,
          onSelect: () => submitRevision(label),
        }),
      ),
    });
  };

  const openPlanBModal = (targetDay = selectedDay) => {
    setModal({
      title: `第 ${targetDay + 1} 天 Plan B`,
      description: "根据当天的天气、路线风险和驾驶强度生成备用安排，不会删除原来的主路线。",
      suggestions: ["生成雨天备选方案", "减少户外活动和驾驶", "保留核心景点，缩短路线"].map((label) => ({
        label,
        onSelect: () => submitRevision(`生成 Plan B：${label}`, targetDay),
      })),
    });
  };

  return (
    <div className={`plan-theme plan-theme--${theme}`}>
      <ThemeBackground theme={theme} variant="roadbook" />
      <div className="relative z-[1]">
      <TripHero plan={plan} theme={theme} />
        <div className="shell">
        <div className="my-4 flex items-center justify-between gap-4 rounded-xl border border-[#6e5933] bg-[#2d291d] px-4 py-3 text-xs leading-[1.6] text-[#f2d7a2] max-sm:items-start max-sm:flex-col">
          <span>这是一份交互设计原型。日期、路线、里程、天气、日出日落、价格和机位均为演示内容，不能直接作为导航或预订依据。</span>
          <div className="flex shrink-0 gap-2 max-sm:w-full max-sm:flex-col">
            <button type="button" className="btn btn-small" onClick={refreshFacts} disabled={refreshBusy} title={readOnly ? "示例路书仅供浏览" : undefined}>
              {readOnly ? "示例路书 · 仅浏览" : refreshBusy ? "正在核验…" : "重新核验高德数据"}
            </button>
            <button type="button" className="btn btn-small" onClick={generateShareImage} disabled={shareBusy}>
              {shareBusy ? "正在生成…" : "生成分享截图"}
            </button>
            <button type="button" className="btn btn-small" onClick={generateSocialPoster} disabled={shareBusy}>小红书长图</button>
            <button type="button" className="btn btn-small" data-testid="map-motion-generate" onClick={generateRouteAnimation} disabled={readOnly || animationJob?.status === "queued" || animationJob?.status === "rendering"}>
              {animationJob?.status === "rendering" ? `路线动画 ${animationJob.progress ?? 0}%` : "生成路线动画"}
            </button>
            <button type="button" className="btn btn-small" onClick={copyShareCopy}>复制分享文案</button>
          </div>
        </div>
      </div>

      <div className={`roadbook-surface roadbook-surface--${theme} relative overflow-hidden bg-[linear-gradient(180deg,#101612f2_0%,#111713fa_38%,#0e1210_100%),url('/hero-mountain-road.png')] bg-cover bg-fixed bg-center`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#8c9b8e_1px,transparent_1px),linear-gradient(90deg,#8c9b8e_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="shell relative z-[1] grid grid-cols-[minmax(0,1fr)_308px] gap-[58px] pt-[60px] pb-[100px] max-lg:grid-cols-1 max-lg:gap-7 max-lg:pt-8">
        <div ref={shareTargetRef} className="min-w-0">
          <div className="theme-route-badge mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-sm">
            <span className="size-2 rounded-full" style={{ background: getTravelThemeTokens(theme).accent }} />
            {getTravelThemeTokens(theme).label} · 原创卡通手账主题
          </div>
          <div className="roadbook-overview">
            <RouteOverview plan={plan} />
          </div>

            <section id="daily" aria-labelledby="daily-title" className="daily-reading relative">
            <div className="daily-reading-heading">
              <div>
                <div className="section-kicker">DAY BY DAY · 每日行程</div>
                <h2 id="daily-title" className="serif m-0 text-[34px] font-medium max-sm:text-[29px]">
                  每日行程
                </h2>
                <p className="daily-reading-subtitle">按日期顺序查看路线、停留与当天安排</p>
              </div>
              <a className="daily-reading-jump" href="#daily">
                <span className="daily-reading-jump-dot" aria-hidden="true" />
                共 {plan.days.length} 天 · 点击日期查看
              </a>
            </div>
            <div className="day-chapter-nav" aria-label="每日行程导航">
              {plan.days.map((day, index) => (
                <button
                  key={`${day.date}-nav`}
                  type="button"
                  className={`day-chapter-link ${selectedDay === index ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedDay(index);
                    document.getElementById(`day-detail-${day.dayIndex}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span>DAY {String(day.dayIndex).padStart(2, "0")}</span>
                  <strong>{day.end.name}</strong>
                </button>
              ))}
            </div>
            <div className="daily-chapters mt-8">
              {plan.days[selectedDay] && (
                <div key={`${plan.days[selectedDay].date}-${plan.days[selectedDay].dayIndex}`} className="daily-chapter">
                  <DayDetail
                    day={plan.days[selectedDay]}
                    dayNumber={selectedDay + 1}
                    planId={readOnly ? undefined : plan.id}
                    readOnly={readOnly}
                    onEdit={openEditModal}
                    onPlanB={() => openPlanBModal(selectedDay)}
                    theme={theme}
                  />
                </div>
              )}
            </div>
            </section>
          </div>

        <aside className="min-w-0">
          <div className="editorial-rail grid gap-6 md:sticky md:top-6 max-md:grid-cols-1 max-lg:grid-cols-2 max-lg:gap-7">
            <RecommendationRail days={plan.days} day={plan.days[selectedDay] ?? plan.days[0]} planId={readOnly ? undefined : plan.id} readOnly={readOnly} />
            <TripSummary plan={plan} />
            <BudgetPanel plan={plan} />
            <Checklist planId={plan.id} items={plan.checklist} readOnly={readOnly} />
          </div>
        </aside>
        </div>
      </div>

      <div className="shell pb-16">
        <div className="mt-14 border-t border-line pt-7">
        <ShareCard planId={plan.id} readOnly={readOnly} />
        </div>
        <DataSources plan={plan} />
        <footer className="mt-14 border-t border-line pt-7 text-xs leading-[1.8] text-soft">
          山海之间 · 旅行规划产品原型。所有示意信息均需在正式产品中接入可信数据源并注明更新时间。主视觉为本原型原创生成素材。
        </footer>
      </div>

      {modal && <Modal config={modal} open onClose={() => setModal(null)} />}
      {shareImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="分享截图预览">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-line bg-[#172019] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-gold">SHARE IMAGE</div>
                <h3 className="serif m-0 mt-1 text-xl">路线截图已生成</h3>
              </div>
              <button type="button" className="btn btn-small" onClick={() => setShareImageUrl(null)}>关闭</button>
            </div>
            <div className="max-h-[72vh] overflow-auto rounded-xl border border-line bg-[#101612] p-2">
              <img src={shareImageUrl} alt="旅行路线分享截图预览" className="h-auto w-full" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
              <span className="text-xs text-soft">图片已生成，点击下载即可保存到本地。</span>
              <a className="btn btn-small text-center" href={shareImageUrl} download={shareImageName}>下载图片</a>
            </div>
          </div>
        </div>
      )}
      {animationJob?.status === "complete" && animationJob.mp4Url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050806]/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="路线动画预览">
          <div className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-[#172019] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold tracking-[0.2em] text-gold">ROUTE MOTION</div><h3 className="serif m-0 mt-1 text-xl">路线动画已生成</h3></div><button type="button" className="btn btn-small" onClick={() => setAnimationJob(null)}>关闭</button></div>
            {animationJob.gifUrl ? <img className="max-h-[70vh] w-full rounded-xl border border-line bg-black object-contain" src={animationJob.gifUrl} alt="路线动画 GIF 预览" /> : <video className="max-h-[70vh] w-full rounded-xl border border-line bg-black" src={animationJob.mp4Url} controls playsInline />}
            <div className="mt-2 text-xs text-soft">GIF 可直接预览，MP4 适合保存和分享。</div>
            <div className="mt-3 flex gap-2"><a className="btn btn-small flex-1 text-center" href={animationJob.mp4Url} download>下载 MP4</a>{animationJob.gifUrl && <a className="btn btn-small flex-1 text-center" href={animationJob.gifUrl} download>下载 GIF</a>}</div>
          </div>
        </div>
      )}
      {animationJob?.status === "failed" && <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-[#8b603a] bg-[#2d291d] px-4 py-3 text-xs text-[#f2d7a2]">路线动画生成失败：{animationJob.error ?? "请稍后重试"}</div>}
      </div>
    </div>
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character] ?? character));
}
