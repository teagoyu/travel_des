/**
 * 山海之间 · 核心数据契约
 * 来源：IMPLEMENTATION_PLAN.md §6（阶段 A 采用固定 Fixture 驱动，类型保持与正式版一致）。
 *
 * 约束：
 * - `SourceRef.status = 'estimated'` 的内容不得显示为实时事实；
 * - 路线距离由地图模块回填，不允许模型直接写入 `verified` 字段；
 * - 原型中的里程、费用、时间等均为示意数据，只允许出现在 fixture 中。
 *
 * 与方案 §6 的差异：`DayPlan.photoTips[].description` 为展示文案扩展字段（可选），
 * 其余类型保持一致。
 */

export type FactStatus = "verified" | "estimated" | "needs_check";

export type SourceRef = {
  provider: string; // 例如 amap / weather-provider / editorial
  fetchedAt: string; // ISO 8601
  sourceUrl?: string;
  status: FactStatus;
};

export type Place = {
  name: string;
  cityCode?: string;
  poiId?: string;
  address?: string;
  type?: string;
  lng?: number;
  lat?: number;
  navigationUrl?: string;
};

export type Recommendation = {
  id?: string;
  name: string;
  address?: string;
  type?: string;
  rating?: string;
  price?: string;
  imageUrl?: string;
  bookingUrl?: string;
  navigationUrl?: string;
  source: SourceRef;
};

export type TripRequest = {
  origin: string;
  destination: string;
  returnTrip?: boolean;
  departDate: string; // YYYY-MM-DD
  days: number; // MVP: 2–14
  partySize: number; // MVP: 1–8
  budgetCny?: { min: number; max: number }; // 整趟所有人的预算区间
  pace: "relaxed" | "balanced" | "full";
  accommodation: "hotel" | "camping" | "flexible";
  interests: string[];
  dailyDriveLimitHours?: number;
  notes?: string;
};

export type RouteLeg = {
  from: Place;
  to: Place;
  distanceKm?: number;
  durationMinutes?: number;
  geometry?: [number, number][];
  source: SourceRef;
};

export type DayPlan = {
  dayIndex: number; // 从 1 开始
  date: string;
  title: string;
  summary: string;
  start: Place;
  end: Place;
  legs: RouteLeg[];
  schedule: { time?: string; title: string; description: string; place?: Place }[];
  photoTips: { title: string; bestTime?: string; description?: string; place?: Place; source?: SourceRef }[];
  stayAdvice: string;
  risks: string[];
  alternative?: string;
  imageTheme?: "city-day" | "city-night" | "snow-mountain" | "lake-sunset" | "old-town" | "highway-return" | "forest-road";
  weather?: {
    date: string;
    dayWeather?: string;
    nightWeather?: string;
    dayTemp?: string;
    nightTemp?: string;
    dayWind?: string;
    nightWind?: string;
    source: SourceRef;
  };
  hotels?: {
    name: string;
    address?: string;
    price?: string;
    rate?: string;
    star?: string;
    imageUrl?: string;
    bookingUrl?: string;
    source: SourceRef;
  }[];
  recommendations?: {
    attractions?: Recommendation[];
    restaurants?: Recommendation[];
  };
  budgetCny?: { min: number; max: number };
};

export type TripPlan = {
  id: string;
  version: number;
  status: "ready" | "partial" | "failed";
  title: string;
  request: TripRequest;
  days: DayPlan[];
  totalDistanceKm?: number;
  totalBudgetCny?: { min: number; max: number };
  checklist: { id: string; label: string; checked: boolean }[];
  factsUpdatedAt: string;
  createdAt: string;
};

/** 生成任务状态流：queued → planning → verifying → writing → complete，失败为 failed */
export type JobState =
  | "queued"
  | "planning"
  | "verifying"
  | "writing"
  | "complete"
  | "failed";

export type PlanErrorCode =
  | "PLACE_AMBIGUOUS"
  | "ROUTE_UNAVAILABLE"
  | "PROVIDER_TIMEOUT";

/** 生成任务的只读视图（阶段 B 起由 GET /api/jobs/:jobId 返回） */
export type GenerationJob = {
  jobId: string;
  state: JobState;
  progress: number; // 0–100
  planId?: string;
  errorCode?: PlanErrorCode;
};

/** 状态徽标文案：数值必须带状态（方案 §4） */
export const FACT_STATUS_LABEL: Record<FactStatus, string> = {
  verified: "已核验",
  estimated: "估算",
  needs_check: "待核验",
};

export const JOB_STATE_LABEL: Record<JobState, string> = {
  queued: "排队中",
  planning: "规划路线骨架",
  verifying: "校验路线与事实",
  writing: "撰写路书",
  complete: "生成完成",
  failed: "生成失败",
};
