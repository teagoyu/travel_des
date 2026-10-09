"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { showToast } from "./Toast";
import {
  ACCOMMODATION_OPTIONS,
  beijingDateOffset,
  BUDGET_OPTIONS,
  INTEREST_OPTIONS,
  PACE_OPTIONS,
  toTripRequest,
  validateTripForm,
  type FormValues,
} from "@/lib/tripForm";

const DEFAULT_VALUES: FormValues = {
  origin: "成都",
  destination: "川西 · 稻城亚丁",
  returnTrip: true,
  departDate: beijingDateOffset(7),
  days: 5,
  partySize: 2,
  budgetIndex: 1,
  pace: "balanced",
  accommodation: "hotel",
  interests: ["雪山", "日落", "摄影"],
};

type FieldName = keyof FormValues;

/** 校验错误字段 → 实际 DOM 元素 id（用于失败时聚焦） */
const FIELD_ELEMENT_ID: Record<FieldName, string> = {
  origin: "from",
  destination: "to",
  departDate: "date",
  days: "days",
  partySize: "people",
  budgetIndex: "budget",
  pace: "pace",
  accommodation: "stay",
  interests: "from",
  returnTrip: "returnTrip",
};

type PlaceTip = { name?: string; district?: string; address?: string; location?: string; adcode?: string };

function PlacePicker({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (value: string) => void; error?: string }) {
  const [tips, setTips] = useState<PlaceTip[]>([]);
  const [hasTyped, setHasTyped] = useState(false);
  useEffect(() => {
    if (!hasTyped || value.trim().length < 2) { setTips([]); return; }
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/amap/places?q=${encodeURIComponent(value.trim())}`);
      if (!response.ok) return;
      const data = (await response.json()) as { tips?: PlaceTip[] };
      setTips(data.tips ?? []);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [hasTyped, value]);
  return (
    <div className="relative field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => { setHasTyped(true); onChange(e.target.value); }} aria-invalid={error ? "true" : undefined} autoComplete="off" />
      {tips.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-[#202922] shadow-2xl">
          {tips.map((tip, index) => (
            <button key={`${tip.name}-${index}`} type="button" className="block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-[#2b382e]" onClick={() => { onChange(tip.name ?? ""); setHasTyped(false); setTips([]); }}>
              <span className="block text-sm text-ink">{tip.name}</span>
              <span className="block text-[11px] text-soft">{tip.district || tip.address || "高德地点"}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/** 创建路书表单（方案 §3：输入简单，明确预算是总预算还是人均） */
export default function CreateTripForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends FieldName>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleInterest = (interest: string) => {
    setValues((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateTripForm(values);
    setErrors(nextErrors);
    const firstErrorKey = Object.keys(nextErrors)[0] as FieldName | undefined;
    if (firstErrorKey) {
      // React 批处理下 DOM 尚未更新 aria-invalid，直接按字段 id 聚焦
      const focusTarget = FIELD_ELEMENT_ID[firstErrorKey];
      document.getElementById(focusTarget)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const request = toTripRequest(values);
      // 阶段 B：POST /api/plans 创建生成任务，凭 jobId 进入生成页（刷新可恢复）。
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const fields = body?.error?.fields as Record<string, string> | undefined;
        if (fields) {
          const mapped: Partial<Record<FieldName, string>> = {};
          if (fields.origin) mapped.origin = fields.origin;
          if (fields.destination) mapped.destination = fields.destination;
          if (fields.departDate) mapped.departDate = fields.departDate;
          if (fields.days) mapped.days = fields.days;
          if (fields.partySize) mapped.partySize = fields.partySize;
          setErrors(mapped);
          setSubmitting(false);
          return;
        }
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      const { jobId } = (await res.json()) as { jobId: string };
      router.push(`/plans/new?job=${encodeURIComponent(jobId)}`);
    } catch (error) {
      setSubmitting(false);
      showToast(`创建任务失败：${error instanceof Error ? error.message : "网络错误"}`);
    }
  };

  return (
    <div className="rounded-[22px] border border-white/[0.14] bg-[#1b211eee] p-8 shadow-[0_25px_70px_#0007] backdrop-blur-xl max-sm:p-5">
      <div className="mb-6 flex items-center justify-between gap-4 max-sm:block">
        <h2 className="serif m-0 text-[29px] font-medium max-sm:mb-1.5 max-sm:text-2xl">
          下一站，从这里开始
        </h2>
        <p className="m-0 text-xs text-soft">原型演示 · 生成结果为川西示例</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-3">
          <PlacePicker id="from" label="从哪里出发" value={values.origin} onChange={(value) => setField("origin", value)} error={errors.origin} />
          <PlacePicker id="to" label="想去哪里" value={values.destination} onChange={(value) => setField("destination", value)} error={errors.destination} />
          <div className="field">
            <label htmlFor="date">出发日期</label>
            <input
              id="date"
              type="date"
              value={values.departDate}
              onChange={(e) => setField("departDate", e.target.value)}
              aria-invalid={errors.departDate ? "true" : undefined}
              aria-describedby={errors.departDate ? "date-error" : undefined}
            />
            {errors.departDate && (
              <p id="date-error" className="field-error" role="alert">
                {errors.departDate}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="days">旅行天数</label>
            <select
              id="days"
              value={values.days}
              onChange={(e) => setField("days", Number(e.target.value))}
            >
              {[5, 7, 10, 14].map((d) => (
                <option key={d} value={d}>
                  {d} 天
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="returnTrip">路线类型</label>
            <select id="returnTrip" value={values.returnTrip ? "round-trip" : "one-way"} onChange={(e) => setField("returnTrip", e.target.value === "round-trip")}>
              <option value="round-trip">往返路线</option>
              <option value="one-way">单程路线</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="people">同行人数</label>
            <select
              id="people"
              value={values.partySize}
              onChange={(e) => setField("partySize", Number(e.target.value))}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n === 4 ? "4 人及以上" : `${n} 人`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pace">旅行节奏</label>
            <select
              id="pace"
              value={values.pace}
              onChange={(e) =>
                setField("pace", e.target.value as FormValues["pace"])
              }
            >
              {PACE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="stay">住宿偏好</label>
            <select
              id="stay"
              value={values.accommodation}
              onChange={(e) =>
                setField(
                  "accommodation",
                  e.target.value as FormValues["accommodation"],
                )
              }
            >
              {ACCOMMODATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="budget">两人总预算</label>
            <select
              id="budget"
              value={values.budgetIndex}
              onChange={(e) => setField("budgetIndex", Number(e.target.value))}
            >
              {BUDGET_OPTIONS.map((o, i) => (
                <option key={o.label} value={i}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-5 border-t border-line pt-5 max-sm:block">
          <div>
            <p className="mb-2.5 text-xs text-soft">这趟旅行，你最想遇见什么？</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = values.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`chip ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary max-sm:mt-5 max-sm:w-full"
            disabled={submitting}
          >
            {submitting ? "正在进入生成流程…" : "生成路书预览"}{" "}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </div>
  );
}
