import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const picker = await readFile(new URL("../src/components/TravelThemePicker.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

for (const marker of ["home-steps", "home-step__number", "home-step__title", "home-step__body"]) {
  if (!page.includes(marker)) throw new Error(`首页缺少结构标记：${marker}`);
}
if (!picker.includes("theme-picker__panel")) throw new Error("主题选择器缺少面板容器");
for (const marker of ["home-hero__content", "home-form-shell", "home-steps::before"]) {
  if (!styles.includes(marker)) throw new Error(`首页缺少视觉规则：${marker}`);
}

console.log("Home optimization smoke passed");
