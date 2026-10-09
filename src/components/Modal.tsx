"use client";

import { useEffect, useRef } from "react";

export type ModalConfig = {
  title: string;
  description: string;
  suggestions: { label: string; onSelect: () => void }[];
};

/** 通用弹窗：Esc 关闭、点击遮罩关闭、打开时焦点移入（方案 §4 可及性要求） */
export default function Modal({
  config,
  open,
  onClose,
}: {
  config: ModalConfig;
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-5"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[520px] rounded-[20px] border border-[#56634f] bg-[#202721] p-6 shadow-[0_25px_90px_#0009]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="serif m-0 text-[26px] font-medium">
            {config.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="cursor-pointer border-0 bg-transparent text-2xl text-muted hover:text-ink"
            aria-label="关闭对话框"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="m-0 text-[13px] leading-[1.8] text-muted">{config.description}</p>
        <div className="mt-5 grid gap-2.5">
          {config.suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              className="cursor-pointer rounded-[10px] border border-line bg-[#151a16] px-4 py-3.5 text-left text-ink hover:border-gold"
              onClick={s.onSelect}
            >
              {s.label} <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
