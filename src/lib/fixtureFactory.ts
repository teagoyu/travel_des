/**
 * Fixture 工厂（阶段 B）：按用户的 TripRequest 生成一份**示例**路书。
 *
 * 数据边界：此阶段只生成结构化路书草稿，不伪造地图、费用、天气和景点数据。
 * 阶段 C 接入地图与 AI 后，再把待核验字段替换成真实结果。
 */

import type { DayPlan, TripPlan, TripRequest } from "./types";

const NOW = () => new Date().toISOString();

/** 按请求天数生成日期序列（从 departDate 起连续 N 天） */
export function dates(departDate: string, days: number): string[] {
  const out: string[] = [];
  const [year, month, day] = departDate.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function buildFixturePlan(request: TripRequest, planId: string): TripPlan {
  const days = request.days;
  const dateList = dates(request.departDate, days);
  const destination = request.destination.replace(/^.*·\s*/, "").trim() || request.destination;

  const dayPlans: DayPlan[] = dateList.map((date, i) => {
    const dayIndex = i + 1;
    const isFirstDay = dayIndex === 1;
    const from = isFirstDay ? request.origin : destination;
    const to = isFirstDay ? destination : destination;
    const routeLabel = isFirstDay ? `${from} → ${to}` : `${destination} · 行程待安排`;

    return {
      dayIndex,
      date,
      title: routeLabel,
      summary: isFirstDay
        ? `从${from}前往${to}。路线、落脚点与每日节奏将在接入地图和目的地数据后补全。`
        : `以${destination}为当天落脚地，等待景点、天气与交通数据后生成具体安排。`,
      start: { name: from },
      end: { name: to },
      legs: [],
      schedule: [
        { time: "待定", title: isFirstDay ? `${from} → ${to}` : `${destination} · 当日安排`, description: "接入真实路线与目的地数据后生成。" },
        { time: "待定", title: "天气与开放时间核验", description: "根据出行日期补充天气、营业时间和预约要求。" },
        { time: "待定", title: "住宿与返程确认", description: "根据当天路线和体力安排确认落脚点。" },
      ],
      photoTips: [
        {
          title: "拍摄建议待核验",
          description: "接入天气、日落时间和景点数据后生成。",
        },
      ],
      stayAdvice: `住宿建议待核验：接入路线后给出${destination}及沿途落脚区域。`,
      risks: ["路线待核验：当前没有真实地图数据，不显示虚构里程和驾驶时长。"],
      alternative: "正式版将根据天气、路况和用户偏好生成备选方案。",
    };
  });

  return {
    id: planId,
    version: 1,
    status: "partial",
    title: `${days} 天，从${request.origin}到${destination}。`,
    request,
    days: dayPlans,
    checklist: [
      { id: "check-weather", label: "核对路况与沿途天气", checked: false },
      { id: "check-stay", label: "确认住宿和停车条件", checked: false },
      { id: "check-tires", label: "检查轮胎、刹车和备胎", checked: false },
      { id: "check-maps", label: "下载离线地图", checked: false },
      { id: "check-supplies", label: "准备保暖衣物、饮水与补给", checked: false },
    ],
    factsUpdatedAt: NOW(),
    createdAt: NOW(),
  };
}
