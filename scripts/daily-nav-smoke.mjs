import fs from "node:fs";

const source = fs.readFileSync("src/components/PlanView.tsx", "utf8");
const styles = fs.readFileSync("src/app/globals.css", "utf8");

if (!source.includes('aria-label="每日行程导航"')) {
  throw new Error("每日行程导航缺少明确的 aria-label");
}
if (!source.includes("daily-reading-heading")) {
  throw new Error("每日行程标题缺少增强层级的样式钩子");
}
if (!styles.includes(".daily-reading-heading")) {
  throw new Error("每日行程标题增强样式未定义");
}

console.log("daily navigation smoke passed");
