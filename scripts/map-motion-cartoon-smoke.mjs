import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const appSource = await readFile(new URL("../src/lib/mapMotion.ts", import.meta.url), "utf8");
const runtimeSource = await readFile(path.join(os.homedir(), ".claude/skills/map-motion/scripts/runtime/mm.js"), "utf8");

for (const style of ["cartoon-childhood", "cartoon-detective", "cartoon-fantasy"]) {
  if (!runtimeSource.includes(`'${style}'`)) throw new Error(`map-motion 运行时没有 ${style} 样式`);
}
if (!appSource.includes("cartoon-${selectedTheme}")) throw new Error("路线动画没有根据主题选择卡通样式");
if (!appSource.includes('theme: TravelTheme = "childhood"')) throw new Error("路线动画没有默认主题回退");

console.log("Map motion cartoon smoke passed");
