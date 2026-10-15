import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/PlanView.tsx", import.meta.url), "utf8");
for (const marker of ["submitDayEdit", "DayEditDraft", "/revisions", "baseVersion", "dayIndex", "departureTime", "maxDriveHours", "stayCity"]) {
  if (!source.includes(marker)) throw new Error(`AI 编辑提交缺少：${marker}`);
}
if (!source.includes("readOnly")) throw new Error("编辑提交缺少只读保护");
console.log("Day edit submit smoke passed");
