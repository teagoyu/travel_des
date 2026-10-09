import { NextResponse } from "next/server";
import { z } from "zod";
import { zodFieldErrors } from "./schemas";

/** 统一 JSON 错误响应 */
export function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

/** 校验请求体；失败时返回 422 与字段级错误 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, "BAD_JSON", "请求体不是合法 JSON") };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: jsonError(422, "VALIDATION_FAILED", "输入校验失败", {
        fields: zodFieldErrors(result.error),
      }),
    };
  }
  return { ok: true, data: result.data };
}
