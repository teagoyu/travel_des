"use client";

import { useRouter } from "next/navigation";

export default function TopBar() {
  const router = useRouter();
  const goHome = () => router.push("/");
  const goSample = () => router.push("/plans/sample-chuanxi-2026");
  const goCreate = () => router.push("/#plan-form");

  return (
    <header className="travel-topbar shell flex h-[72px] items-center justify-between gap-6 border-b border-white/20 max-md:h-[62px]">
      <button
        type="button"
        onClick={goHome}
        aria-label="返回首页"
        className="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left"
      >
        <span className="grid size-8 place-items-center rounded-full border border-gold font-cartoon text-lg text-gold">
          山
        </span>
        <span>
          <span className="block text-[15px] font-semibold tracking-[0.17em] max-md:text-[15px]">
            山海之间
          </span>
          <span className="block text-[10px] font-normal tracking-[0.19em] text-soft max-md:hidden">
            THE OPEN ROAD
          </span>
        </span>
      </button>
      <nav className="flex items-center gap-3">
        <button
          type="button"
          onClick={goSample}
          className="cursor-pointer border-0 bg-transparent px-3 py-2 text-muted hover:text-ink max-sm:hidden"
        >
          示例路书
        </button>
        <button type="button" onClick={goCreate} className="btn btn-small">
          开始规划 <span aria-hidden="true">↗</span>
        </button>
      </nav>
    </header>
  );
}
