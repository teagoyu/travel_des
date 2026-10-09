/**
 * 公开字段投影（方案 §6：分享视图必须从允许公开的字段投影生成）。
 * 私人备注、内部错误、编辑令牌一律不进入分享视图。
 */

import type { TripPlan } from "./types";

export type SharedPlanView = {
  id: string;
  title: string;
  days: {
    dayIndex: number;
    date: string;
    title: string;
    summary: string;
    start: string;
    end: string;
    schedule: { time?: string; title: string; description: string }[];
    photoTips: { title: string; bestTime?: string; description?: string }[];
    stayAdvice: string;
    risks: string[];
  }[];
  totalDistanceKm?: number;
  factsUpdatedAt: string;
  sharedAt: string;
};

export function toSharedView(plan: TripPlan, sharedAt: string): SharedPlanView {
  return {
    id: plan.id,
    title: plan.title,
    days: plan.days.map((d) => ({
      dayIndex: d.dayIndex,
      date: d.date,
      title: d.title,
      summary: d.summary,
      start: d.start.name,
      end: d.end.name,
      schedule: d.schedule.map((s) => ({ time: s.time, title: s.title, description: s.description })),
      photoTips: d.photoTips.map((p) => ({ title: p.title, bestTime: p.bestTime, description: p.description })),
      stayAdvice: d.stayAdvice,
      risks: d.risks,
    })),
    totalDistanceKm: plan.totalDistanceKm,
    factsUpdatedAt: plan.factsUpdatedAt,
    sharedAt,
  };
}
