import fs from "node:fs";

const styles = fs.readFileSync("src/app/globals.css", "utf8");
for (const marker of [
  ".plan-theme .route-story .route-phase-legend",
  ".plan-theme .route-story .route-story-map > p",
  ".plan-theme .editorial-recommendations .text-soft",
  ".plan-theme .travel-editorial-hero__meta span",
  ".plan-theme .btn {",
  ".plan-theme .btn.btn-primary {",
]) {
  if (!styles.includes(marker)) throw new Error(`缺少字体可读性规则：${marker}`);
}

console.log("Readability smoke passed");
