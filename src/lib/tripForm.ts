import type { TripRequest } from "./types";

/** 返回北京时间（Asia/Shanghai）当前日期向后偏移指定天数的 YYYY-MM-DD。 */
export function beijingDateOffset(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
  return date.toISOString().slice(0, 10);
}

export const CITY_OPTIONS = [
  "成都", "重庆", "西安", "昆明", "贵阳", "长沙", "张家界", "丽江", "大理", "拉萨", "康定", "稻城亚丁", "川西 · 稻城亚丁", "香格里拉", "三亚", "厦门", "杭州", "上海", "北京",
] as const;

/** 表单里预算档位 → TripRequest.budgetCny（明确是"两人总预算"） */
export const BUDGET_OPTIONS = [
  { label: "¥3,000–5,000", min: 3000, max: 5000 },
  { label: "¥5,000–8,000", min: 5000, max: 8000 },
  { label: "¥8,000–12,000", min: 8000, max: 12000 },
  { label: "不限预算", min: 0, max: 0 },
] as const;

export const PACE_OPTIONS = [
  { value: "relaxed", label: "轻松 · 少开车" },
  { value: "balanced", label: "平衡 · 看风景" },
  { value: "full", label: "紧凑 · 多走一些" },
] as const;

export const ACCOMMODATION_OPTIONS = [
  { value: "hotel", label: "酒店 / 民宿" },
  { value: "camping", label: "露营 / 车宿" },
  { value: "flexible", label: "灵活安排" },
] as const;

export const INTEREST_OPTIONS = [
  "雪山",
  "日落",
  "摄影",
  "轻徒步",
  "小众路线",
] as const;

export type FormValues = {
  origin: string;
  destination: string;
  returnTrip: boolean;
  departDate: string;
  days: number;
  partySize: number;
  budgetIndex: number;
  pace: TripRequest["pace"];
  accommodation: TripRequest["accommodation"];
  interests: string[];
};

/** 表单校验：返回每个字段的错误文案；空对象表示通过 */
export function validateTripForm(
  values: FormValues,
): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  const trimmedOrigin = values.origin.trim();
  const trimmedDestination = values.destination.trim();

  if (!trimmedOrigin) errors.origin = "请填写出发地";
  if (!trimmedDestination) errors.destination = "请填写想去的地方";
  if (trimmedOrigin && trimmedDestination && trimmedOrigin === trimmedDestination) {
    errors.destination = "出发地和目的地不能相同";
  }
  if (!values.departDate) {
    errors.departDate = "请选择出发日期";
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${values.departDate}T00:00:00`) < today) {
      errors.departDate = "出发日期不能早于今天";
    }
  }
  if (values.days < 2 || values.days > 14) errors.days = "天数需在 2–14 天之间";
  if (values.partySize < 1 || values.partySize > 8) {
    errors.partySize = "同行人数需在 1–8 人之间";
  }
  return errors;
}

/** 表单值 → TripRequest（阶段 B 将 POST 给 /api/plans） */
export function toTripRequest(values: FormValues): TripRequest {
  const budget = BUDGET_OPTIONS[values.budgetIndex];
  return {
    origin: values.origin.trim(),
    destination: values.destination.trim(),
    returnTrip: values.returnTrip,
    departDate: values.departDate,
    days: values.days,
    partySize: values.partySize,
    ...(budget.max > 0 ? { budgetCny: { min: budget.min, max: budget.max } } : {}),
    pace: values.pace,
    accommodation: values.accommodation,
    interests: values.interests,
  };
}

export function formatBudgetRange(range: { min: number; max: number }): string {
  const fmt = (n: number) => n.toLocaleString("zh-CN");
  return `¥${fmt(range.min)}–${fmt(range.max)}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} 分钟`;
  return m === 0 ? `约 ${h} 小时` : `约 ${h} 小时 ${m} 分钟`;
}
