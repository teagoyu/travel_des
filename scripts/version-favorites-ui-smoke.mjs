import { readFile } from "node:fs/promises";

const panel = await readFile(new URL("../src/components/VersionHistoryPanel.tsx", import.meta.url), "utf8").catch(() => "");
const saved = await readFile(new URL("../src/components/SavedRecommendations.tsx", import.meta.url), "utf8").catch(() => "");
const plan = await readFile(new URL("../src/components/PlanView.tsx", import.meta.url), "utf8");
const detail = await readFile(new URL("../src/components/DayDetail.tsx", import.meta.url), "utf8");
for (const marker of ["版本历史", "对比", "回退到此版本", "readOnly"]) {
  if (!panel.includes(marker)) throw new Error(`版本面板缺少：${marker}`);
}
for (const marker of ["我的收藏", "移除收藏", "saved-recommendations"]) {
  if (!saved.includes(marker)) throw new Error(`收藏区缺少：${marker}`);
}
for (const marker of ["VersionHistoryPanel", "SavedRecommendations", "savedRecommendations", "优先保留"]) {
  if (!plan.includes(marker) && !detail.includes(marker)) throw new Error(`页面整合缺少：${marker}`);
}
console.log("Version favorites UI smoke passed");
