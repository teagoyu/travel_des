import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getPlanRow, listSavedRecommendations, saveRecommendation } from "@/lib/db";
import { jsonError, parseBody } from "@/lib/api";
import { SavedRecommendationBodySchema } from "@/lib/schemas";

async function ownedPlan(id: string) {
  const row = getPlanRow(id);
  if (!row) return { error: jsonError(404, "PLAN_NOT_FOUND", "路书不存在") } as const;
  if (row.session_id !== await getSessionId()) return { error: jsonError(403, "PLAN_FORBIDDEN", "无权修改该路书") } as const;
  return { row } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownedPlan(id);
  if (owned.error) return owned.error;
  const day = new URL(request.url).searchParams.get("day");
  const dayIndex = day ? Number(day) : undefined;
  if (day !== null && (!Number.isInteger(dayIndex) || (dayIndex ?? 0) < 1)) return jsonError(400, "DAY_NOT_FOUND", "行程日期不存在");
  return NextResponse.json({ items: listSavedRecommendations(id, dayIndex) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await ownedPlan(id);
  if (owned.error) return owned.error;
  const parsed = await parseBody(request, SavedRecommendationBodySchema);
  if (!parsed.ok) return parsed.response;
  const item = saveRecommendation({ planId: id, ...parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}
