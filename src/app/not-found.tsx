import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "山海之间 · 页面不存在",
};

/** 空状态：未知路书 id / 无效分享链接 */
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="eyebrow m-0">404</p>
        <h1 className="serif m-0 mt-3 mb-3 text-[clamp(30px,5vw,52px)] font-medium">
          没有找到这条路书
        </h1>
        <p className="m-0 mb-8 text-sm leading-[1.8] text-muted">
          链接可能已过期、被撤销，或路书不属于当前会话。
          <br />
          阶段 A 仅提供示例路书；保存与分享能力将在后续阶段接入。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            创建新路书
          </Link>
          <Link href="/plans/sample-chuanxi-2026" className="btn">
            查看示例路书
          </Link>
        </div>
      </div>
    </main>
  );
}
