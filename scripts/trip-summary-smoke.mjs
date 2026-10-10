import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/TripSummary.tsx", import.meta.url), "utf8");

if (!source.includes('formatDuration')) throw new Error("TripSummary should use the shared duration formatter");
if (source.includes("maxHours.toFixed(1)")) throw new Error("TripSummary still renders decimal hours");

console.log("Trip summary smoke passed");
