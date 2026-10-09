import { NextResponse } from "next/server";
import { searchSceneryPhoto } from "@/lib/amap";

const sceneryCache = new Map<string, { name: string; imageUrl: string }>();

export async function GET(request: Request) {
  const cities = [...new Set(new URL(request.url).searchParams.get("cities")?.split(",").map((city) => city.trim()).filter(Boolean) ?? [])].slice(0, 10);
  if (!cities.length) return NextResponse.json({ items: {} });
  const pairs = await Promise.all(cities.map(async (city) => {
    const cached = sceneryCache.get(city);
    if (cached) return [city, cached] as const;
    try {
      const item = await searchSceneryPhoto(city);
      if (item) sceneryCache.set(city, item);
      return [city, item] as const;
    } catch {
      return [city, null] as const;
    }
  }));
  return NextResponse.json({ items: Object.fromEntries(pairs.filter(([, item]) => item)) });
}
