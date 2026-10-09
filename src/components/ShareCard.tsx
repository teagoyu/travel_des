"use client";

import { useState } from "react";
import { showToast } from "./Toast";

type ShareLink = { url: string; token: string };

/**
 * 分享区块（阶段 B）：POST /api/plans/:id/share 创建只读链接，
 * DELETE 撤销；复制链接体验完整交互。
 */
export default function ShareCard({ planId, readOnly = false }: { planId: string; readOnly?: boolean }) {
  const [link, setLink] = useState<ShareLink | null>(null);
  const [busy, setBusy] = useState(false);

  const createLink = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/plans/${encodeURIComponent(planId)}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ShareLink;
      setLink(data);
      showToast("只读链接已创建");
    } catch (error) {
      showToast(`创建失败：${error instanceof Error ? error.message : "网络错误"}`);
    } finally {
      setBusy(false);
    }
  };

  const revokeLink = async () => {
    if (!link || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/plans/${encodeURIComponent(planId)}/share/${encodeURIComponent(link.token)}`,
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      setLink(null);
      showToast("链接已撤销，访问将立即失效");
    } catch (error) {
      showToast(`撤销失败：${error instanceof Error ? error.message : "网络错误"}`);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      showToast("链接已复制");
    } catch {
      showToast("浏览器未开放剪贴板权限；请手动复制输入框中的链接");
    }
  };

  return (
    <section id="share" aria-labelledby="share-title" className="border-t border-line pt-7">
      <div className="section-kicker">SHARE</div>
      <h2 id="share-title" className="serif m-0 mb-3 text-2xl font-medium">
        分享这份路书
      </h2>
      <p className="mt-0 mb-4 max-w-[680px] text-[13px] leading-[1.8] text-muted">
        只读链接仅公开行程内容，不含编辑权限与私人备注；可随时撤销，撤销后立即失效。
      </p>
      {!link ? (
        <button type="button" className="btn btn-small" onClick={createLink} disabled={busy || readOnly} title={readOnly ? "示例路书不支持创建分享链接" : undefined}>
          {readOnly ? "示例路书不可创建链接" : <>创建只读链接 <span aria-hidden="true">↗</span></>}
        </button>
      ) : (
        <div className="max-w-[680px]">
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={link.url}
              aria-label="只读分享链接"
              onFocus={(e) => e.target.select()}
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-line bg-[#121713] px-3 text-xs text-ink"
            />
            <button type="button" className="btn btn-small" onClick={copyLink}>
              复制
            </button>
            <button type="button" className="btn btn-small" onClick={revokeLink} disabled={busy}>
              撤销链接
            </button>
          </div>
          <p className="mt-2 text-[11px] text-soft">
            打开链接的访客只能阅读路书内容（/s/{link.token.slice(0, 8)}…）。
          </p>
        </div>
      )}
    </section>
  );
}
