import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/tripTools.ts", import.meta.url), "utf8").catch(() => "");
const types = await readFile(new URL("../src/lib/types.ts", import.meta.url), "utf8");

for (const marker of ["getDayRisk", "estimateDayCosts", "getPreparationItems"]) {
  if (!source.includes(marker)) throw new Error(`缺少出行工具函数：${marker}`);
}
if (!types.includes("DayEditDraft")) throw new Error("缺少 DayEditDraft 类型");
if (!source.includes("estimated") && !source.includes("待核验")) throw new Error("出行工具必须标记估算或待核验状态");
console.log("Trip tools smoke passed");
