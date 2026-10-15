import { readFile } from "node:fs/promises";

const files = [
  "../src/app/api/plans/[id]/versions/route.ts",
  "../src/app/api/plans/[id]/versions/compare/route.ts",
  "../src/app/api/plans/[id]/versions/rollback/route.ts",
];
const sources = await Promise.all(files.map((file) => readFile(new URL(file, import.meta.url), "utf8").catch(() => "")));
if (sources.some((source) => !source)) throw new Error("版本 API 路由不完整");
const joined = sources.join("\n");
for (const marker of ["baseVersion", "targetVersion", "VERSION_CONFLICT", "VERSION_NOT_FOUND", "setCurrentVersion", "version + 1"]) {
  if (!joined.includes(marker)) throw new Error(`版本 API 缺少：${marker}`);
}
console.log("Version API smoke passed");
