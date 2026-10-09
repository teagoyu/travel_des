import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getMapMotionOutputCandidates, loadMapMotionJob } from "@/lib/mapMotion";
import { jsonError } from "@/lib/api";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const sessionId = await getSessionId();
  const { jobId } = await params;
  const job = await loadMapMotionJob(jobId);
  if (!job) return jsonError(404, "ANIMATION_NOT_FOUND", "动画任务不存在");
  if (job.sessionId !== sessionId) return jsonError(403, "ANIMATION_FORBIDDEN", "无权查看该动画");

  const format = new URL(request.url).searchParams.get("format");
  if (format === "mp4" || format === "gif") {
    if (job.status !== "complete") return jsonError(409, "ANIMATION_NOT_READY", "动画尚未生成完成");
    try {
      let bytes: Uint8Array | undefined;
      for (const filePath of getMapMotionOutputCandidates(job, format)) {
        try {
          bytes = await readFile(filePath);
          break;
        } catch {
          // Try the next persisted/legacy location.
        }
      }
      if (!bytes) throw new Error("animation artifact not found");
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "Content-Type": format === "mp4" ? "video/mp4" : "image/gif",
          "Cache-Control": "private, max-age=3600",
          "Content-Disposition": `inline; filename="${jobId}.${format}"`,
        },
      });
    } catch (error) {
      console.error("[map-motion] artifact read failed", {
        jobId,
        format,
        candidates: getMapMotionOutputCandidates(job, format),
        error: error instanceof Error ? error.message : String(error),
      });
      return jsonError(404, "ANIMATION_FILE_NOT_FOUND", "动画文件不存在");
    }
  }

  return NextResponse.json({ ...job, jobId: job.id });
}
