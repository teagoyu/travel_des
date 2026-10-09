/**
 * 存储层（阶段 B）：node:sqlite 单文件数据库。
 *
 * 表模型（方案 §5「关系型主表 + 每个版本的结构化 JSON」）：
 *   sessions      匿名会话（cookie id 的 sha256）
 *   plans         路书主表（当前版本指针）
 *   plan_versions 每个版本的完整 TripPlan JSON
 *   jobs          生成任务（queued → planning → verifying → writing → complete/failed）
 *   checklist_items 待办（按 plan 随版本创建，勾选状态独立持久化）
 *   share_tokens  只读分享令牌（可撤销、可过期）
 *
 * 阶段 C+ 若迁移 PostgreSQL，仅替换本文件的 SQL 方言。
 */

import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { TripPlan } from "./types";

// ── 连接管理 ────────────────────────────────────────────────────────────────

declare global {
  var __roadbookDb: DatabaseSync | undefined;
}

function openDb(): DatabaseSync {
  if (globalThis.__roadbookDb) return globalThis.__roadbookDb;
  const dataDir = process.env.ROADBOOK_DATA_DIR ?? path.join(process.cwd(), ".data");
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "roadbook.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  globalThis.__roadbookDb = db;
  return db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,           -- sha256(cookie 值)
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plans (
      id                 TEXT PRIMARY KEY,
      session_id         TEXT NOT NULL REFERENCES sessions(id),
      current_version    INTEGER NOT NULL DEFAULT 1,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plan_versions (
      plan_id       TEXT NOT NULL REFERENCES plans(id),
      version       INTEGER NOT NULL,
      data          TEXT NOT NULL,              -- 完整 TripPlan JSON
      created_at    TEXT NOT NULL,
      PRIMARY KEY (plan_id, version)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      job_id        TEXT PRIMARY KEY,
      plan_id       TEXT NOT NULL REFERENCES plans(id),
      session_id    TEXT NOT NULL REFERENCES sessions(id),
      state         TEXT NOT NULL,              -- queued/planning/verifying/writing/complete/failed
      progress      INTEGER NOT NULL DEFAULT 0,
      error_code    TEXT,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      plan_id       TEXT NOT NULL REFERENCES plans(id),
      item_id       TEXT NOT NULL,
      label         TEXT NOT NULL,
      checked       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (plan_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS share_tokens (
      token         TEXT PRIMARY KEY,
      plan_id       TEXT NOT NULL REFERENCES plans(id),
      created_at    TEXT NOT NULL,
      expires_at    TEXT,
      revoked_at    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_plans_session ON plans(session_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_session ON jobs(session_id);
    CREATE INDEX IF NOT EXISTS idx_share_plan ON share_tokens(plan_id);
  `);
}

const db = openDb();

// ── ID 生成 ─────────────────────────────────────────────────────────────────

export function newId(prefix: string): string {
  return `${prefix}-${randomBytes(8).toString("hex")}`;
}

export function newShareToken(): string {
  return randomBytes(16).toString("base64url");
}

// ── 会话 ────────────────────────────────────────────────────────────────────

export function ensureSession(sessionCookieHash: string): void {
  db.prepare(
    "INSERT OR IGNORE INTO sessions (id, created_at) VALUES (?, ?)",
  ).run(sessionCookieHash, new Date().toISOString());
}

// ── 路书与版本 ──────────────────────────────────────────────────────────────

export function createPlan(sessionId: string, plan: TripPlan): void {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO plans (id, session_id, current_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(plan.id, sessionId, plan.version, now, now);
  insertVersion(plan);
  replaceChecklist(plan.id, plan.checklist);
}

/** 仅创建 plan 主表行（生成任务启动时，版本稍后由 finalize 写入） */
export function createPlanRow(sessionId: string, planId: string, now: string): void {
  db.prepare(
    "INSERT INTO plans (id, session_id, current_version, created_at, updated_at) VALUES (?, ?, 0, ?, ?)",
  ).run(planId, sessionId, now, now);
}

export function insertVersion(plan: TripPlan): void {
  db.prepare(
    "INSERT OR REPLACE INTO plan_versions (plan_id, version, data, created_at) VALUES (?, ?, ?, ?)",
  ).run(plan.id, plan.version, JSON.stringify(plan), new Date().toISOString());
}

export function getPlanRow(
  planId: string,
): { id: string; session_id: string; current_version: number } | undefined {
  return db
    .prepare("SELECT id, session_id, current_version FROM plans WHERE id = ?")
    .get(planId) as { id: string; session_id: string; current_version: number } | undefined;
}

export function getPlanVersion(planId: string, version: number): TripPlan | undefined {
  const row = db
    .prepare("SELECT data FROM plan_versions WHERE plan_id = ? AND version = ?")
    .get(planId, version) as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as TripPlan) : undefined;
}

export function getCurrentPlan(planId: string): TripPlan | undefined {
  const row = getPlanRow(planId);
  return row ? getPlanVersion(planId, row.current_version) : undefined;
}

/** 指针前移到新版本（写路径统一走这里，保证主表与版本表一致） */
export function setCurrentVersion(planId: string, version: number): void {
  db.prepare("UPDATE plans SET current_version = ?, updated_at = ? WHERE id = ?").run(
    version,
    new Date().toISOString(),
    planId,
  );
}

export function listPlanIdsBySession(sessionId: string): string[] {
  const rows = db
    .prepare("SELECT id FROM plans WHERE session_id = ? ORDER BY created_at DESC")
    .all(sessionId) as { id: string }[];
  return rows.map((r) => r.id);
}

// ── 生成任务 ────────────────────────────────────────────────────────────────

export type JobRow = {
  job_id: string;
  plan_id: string;
  session_id: string;
  state: string;
  progress: number;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};

export function insertJob(job: {
  jobId: string;
  planId: string;
  sessionId: string;
  state: string;
  progress: number;
}): void {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO jobs (job_id, plan_id, session_id, state, progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(job.jobId, job.planId, job.sessionId, job.state, job.progress, now, now);
}

export function getJob(jobId: string): JobRow | undefined {
  return db.prepare("SELECT * FROM jobs WHERE job_id = ?").get(jobId) as JobRow | undefined;
}

export function updateJobState(
  jobId: string,
  state: string,
  progress: number,
  errorCode?: string,
): void {
  db.prepare("UPDATE jobs SET state = ?, progress = ?, error_code = ?, updated_at = ? WHERE job_id = ?").run(
    state,
    progress,
    errorCode ?? null,
    new Date().toISOString(),
    jobId,
  );
}

// ── 待办清单 ────────────────────────────────────────────────────────────────

export function replaceChecklist(
  planId: string,
  items: { id: string; label: string; checked: boolean }[],
): void {
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM checklist_items WHERE plan_id = ?").run(planId);
    const insert = db.prepare(
      "INSERT INTO checklist_items (plan_id, item_id, label, checked) VALUES (?, ?, ?, ?)",
    );
    for (const item of items) insert.run(planId, item.id, item.label, item.checked ? 1 : 0);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getChecklist(planId: string): { id: string; label: string; checked: boolean }[] {
  const rows = db
    .prepare("SELECT item_id, label, checked FROM checklist_items WHERE plan_id = ? ORDER BY rowid")
    .all(planId) as { item_id: string; label: string; checked: number }[];
  return rows.map((r) => ({ id: r.item_id, label: r.label, checked: r.checked === 1 }));
}

export function setChecklistChecked(planId: string, itemId: string, checked: boolean): boolean {
  const result = db
    .prepare("UPDATE checklist_items SET checked = ? WHERE plan_id = ? AND item_id = ?")
    .run(checked ? 1 : 0, planId, itemId);
  return Number(result.changes) > 0;
}

// ── 分享令牌 ────────────────────────────────────────────────────────────────

export function createShareToken(
  planId: string,
  expiresAt?: string,
): { token: string; expiresAt?: string } {
  const token = newShareToken();
  db.prepare(
    "INSERT INTO share_tokens (token, plan_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(token, planId, new Date().toISOString(), expiresAt ?? null);
  return expiresAt ? { token, expiresAt } : { token };
}

export function getShareToken(
  token: string,
): { token: string; plan_id: string; expires_at: string | null; revoked_at: string | null } | undefined {
  return db.prepare("SELECT * FROM share_tokens WHERE token = ?").get(token) as
    | { token: string; plan_id: string; expires_at: string | null; revoked_at: string | null }
    | undefined;
}

export function revokeShareToken(planId: string, token: string): boolean {
  const result = db
    .prepare("UPDATE share_tokens SET revoked_at = ? WHERE token = ? AND plan_id = ? AND revoked_at IS NULL")
    .run(new Date().toISOString(), token, planId);
  return Number(result.changes) > 0;
}

export function listShareTokens(planId: string): { token: string; expires_at: string | null; revoked_at: string | null }[] {
  return db
    .prepare("SELECT token, expires_at, revoked_at FROM share_tokens WHERE plan_id = ? ORDER BY created_at DESC")
    .all(planId) as { token: string; expires_at: string | null; revoked_at: string | null }[];
}

// ── 会话 Cookie 哈希 ────────────────────────────────────────────────────────

export function hashSessionCookie(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
