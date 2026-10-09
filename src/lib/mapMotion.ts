import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { TripPlan } from "./types";
import { getTravelTheme, type TravelTheme } from "./theme";

export type MapMotionJob = {
  id: string;
  planId: string;
  sessionId: string;
  status: "queued" | "rendering" | "complete" | "failed";
  progress: number;
  mp4Url?: string;
  gifUrl?: string;
  /** Absolute artifact paths are persisted so the download route does not
   * reconstruct a different temp directory after a server reload. */
  mp4Path?: string;
  gifPath?: string;
  error?: string;
};

declare global {
  var __mapMotionJobs: Map<string, MapMotionJob> | undefined;
}

const jobs = globalThis.__mapMotionJobs ?? new Map<string, MapMotionJob>();
globalThis.__mapMotionJobs = jobs;

// Keep job state and render artifacts outside the project tree so Next.js dev
// HMR does not reload the page while a long-running animation is produced.
// Artifacts use a stable home-directory location instead of a temp directory;
// this survives route reloads and avoids macOS TMPDIR differences between the
// Next process and the child renderer.
const outputDir = path.join(os.tmpdir(), "shanhai-map-motion");
const artifactDir = path.join(os.homedir(), ".shanhai-roadbook", "map-motion");
const skillRoot = path.join(os.homedir(), ".claude", "skills", "map-motion");

function jobStatePath(id: string): string {
  return path.join(outputDir, `${id}.job.json`);
}

async function persistJob(job: MapMotionJob): Promise<void> {
  await writeFile(jobStatePath(job.id), JSON.stringify(job), "utf8");
}

export function getMapMotionJob(id: string): MapMotionJob | undefined {
  return jobs.get(id);
}

export async function loadMapMotionJob(id: string): Promise<MapMotionJob | undefined> {
  try {
    return JSON.parse(await readFile(jobStatePath(id), "utf8")) as MapMotionJob;
  } catch {
    return getMapMotionJob(id);
  }
}

export async function findLatestMapMotionJob(planId: string, sessionId: string): Promise<MapMotionJob | undefined> {
  try {
    const names = await readdir(outputDir);
    const candidates = await Promise.all(names.filter((name) => name.endsWith(".job.json")).map(async (name) => {
      try {
        const job = JSON.parse(await readFile(path.join(outputDir, name), "utf8")) as MapMotionJob;
        return job.planId === planId && job.sessionId === sessionId ? job : undefined;
      } catch {
        return undefined;
      }
    }));
    return candidates.filter((job): job is MapMotionJob => Boolean(job)).sort((a, b) => b.id.localeCompare(a.id))[0];
  } catch {
    return undefined;
  }
}

export function getMapMotionOutputPath(id: string, format: "mp4" | "gif"): string {
  return path.join(artifactDir, `${id}.${format}`);
}

export function getMapMotionOutputCandidates(
  job: MapMotionJob,
  format: "mp4" | "gif",
): string[] {
  const persistedPath = format === "mp4" ? job.mp4Path : job.gifPath;
  const stablePath = path.join(os.homedir(), ".shanhai-roadbook", "map-motion", `${job.id}.${format}`);
  return [...new Set([
    persistedPath,
    getMapMotionOutputPath(job.id, format),
    path.join(outputDir, `${job.id}.${format}`),
    stablePath,
  ].filter((candidate): candidate is string => Boolean(candidate)))];
}

export async function createMapMotionJob(plan: TripPlan, sessionId: string, theme: TravelTheme = "childhood"): Promise<MapMotionJob> {
  if (!process.env.AMAP_API_KEY) throw new Error("未配置高德 Web 服务 Key");
  await mkdir(outputDir, { recursive: true });
  await mkdir(artifactDir, { recursive: true });

  const id = `animation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const specPath = path.join(outputDir, `${id}.json`);
  const mp4Path = getMapMotionOutputPath(id, "mp4");
  const gifPath = getMapMotionOutputPath(id, "gif");
  const selectedTheme = getTravelTheme(theme);
  const spec = {
    size: "portrait",
    style: `cartoon-${selectedTheme}`,
    shots: [
      { type: "title", text: `${plan.request.origin}到${plan.request.destination}`, sub: `${plan.request.days} 天 · 自驾路线`, dur: 2 },
      {
        type: "trip",
        stops: plan.days.reduce<string[]>((stops, day) => {
          if (!stops.includes(day.start.name)) stops.push(day.start.name);
          if (!stops.includes(day.end.name)) stops.push(day.end.name);
          return stops;
        }, []),
        stamp: true,
        return: Boolean(plan.request.returnTrip),
        dates: Object.fromEntries(plan.days.map((day) => [day.end.name, day.date.slice(5).replace("-", ".")])),
      },
      { type: "overview", dur: 2.5, title: { text: "山海之间 · 自驾路书", pos: "bottom" } },
    ],
  };
  await writeFile(specPath, JSON.stringify(spec, null, 2), "utf8");

  const job: MapMotionJob = {
    id,
    planId: plan.id,
    sessionId,
    status: "queued",
    progress: 0,
    mp4Path,
    gifPath,
  };
  jobs.set(id, job);
  await persistJob(job);
  const script = path.join(skillRoot, "scripts", "make.sh");
  const child = spawn(script, [specPath, mp4Path, "--gif", gifPath], {
    cwd: skillRoot,
    env: { ...process.env, AMAP_KEY: process.env.AMAP_API_KEY },
    stdio: ["ignore", "pipe", "pipe"],
  });
  job.status = "rendering";
  void persistJob(job);
  child.stdout.on("data", (chunk: Buffer) => {
    const match = chunk.toString().match(/(\d+)\/(\d+) 帧/);
    if (match) {
      job.progress = Math.min(99, Math.round((Number(match[1]) / Number(match[2])) * 100));
      void persistJob(job);
    }
  });
  let errorOutput = "";
  child.stderr.on("data", (chunk: Buffer) => { errorOutput += chunk.toString(); });
  child.on("error", (error) => { job.status = "failed"; job.error = error.message; void persistJob(job); });
  child.on("close", (code) => {
    if (code === 0) {
      job.status = "complete";
      job.progress = 100;
      job.mp4Url = `/api/plan-animations/${id}/file?format=mp4`;
      job.gifUrl = `/api/plan-animations/${id}/file?format=gif`;
      void persistJob(job);
    } else {
      job.status = "failed";
      job.error = errorOutput.trim().split("\n").slice(-1)[0] || `渲染进程退出（${code ?? "未知"}）`;
      void persistJob(job);
    }
  });
  return job;
}
