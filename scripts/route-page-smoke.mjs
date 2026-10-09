const url = process.argv[2] ?? "http://127.0.0.1:43130/plans/sample-chuanxi-2026#daily";
const html = await (await fetch(url)).text();

const requiredMarkers = [
  "travel-editorial-hero",
  "route-story",
  "route-phase-legend",
  "route-point-label",
  "daily-reading",
  "daily-intensity",
  "day-chapter-nav",
  "editorial-rail-shell",
  "scenery-photo-source",
  "map-motion-generate",
  "theme-background",
  "theme-route-badge",
];

const missing = requiredMarkers.filter((marker) => !html.includes(marker));
if (missing.length) {
  console.error(`Missing redesign markers: ${missing.join(", ")}`);
  process.exit(1);
}

const themeAssets = [...new Set([...html.matchAll(/\/themes\/([a-z-]+)\.png/g)].map((match) => match[1]))];
if (themeAssets.length < 3) {
  console.error(`Expected at least 3 distinct daily scenery themes, found: ${themeAssets.join(", ") || "none"}`);
  process.exit(1);
}

console.log(`Route page smoke passed: ${requiredMarkers.join(", ")}; themes=${themeAssets.join(", ")}`);
