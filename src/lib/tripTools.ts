import type { CostRange, DayEditDraft, DayPlan } from "./types";

export type DayRisk = "good" | "buffer" | "risk";

/** 根据已核验的天气、驾驶时长和风险文案给出保守的出发判断。 */
export function getDayRisk(day: DayPlan): DayRisk {
  const weather = `${day.weather?.dayWeather ?? ""}${day.weather?.nightWeather ?? ""}`;
  const riskText = day.risks.join(" ");
  const driveMinutes = day.legs.reduce((sum, leg) => sum + (leg.durationMinutes ?? 0), 0);
  if (/暴雨|暴雪|大雪|冰雹|道路封闭|严重/.test(`${weather}${riskText}`) || driveMinutes > 480) return "risk";
  if (/雨|雪|阴|高海拔|注意|谨慎|长途|盘山/.test(`${weather}${riskText}`) || driveMinutes > 360) return "buffer";
  return "good";
}

/** 以示意单价估算油费和过路费；没有里程时返回待核验的空区间。 */
export function estimateDayCosts(day: DayPlan, partySize: number): { fuel: CostRange; toll: CostRange; total: CostRange } {
  const distanceKm = day.legs.reduce((sum, leg) => sum + (leg.distanceKm ?? 0), 0);
  if (!distanceKm) {
    const pending: CostRange = { min: 0, max: 0, status: "needs_check" };
    return { fuel: pending, toll: pending, total: pending };
  }
  const fuelMin = Math.round((distanceKm / 100) * 7.2 * 8.1 * Math.max(1, partySize / 2) / 10) * 10;
  const fuelMax = Math.round((distanceKm / 100) * 10 * 8.8 * Math.max(1, partySize / 2) / 10) * 10;
  const tollMin = Math.round(distanceKm * 0.35 / 10) * 10;
  const tollMax = Math.round(distanceKm * 0.65 / 10) * 10;
  return {
    fuel: { min: fuelMin, max: fuelMax, status: "estimated" },
    toll: { min: tollMin, max: tollMax, status: "estimated" },
    total: { min: fuelMin + tollMin, max: fuelMax + tollMax, status: "estimated" },
  };
}

/** 将天气、驾驶、摄影和住宿信息整理为当天出发前的短清单。 */
export function getPreparationItems(day: DayPlan): string[] {
  const items = new Set<string>();
  const weather = `${day.weather?.dayWeather ?? ""}${day.weather?.nightWeather ?? ""}`;
  if (/雨/.test(weather)) items.add("带雨具并预留路况缓冲");
  if (/雪|低温/.test(weather)) items.add("准备防滑装备和保暖衣物");
  const driveMinutes = day.legs.reduce((sum, leg) => sum + (leg.durationMinutes ?? 0), 0);
  if (driveMinutes > 360) items.add("出发前补给饮水，途中安排休息");
  if (day.photoTips[0]?.bestTime) items.add(`摄影机位按 ${day.photoTips[0].bestTime} 到达`);
  if (day.stayAdvice) items.add(`确认${day.end.name}住宿与停车`);
  if (day.risks[0]) items.add(day.risks[0]);
  return [...items].slice(0, 4);
}

export function createDayEditDraft(day: DayPlan): DayEditDraft {
  const driveMinutes = day.legs.reduce((sum, leg) => sum + (leg.durationMinutes ?? 0), 0);
  return {
    dayIndex: day.dayIndex,
    departureTime: day.schedule.find((item) => item.time && item.time !== "待定")?.time ?? "08:00",
    maxDriveHours: Math.max(1, Math.min(12, Math.round(driveMinutes / 60) || 6)),
    stayCity: day.end.name,
    stops: day.schedule.map((item, index) => ({ id: `${day.dayIndex}-${index}`, name: item.title, note: item.description })),
  };
}
