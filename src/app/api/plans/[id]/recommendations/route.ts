import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, getPlanVersion } from "@/lib/db";
import { searchRecommendations } from "@/lib/amap";
import { jsonError } from "@/lib/api";
import type { Recommendation } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const row = getPlanRow(id);
    if (!row) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
    if (row.session_id !== await getSessionId()) return jsonError(403, "PLAN_FORBIDDEN", "无权查看该路书");
    const plan = getPlanVersion(id, row.current_version);
    if (!plan) return jsonError(404, "PLAN_NOT_FOUND", "路书不存在");
    const url = new URL(request.url);
    const day = Math.max(1, Number(url.searchParams.get("day") ?? 1));
    const type = url.searchParams.get("type") === "restaurant" ? "餐厅" : "景点";
    const target = plan.days[day - 1];
    if (!target) return jsonError(400, "DAY_NOT_FOUND", "行程日期不存在");
    let items: Recommendation[] = [];
    try {
      items = await searchRecommendations(target.end.name, type, target.end);
    } catch {
      // 推荐服务属于增强信息；上游异常时保留空推荐，不影响路书主体。
      items = [];
    }
    return NextResponse.json({ day, type, city: target.end.name, items });
  } catch {
    // 兼容外部服务或历史数据异常：推荐区降级为空，不让整页进入错误态。
    return NextResponse.json({ day: 1, type: "景点", city: "", items: [] as Recommendation[] });
  }
}
