import fs from "node:fs";

const source = fs.readFileSync("src/app/api/plans/[id]/animation/route.ts", "utf8");
for (const marker of ["findLatestMapMotionJob(id, sessionId)", "force?: boolean", "existingJob.status", "force !== true"]) {
  if (!source.includes(marker)) throw new Error(`动画接口缺少任务去重逻辑：${marker}`);
}

console.log("Animation route smoke passed");
