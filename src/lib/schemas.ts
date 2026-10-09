/**
 * 运行时 Schema（zod）——与 types.ts 的编译期类型保持一致。
 * 用途：API 入参校验、（阶段 C）AI 结构化输出校验、存储层写入校验。
 */

import { z } from "zod";

export const FactStatusSchema = z.enum(["verified", "estimated", "needs_check"]);

export const SourceRefSchema = z.object({
  provider: z.string().min(1),
  fetchedAt: z.string().min(1),
  sourceUrl: z.string().optional(),
  status: FactStatusSchema,
});

export const PlaceSchema = z.object({
  name: z.string().min(1),
  cityCode: z.string().optional(),
  poiId: z.string().optional(),
  lng: z.number(),
  lat: z.number(),
});

export const TripRequestSchema = z.object({
  origin: z.string().trim().min(1, "请填写出发地").max(60),
  destination: z.string().trim().min(1, "请填写想去的地方").max(60),
  returnTrip: z.boolean().default(true),
  departDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式应为 YYYY-MM-DD")
    .refine((s) => !Number.isNaN(new Date(`${s}T00:00:00`).getTime()), "日期无效"),
  days: z.number().int().min(2, "天数需在 2–14 天之间").max(14, "天数需在 2–14 天之间"),
  partySize: z.number().int().min(1, "同行人数需在 1–8 人之间").max(8, "同行人数需在 1–8 人之间"),
  budgetCny: z
    .object({ min: z.number().nonnegative(), max: z.number().nonnegative() })
    .refine((v) => v.max >= v.min, "预算上限不能低于下限")
    .optional(),
  pace: z.enum(["relaxed", "balanced", "full"]),
  accommodation: z.enum(["hotel", "camping", "flexible"]),
  interests: z.array(z.string().min(1).max(20)).max(10).default([]),
  dailyDriveLimitHours: z.number().min(1).max(12).optional(),
  notes: z.string().max(500).optional(),
});

export const RouteLegSchema = z.object({
  from: PlaceSchema,
  to: PlaceSchema,
  distanceKm: z.number().nonnegative().optional(),
  durationMinutes: z.number().nonnegative().optional(),
  geometry: z.array(z.tuple([z.number(), z.number()])).optional(),
  source: SourceRefSchema,
});

export const DayPlanSchema = z.object({
  dayIndex: z.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  summary: z.string(),
  start: PlaceSchema,
  end: PlaceSchema,
  legs: z.array(RouteLegSchema),
  schedule: z.array(
    z.object({
      time: z.string().optional(),
      title: z.string().min(1),
      description: z.string(),
      place: PlaceSchema.optional(),
    }),
  ),
  photoTips: z.array(
    z.object({
      title: z.string().min(1),
      bestTime: z.string().optional(),
      description: z.string().optional(),
      place: PlaceSchema.optional(),
      source: SourceRefSchema.optional(),
    }),
  ),
  stayAdvice: z.string(),
  risks: z.array(z.string()),
  alternative: z.string().optional(),
  budgetCny: z.object({ min: z.number().nonnegative(), max: z.number().nonnegative() }).optional(),
});

export const TripPlanSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  status: z.enum(["ready", "partial", "failed"]),
  title: z.string().min(1),
  request: TripRequestSchema,
  days: z.array(DayPlanSchema).min(1),
  totalDistanceKm: z.number().nonnegative().optional(),
  totalBudgetCny: z.object({ min: z.number().nonnegative(), max: z.number().nonnegative() }).optional(),
  checklist: z.array(z.object({ id: z.string(), label: z.string(), checked: z.boolean() })),
  factsUpdatedAt: z.string(),
  createdAt: z.string(),
});

export const JobStateSchema = z.enum(["queued", "planning", "verifying", "writing", "complete", "failed"]);
export const PlanErrorCodeSchema = z.enum(["PLACE_AMBIGUOUS", "ROUTE_UNAVAILABLE", "PROVIDER_TIMEOUT"]);

/** POST /api/plans 请求体 */
export const CreatePlanBodySchema = TripRequestSchema;

/** POST /api/plans/:id/revisions 请求体 */
export const RevisionBodySchema = z.object({
  baseVersion: z.number().int().min(1),
  dayIndex: z.number().int().min(1),
  instruction: z.string().trim().min(1, "请描述修改意图").max(200),
});

/** POST /api/plans/:id/share 请求体 */
export const ShareBodySchema = z.object({
  expiresAt: z.string().optional(),
});

/** PATCH /api/plans/:id/checklist/:itemId 请求体 */
export const ChecklistPatchBodySchema = z.object({
  checked: z.boolean(),
});

/** 把 zod 错误压成 { 字段: 文案 }，供表单直接显示 */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
