import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/plans/[id]/saved-recommendations/route.ts", import.meta.url), "utf8").catch(() => "");
const removeRoute = await readFile(new URL("../src/app/api/plans/[id]/saved-recommendations/[recommendationId]/route.ts", import.meta.url), "utf8").catch(() => "");
const recommendations = await readFile(new URL("../src/components/Recommendations.tsx", import.meta.url), "utf8");
const rail = await readFile(new URL("../src/components/RecommendationRail.tsx", import.meta.url), "utf8");
if (!route.includes("export async function GET") || !route.includes("export async function POST") || !removeRoute.includes("export async function DELETE")) throw new Error("收藏推荐 API 不完整");
for (const marker of ["加入当天", "已加入当天", "移除收藏"]) {
  if (!recommendations.includes(marker) && !rail.includes(marker)) throw new Error(`推荐收藏 UI 缺少：${marker}`);
}
console.log("Saved recommendations smoke passed");
