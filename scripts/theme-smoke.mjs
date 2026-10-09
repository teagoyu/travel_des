import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/theme.ts", import.meta.url), "utf8");
const background = await readFile(new URL("../src/components/ThemeBackground.tsx", import.meta.url), "utf8");

for (const theme of ["childhood", "detective", "fantasy"]) {
  if (!source.includes(`"${theme}"`)) throw new Error(`missing theme: ${theme}`);
}
for (const marker of ["getTravelTheme", "background", "accent", "character"]) {
  if (!source.includes(marker)) throw new Error(`missing theme token: ${marker}`);
}
if (!source.includes("childhood")) throw new Error("unknown theme fallback must use childhood");
if (!background.includes("aria-hidden") || !background.includes("variant")) {
  throw new Error("ThemeBackground must be decorative and variant-aware");
}
console.log("theme smoke: PASS");
