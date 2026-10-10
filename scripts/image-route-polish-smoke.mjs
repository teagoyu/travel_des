import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/components/RouteOverview.tsx", import.meta.url), "utf8");
const rail = await readFile(new URL("../src/components/RecommendationRail.tsx", import.meta.url), "utf8");
const scenery = await readFile(new URL("../src/components/DailySceneryRail.tsx", import.meta.url), "utf8");
const hero = await readFile(new URL("../src/components/TripHero.tsx", import.meta.url), "utf8");

for (const marker of ["buildRouteSegmentPath", "routeReturnLane", "returnPath"]) {
  if (!route.includes(marker)) throw new Error(`Route geometry guard missing: ${marker}`);
}

for (const source of [rail, scenery, hero]) {
  if (!source.includes('from "next/image"')) throw new Error("Theme/image surface should use next/image");
}

if (!rail.includes("onError") || !rail.includes("fallbackImage")) {
  throw new Error("Recommendation images need a fallback path");
}

console.log("Image and route polish smoke passed");
