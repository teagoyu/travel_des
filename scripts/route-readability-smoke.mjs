import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/RouteOverview.tsx", import.meta.url), "utf8");
const daySource = await readFile(new URL("../src/components/DayDetail.tsx", import.meta.url), "utf8");

for (const marker of ["buildRouteLabelLayout", "labelLayout", "labelBoxWidth", "textLength"]) {
  if (!source.includes(marker)) throw new Error(`Route label collision guard missing: ${marker}`);
}

if (!daySource.includes("formatDuration(minutes)")) {
  throw new Error("Driving duration should use hour/minute formatting");
}

console.log("Route readability smoke passed");
