"use client";

import { useEffect, useState } from "react";

/** 轻提示：自动消失，role=status 供屏幕阅读器播报 */
export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setMessage(detail);
      const timer = setTimeout(() => setMessage(null), 3600);
      return () => clearTimeout(timer);
    };
    window.addEventListener("roadbook:toast", handler);
    return () => window.removeEventListener("roadbook:toast", handler);
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-30 max-w-[calc(100vw-30px)] -translate-x-1/2 rounded-full bg-[#e7c780] px-4.5 py-3 text-center text-xs text-[#222217] shadow-[0_12px_40px_#0008]"
    >
      {message}
    </div>
  );
}

/** 组件外触发 toast 的辅助函数 */
export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent("roadbook:toast", { detail: message }));
}
