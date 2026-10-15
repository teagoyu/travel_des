import { readFile } from "node:fs/promises";

const daily = await readFile(new URL("../src/components/DayTravelTools.tsx", import.meta.url), "utf8").catch(() => "");
const summary = await readFile(new URL("../src/components/TripHealthSummary.tsx", import.meta.url), "utf8").catch(() => "");
for (const marker of ["出发判断", "费用估算", "准备事项", "估算"]) {
  if (!daily.includes(marker)) throw new Error(`每日工具缺少：${marker}`);
}
for (const marker of ["预算", "清单完成度", "最长驾驶日", "天气风险日", "data-day-index"]) {
  if (!summary.includes(marker)) throw new Error(`全程概览缺少：${marker}`);
}
console.log("Trip tools UI smoke passed");
