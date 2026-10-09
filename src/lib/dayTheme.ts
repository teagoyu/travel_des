import type { DayPlan } from "./types";

export type DayImageTheme = NonNullable<DayPlan["imageTheme"]>;

const FALLBACK_THEMES: DayImageTheme[] = [
  "city-day",
  "lake-sunset",
  "snow-mountain",
  "old-town",
  "forest-road",
  "highway-return",
  "city-night",
];

/** AI 未返回 imageTheme 时，按旅程阶段给每一天一个稳定且不同的视觉主题。 */
export function getDayImageTheme(day: Pick<DayPlan, "imageTheme">, dayPosition: number): DayImageTheme {
  return day.imageTheme ?? FALLBACK_THEMES[Math.max(0, dayPosition) % FALLBACK_THEMES.length];
}
