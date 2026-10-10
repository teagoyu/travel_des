import { readFile } from "node:fs/promises";

const styles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

for (const marker of [
  "background: #8f46ad !important",
  "color: #8f4d41 !important",
  "color: #805d1c !important",
  "color: #4b667d !important",
]) {
  if (!styles.includes(marker)) throw new Error(`缺少可读性增强规则：${marker}`);
}

console.log("Contrast smoke passed");
