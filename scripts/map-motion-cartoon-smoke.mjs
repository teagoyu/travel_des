import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const appSource = await readFile(new URL("../src/lib/mapMotion.ts", import.meta.url), "utf8");
const runtimeSource = await readFile(path.join(os.homedir(), ".claude/skills/map-motion/scripts/runtime/mm.js"), "utf8");

for (const style of ["cartoon-childhood", "cartoon-detective", "cartoon-fantasy"]) {
  if (!runtimeSource.includes(`'${style}'`)) throw new Error(`map-motion 运行时没有 ${style} 样式`);
}
if (!appSource.includes("theme: selectedTheme")) throw new Error("路线动画没有保留当前主题信息");
if (!appSource.includes('theme: TravelTheme = "childhood"')) throw new Error("路线动画没有默认主题回退");
if (!appSource.includes('mode: "driving"')) throw new Error("路线动画没有明确使用自驾模式");
if (!appSource.includes('vehicle: "car"')) throw new Error("路线动画没有明确使用卡通车辆");
if (!appSource.includes('days: true')) throw new Error("路线动画没有显示每日标记");
if (!appSource.includes('overview: false')) throw new Error("路线动画没有按分段放大展示");
if (!appSource.includes('themeCopy[selectedTheme]')) throw new Error("路线动画没有根据网站主题生成文案");
if (!appSource.includes('text: themeCopy[selectedTheme].route')) throw new Error("路线动画缺少旅程信息卡");
if (!appSource.includes('text: themeCopy[selectedTheme].ending')) throw new Error("路线动画缺少主题化结尾卡");
if (!appSource.includes('sub: `${plan.days.length} 天 · ${stops.length} 个落脚点`')) throw new Error("路线动画缺少落脚点数量信息");
if (!appSource.includes('"--gif-width", "960"')) throw new Error("路线 GIF 输出宽度过低");
if (!appSource.includes("themeStyle[selectedTheme]")) throw new Error("路线动画没有按主题切换卡通背景");
for (const style of ["cartoon-childhood", "cartoon-detective", "cartoon-fantasy"]) {
  if (!appSource.includes(`\"${style}\"`)) throw new Error(`路线动画缺少 ${style} 主题映射`);
}

console.log("Map motion cartoon smoke passed");
