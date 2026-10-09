import { NextResponse } from "next/server";

type InputTip = { name?: string; district?: string; address?: string; location?: string; adcode?: string };
type InputTipsResponse = { status?: string; tips?: InputTip[] };

export async function GET(request: Request) {
  const key = process.env.AMAP_API_KEY;
  const keyword = new URL(request.url).searchParams.get("q")?.trim();
  if (!key || !keyword || keyword.length < 2) return NextResponse.json({ tips: [] });
  const url = new URL("https://restapi.amap.com/v3/assistant/inputtips");
  url.search = new URLSearchParams({ key, keywords: keyword, datatype: "all" }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ tips: [] }, { status: 502 });
  const data = (await response.json()) as InputTipsResponse;
  const tips = data.status === "1" ? (data.tips ?? []).filter((tip) => tip.name && tip.location).slice(0, 8) : [];
  return NextResponse.json({ tips });
}
