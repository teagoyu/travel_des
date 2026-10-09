import fs from "node:fs";

const source = fs.readFileSync("src/components/TripHero.tsx", "utf8");
const styles = fs.readFileSync("src/app/globals.css", "utf8");

for (const marker of ["travel-editorial-hero__city-name", "travel-editorial-hero__city-state"]) {
  if (!source.includes(marker)) throw new Error(`沿途城市缺少结构化标签：${marker}`);
  if (!styles.includes(`.${marker}`)) throw new Error(`沿途城市缺少可读性样式：${marker}`);
}

if (!source.includes('aria-label="沿途城市路线"')) {
  throw new Error("沿途城市缺少明确的路线 aria-label");
}

console.log("hero cities smoke passed");
