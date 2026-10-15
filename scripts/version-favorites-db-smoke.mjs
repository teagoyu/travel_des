import { readFile } from "node:fs/promises";

const types = await readFile(new URL("../src/lib/types.ts", import.meta.url), "utf8");
const db = await readFile(new URL("../src/lib/db.ts", import.meta.url), "utf8");
for (const marker of ["PlanVersionMeta", "PlanVersionDiff", "SavedRecommendation"]) {
  if (!types.includes(marker)) throw new Error(`缺少数据类型：${marker}`);
}
for (const marker of ["plan_version_meta", "saved_recommendations", "listPlanVersions", "listSavedRecommendations", "saveRecommendation", "removeSavedRecommendation"]) {
  if (!db.includes(marker)) throw new Error(`缺少数据层能力：${marker}`);
}
console.log("Version favorites DB smoke passed");
