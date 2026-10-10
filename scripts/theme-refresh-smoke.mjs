import fs from "node:fs";

const pageSource = fs.readFileSync("src/app/plans/[id]/page.tsx", "utf8");
const planSource = fs.readFileSync("src/components/PlanView.tsx", "utf8");
for (const [source, markers] of [
  [pageSource, ["searchParams", "getTravelTheme", "initialTheme"]],
  [planSource, ["initialTheme", "useState<TravelTheme>(initialTheme)"]],
]) {
  for (const marker of markers) {
    if (!source.includes(marker)) throw new Error(`主题刷新缺少 ${marker}`);
  }
}

console.log("Theme refresh smoke passed");
