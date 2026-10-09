export const TRAVEL_THEMES = ["childhood", "detective", "fantasy"] as const;

export type TravelTheme = (typeof TRAVEL_THEMES)[number];
export type ThemeVariant = "home" | "roadbook" | "daily" | "share";

export type TravelThemeTokens = {
  label: string;
  shortLabel: string;
  background: string;
  panel: string;
  accent: string;
  secondary: string;
  ink: string;
  muted: string;
  character: string;
  motif: string;
};

export const TRAVEL_THEME_TOKENS: Record<TravelTheme, TravelThemeTokens> = {
  childhood: {
    label: "童趣冒险",
    shortLabel: "冒险",
    background: "#dff4fb",
    panel: "#fffdf5",
    accent: "#ef6d4f",
    secondary: "#2364aa",
    ink: "#15385d",
    muted: "#65809a",
    character: "小小旅行家",
    motif: "纸胶带、云朵、手绘地图",
  },
  detective: {
    label: "侦探探索",
    shortLabel: "探索",
    background: "#e8edf5",
    panel: "#fbfcff",
    accent: "#d35d4b",
    secondary: "#304d76",
    ink: "#1e2d43",
    muted: "#6f7d91",
    character: "放大镜侦探",
    motif: "线索卡、邮票、虚线轨迹",
  },
  fantasy: {
    label: "幻想旅行",
    shortLabel: "幻想",
    background: "#f5eafa",
    panel: "#fffaff",
    accent: "#a85cc7",
    secondary: "#4e73ba",
    ink: "#332955",
    muted: "#8876a3",
    character: "星光旅伴",
    motif: "星星、月亮、漂浮车票",
  },
};

export function getTravelTheme(value: string | null | undefined): TravelTheme {
  return TRAVEL_THEMES.includes(value as TravelTheme) ? (value as TravelTheme) : "childhood";
}

export function getTravelThemeTokens(theme: TravelTheme): TravelThemeTokens {
  return TRAVEL_THEME_TOKENS[theme] ?? TRAVEL_THEME_TOKENS.childhood;
}
