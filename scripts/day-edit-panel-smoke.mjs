import { readFile } from "node:fs/promises";

const panel = await readFile(new URL("../src/components/DayEditPanel.tsx", import.meta.url), "utf8").catch(() => "");
const detail = await readFile(new URL("../src/components/DayDetail.tsx", import.meta.url), "utf8");
for (const marker of ["出发时间", "驾驶上限", "住宿城市", "上移", "下移", "删除", "添加停留点", "让 AI 重排这一天"]) {
  if (!panel.includes(marker)) throw new Error(`编辑面板缺少：${marker}`);
}
if (!detail.includes("DayEditPanel")) throw new Error("DayDetail 尚未接入 DayEditPanel");
if (!detail.includes("readOnly")) throw new Error("DayDetail 尚未向编辑面板传递只读状态");
console.log("Day edit panel smoke passed");
