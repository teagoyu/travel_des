import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../src/components/TravelPlannerHero.tsx", import.meta.url), "utf8");
const heroContent = await readFile(new URL("../src/components/HomeHero.tsx", import.meta.url), "utf8");
const picker = await readFile(new URL("../src/components/TravelThemePicker.tsx", import.meta.url), "utf8");
const form = await readFile(new URL("../src/components/CreateTripForm.tsx", import.meta.url), "utf8");

for (const marker of ["我的旅行地图", "开始规划旅程"]) {
  if (!page.includes(marker) && !hero.includes(marker) && !heroContent.includes(marker)) throw new Error(`missing homepage marker: ${marker}`);
}
if (!hero.includes("ThemeBackground") || !hero.includes("TravelThemePicker")) throw new Error("homepage must mount theme controls");
if (!picker.includes("童趣冒险") && !picker.includes("TRAVEL_THEME_TOKENS")) throw new Error("theme picker options missing");
if (!form.includes("beijingDateOffset(7)") || !form.includes("days: 5")) throw new Error("planner defaults regressed");
console.log("home page smoke: PASS");
