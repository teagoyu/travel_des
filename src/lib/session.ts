/**
 * 匿名会话（方案 §5）：服务端设置不可被 JavaScript 读取的安全会话 Cookie，
 * 计划归属该会话。清除 Cookie 后将失去匿名计划的编辑权（页面已说明）。
 */

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { ensureSession, hashSessionCookie } from "./db";

export const SESSION_COOKIE = "roadbook_sid";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 年

/**
 * 读取（或创建）当前匿名会话。返回的是 Cookie 原值的 sha256（数据库主键）。
 * 在 Server Component / Route Handler 中均可调用；新建会话时设置 Cookie。
 */
export async function getSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) {
    const hash = hashSessionCookie(existing);
    ensureSession(hash);
    return hash;
  }
  const raw = randomBytes(24).toString("base64url");
  const hash = hashSessionCookie(raw);
  ensureSession(hash);
  try {
    store.set({
      name: SESSION_COOKIE,
      value: raw,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  } catch {
    // Server Component 渲染期不允许 set cookie；此时仅返回派生会话，
    // 首个 API 调用（Route Handler）会真正写入 Cookie。
  }
  return hash;
}

/** Route Handler 专用：确保 Cookie 被写入响应 */
export async function requireSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) {
    const hash = hashSessionCookie(existing);
    ensureSession(hash);
    return hash;
  }
  const raw = randomBytes(24).toString("base64url");
  const hash = hashSessionCookie(raw);
  ensureSession(hash);
  store.set({
    name: SESSION_COOKIE,
    value: raw,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return hash;
}
