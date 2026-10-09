import type { DayPlan, Place, Recommendation, RouteLeg, TripPlan } from "./types";
import { enrichPlanWithDeepSeek } from "./deepseek";
import { searchHotels } from "./flyai";
import { formatDuration } from "./tripForm";

const AMAP_ENDPOINT = "https://restapi.amap.com/v3";
type AmapGeocodeResponse = { status: string; geocodes?: Array<{ location?: string; adcode?: string }> };
type AmapDrivingResponse = { status: string; route?: { paths?: Array<{ distance?: string; duration?: string; steps?: Array<{ polyline?: string }> }> } };
type AmapWeatherResponse = { status: string; forecasts?: Array<{ casts?: Array<{ date?: string; dayweather?: string; nightweather?: string; daytemp?: string; nighttemp?: string; daywind?: string; nightwind?: string }> }> };
type QWeatherResponse = { code: string; daily?: Array<{ fxDate?: string; textDay?: string; textNight?: string; tempMax?: string; tempMin?: string; windDirDay?: string; windScaleDay?: string }> };
type AmapPoiResponse = { status: string; pois?: Array<{ id?: string; name?: string; address?: string; type?: string; location?: string; cityname?: string; adname?: string; photos?: Array<{ title?: string; url?: string }>; biz_ext?: { rating?: string; cost?: string } }> };

const attractionImages = [
  "/themes/lake-sunset.png",
  "/themes/old-town.png",
  "/themes/snow-mountain.png",
  "/themes/forest-road.png",
];

function recommendationImage(category: "景点" | "餐厅", index: number): string | undefined {
  if (category === "餐厅") return "/themes/city-night.png";
  return attractionImages[index % attractionImages.length];
}

function apiKey() { return process.env.AMAP_API_KEY; }

async function amapFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const url = new URL(`${AMAP_ENDPOINT}${path}`);
  url.search = new URLSearchParams({ ...params, key }).toString();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  try {
    return (await response.json()) as T;
  } catch {
    // 部分接口在限流或上游异常时会返回空 200 响应；把它当作无数据，
    // 让页面继续展示已有路书，而不是把推荐请求升级成客户端异常。
    return null;
  }
}

export async function geocodePlace(name: string): Promise<Place | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await amapFetch<AmapGeocodeResponse>("/geocode/geo", { address: name });
    const [lng, lat] = (result?.status === "1" ? result.geocodes?.[0]?.location : undefined)?.split(",").map(Number) ?? [];
    if (Number.isFinite(lng) && Number.isFinite(lat)) return { name, lng, lat, cityCode: result?.geocodes?.[0]?.adcode };
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

export function amapNavigationUrl(from: Place, to: Place): string | undefined {
  if (from.lng === undefined || from.lat === undefined || to.lng === undefined || to.lat === undefined) return undefined;
  const params = new URLSearchParams({
    from: `${from.lng},${from.lat},${from.name}`,
    to: `${to.lng},${to.lat},${to.name}`,
    mode: "car",
    policy: "1",
  });
  return `https://uri.amap.com/navigation?${params.toString()}`;
}

export async function searchPois(keyword: string, city?: string): Promise<Place[]> {
  if (!keyword.trim()) return [];
  const result = await amapFetch<AmapPoiResponse>("/place/text", {
    keywords: keyword.trim(),
    ...(city ? { city } : {}),
    offset: "5",
    page: "1",
    extensions: "all",
  });
  if (result?.status !== "1") return [];
  return (result.pois ?? []).flatMap((poi) => {
    const [lng, lat] = (poi.location ?? "").split(",").map(Number);
    if (!poi.name || !Number.isFinite(lng) || !Number.isFinite(lat)) return [];
    return [{ name: poi.name, poiId: poi.id, address: poi.address || poi.adname, type: poi.type, lng, lat }];
  });
}

export async function searchRecommendations(city: string, category: "景点" | "餐厅", from?: Place): Promise<Recommendation[]> {
  const result = await amapFetch<AmapPoiResponse>("/place/text", {
    keywords: category,
    city,
    offset: "6",
    page: "1",
    extensions: "all",
  });
  if (result?.status !== "1") return [];
  return (result.pois ?? []).flatMap((poi, index) => {
    const [lng, lat] = (poi.location ?? "").split(",").map(Number);
    if (!poi.name || !Number.isFinite(lng) || !Number.isFinite(lat)) return [];
    const place = { name: poi.name, lng, lat };
    return [{
      id: poi.id,
      name: poi.name,
      address: poi.address || poi.adname,
      type: poi.type,
      rating: poi.biz_ext?.rating,
      price: poi.biz_ext?.cost,
      imageUrl: poi.photos?.find((photo) => photo.url)?.url ?? recommendationImage(category, index),
      navigationUrl: from ? amapNavigationUrl(from, place) : undefined,
      source: { provider: "amap-poi", fetchedAt: new Date().toISOString(), status: "verified" as const },
    }];
  });
}

/** 仅返回高德 POI 自带实景图，避免把本地主题图误标为真实照片。 */
export async function searchSceneryPhoto(city: string): Promise<{ name: string; imageUrl: string } | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await amapFetch<AmapPoiResponse>("/place/text", {
      keywords: "景点",
      city,
      offset: "10",
      page: "1",
      extensions: "all",
    });
    if (result?.status === "1") {
      for (const poi of result.pois ?? []) {
        const imageUrl = poi.photos?.find((photo) => photo.url)?.url;
        if (poi.name && imageUrl) return { name: poi.name, imageUrl };
      }
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

async function enrichPlanWithPois(plan: TripPlan): Promise<TripPlan> {
  const days = await Promise.all(plan.days.map(async (day) => {
    const keyword = day.end.name === day.start.name
      ? `${day.end.name} ${plan.request.interests[0] ?? "景点"}`
      : `${day.end.name} 景点`;
    const [poi] = await searchPois(keyword, day.end.cityCode ?? day.end.name);
    if (!poi) return day;
    const place = { ...poi, navigationUrl: amapNavigationUrl(day.start, poi) };
    const schedule = day.schedule.map((item, index) => index === 1
      ? { ...item, title: poi.name, description: `${poi.address ? `${poi.address}。` : ""}高德地点检索结果，可按开放时间和体力安排到访。`, place }
      : item);
    const photoTips = day.photoTips.map((item, index) => index === 0
      ? { ...item, title: `${poi.name} · 拍摄建议`, place, source: { provider: "amap-poi", fetchedAt: new Date().toISOString(), status: "verified" as const } }
      : item);
    return { ...day, schedule, photoTips };
  }));
  const withHotels: typeof days = [];
  for (const [index, day] of days.entries()) {
    // 返程当天通常不需要住宿，也避免为返程终点浪费一次供应商查询。
    if (index === days.length - 1 && plan.request.returnTrip && day.end.name === plan.request.origin) {
      withHotels.push(day);
      continue;
    }
    const nextDate = plan.days[index + 1]?.date ?? addOneDay(day.date);
    let hotels = await searchHotels(day.end.name, day.date, nextDate, true);
    if (!hotels.length) hotels = await searchHotels(day.end.name, day.date, nextDate, false);
    withHotels.push(hotels.length ? {
      ...day,
      hotels,
      stayAdvice: `推荐入住${hotels[0].name}${hotels[0].price ? `，参考价 ${hotels[0].price}/晚` : ""}。可在飞猪查看实时房态和预订条件。`,
    } : day);
  }
  return { ...plan, days: withHotels };
}

function addOneDay(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseGeometry(steps: Array<{ polyline?: string }> | undefined): [number, number][] {
  return (steps ?? []).flatMap((step) => (step.polyline ?? "").split(";").flatMap((pair) => {
    const [lng, lat] = pair.split(",").map(Number);
    return Number.isFinite(lng) && Number.isFinite(lat) ? [[lng, lat] as [number, number]] : [];
  }));
}

export async function drivingLeg(from: Place, to: Place): Promise<RouteLeg | null> {
  if (from.lng === undefined || from.lat === undefined || to.lng === undefined || to.lat === undefined) return null;
  const result = await amapFetch<AmapDrivingResponse>("/direction/driving", {
    origin: `${from.lng},${from.lat}`, destination: `${to.lng},${to.lat}`, extensions: "all", strategy: "0",
  });
  const path = result?.status === "1" ? result.route?.paths?.[0] : undefined;
  if (!path) return null;
  return { from, to, distanceKm: Number(path.distance ?? 0) / 1000, durationMinutes: Number(path.duration ?? 0) / 60, geometry: parseGeometry(path.steps), source: { provider: "amap", fetchedAt: new Date().toISOString(), status: "verified" } };
}

async function weatherForPlace(place: Place, date: string): Promise<DayPlan["weather"]> {
  const today = new Date();
  const target = new Date(`${date}T12:00:00Z`);
  const daysAhead = Math.floor((target.getTime() - new Date(`${today.toISOString().slice(0, 10)}T12:00:00Z`).getTime()) / 86400000);
  if (daysAhead <= 2 && place.cityCode) {
    const result = await amapFetch<AmapWeatherResponse>("/weather/weatherInfo", { city: place.cityCode, extensions: "all" });
    const cast = result?.status === "1" ? result.forecasts?.[0]?.casts?.find((item) => item.date === date) : undefined;
    if (cast) return { date, dayWeather: cast.dayweather, nightWeather: cast.nightweather, dayTemp: cast.daytemp, nightTemp: cast.nighttemp, dayWind: cast.daywind, nightWind: cast.nightwind, source: { provider: "amap-weather", fetchedAt: new Date().toISOString(), status: "verified" } };
  }
  const qKey = process.env.QWEATHER_API_KEY;
  if (!qKey || place.lng === undefined || place.lat === undefined || daysAhead > 10) return undefined;
  const url = new URL("https://devapi.qweather.com/v7/weather/10d");
  url.search = new URLSearchParams({ location: `${place.lng},${place.lat}`, key: qKey }).toString();
  const response = await fetch(url, { cache: "no-store" });
  const result = response.ok ? await response.json() as QWeatherResponse : null;
  const cast = result?.code === "200" ? result.daily?.find((item) => item.fxDate === date) : undefined;
  if (!cast) return undefined;
  return { date, dayWeather: cast.textDay, nightWeather: cast.textNight, dayTemp: cast.tempMax, nightTemp: cast.tempMin, dayWind: cast.windDirDay, nightWind: cast.windScaleDay, source: { provider: "qweather", fetchedAt: new Date().toISOString(), status: "verified" } };
}

export async function enrichPlanWithAmap(plan: TripPlan, options: { rewriteWithAi?: boolean } = {}): Promise<TripPlan> {
  if (!apiKey()) return plan;
  try {
    const origin = await geocodePlace(plan.request.origin);
    const destination = await geocodePlace(plan.request.destination);
    if (!origin || !destination) return plan;
    const aiNames = plan.days.flatMap((day) => [day.start.name, day.end.name]);
    const uniqueNames = [...new Set(aiNames)].filter(Boolean);
    const namedPlaces = new Map<string, Place>();
    for (const name of uniqueNames) {
      const place = name === origin.name ? origin : name === destination.name ? destination : await geocodePlace(name);
      if (place) namedPlaces.set(name, place);
    }
    const anchors = plan.days.map((day, index) => {
      const from = namedPlaces.get(day.start.name) ?? (index === 0 ? origin : undefined);
      const to = namedPlaces.get(day.end.name) ?? (index === plan.days.length - 1 ? destination : undefined);
      return { from, to };
    });
    const segments = await Promise.all(anchors.map(({ from, to }) => from && to ? drivingLeg(from, to) : Promise.resolve(null)));
    const validSegments = segments.filter((segment): segment is RouteLeg => Boolean(segment));
    const dailyLimitHours = plan.request.dailyDriveLimitHours ?? ({ relaxed: 6, balanced: 8, full: 10 }[plan.request.pace] ?? 8);
    const days = plan.days.map((day, index) => {
      const from = anchors[index]?.from ?? day.start;
      const to = anchors[index]?.to ?? day.end;
      // 必须从原始 segments 按日期索引读取。不能使用过滤后的 validSegments，
      // 否则某一天路线失败后，后续每天都会拿到错误的路线段。
      const dayLeg = segments[index];
      const durationHours = dayLeg ? (dayLeg.durationMinutes ?? 0) / 60 : 0;
      const distanceKm = dayLeg?.distanceKm ?? 0;
      const overTime = durationHours > dailyLimitHours;
      const overDistance = distanceKm > Math.max(650, dailyLimitHours * 110);
      const needsAdjustment = overTime || overDistance;
      const validationNote = needsAdjustment
        ? `路线合理性校验：当日约 ${Math.round(distanceKm)} km / ${Math.round(durationHours * 10) / 10} 小时，超过建议上限，建议增加停留天数或调整落脚点。`
        : "路线合理性校验通过。";
      const validatedLeg = dayLeg ? { ...dayLeg, source: { ...dayLeg.source, status: needsAdjustment ? "needs_check" as const : "verified" as const } } : dayLeg;
      const cleanedRisks = day.risks.filter((risk) => !risk.includes("单日驾驶约18小时"));
      return {
        ...day,
        start: from,
        end: to,
        legs: validatedLeg ? [validatedLeg] : [],
        title: `${from.name} → ${to.name}`,
        summary: needsAdjustment ? `${from.name} → ${to.name}：${validationNote}` : `从${from.name}前往${to.name}，当日路线已由高德地图核验。`,
        risks: needsAdjustment ? [...cleanedRisks, validationNote] : cleanedRisks,
        weather: undefined,
        schedule: day.schedule.map((item, itemIndex) => itemIndex === 0 ? { ...item, title: `${from.name} → ${to.name}`, description: dayLeg ? `约 ${Math.round(dayLeg.distanceKm ?? 0)} km，预计 ${formatDuration(Math.round(dayLeg.durationMinutes ?? 0))}。` : item.description } : item),
      };
    });
    const daysWithWeather = await Promise.all(days.map(async (day) => ({ ...day, weather: await weatherForPlace(day.end, day.date) })));
    const totalDistanceKm = validSegments.reduce((sum, segment) => sum + (segment.distanceKm ?? 0), 0);
    const hasUnreasonableDay = daysWithWeather.some((day) => day.risks.some((risk) => risk.startsWith("路线合理性校验：")));
    const routedPlan = { ...plan, status: validSegments.length === daysWithWeather.length && !hasUnreasonableDay ? "ready" : "partial", title: plan.request.returnTrip ? `${plan.request.days} 天，${origin.name} → ${destination.name} → ${origin.name}。` : plan.title, days: daysWithWeather, totalDistanceKm, factsUpdatedAt: new Date().toISOString() } as TripPlan;
    const writtenPlan = options.rewriteWithAi === false ? routedPlan : await enrichPlanWithDeepSeek(routedPlan);
    return enrichPlanWithPois(writtenPlan);
  } catch { return plan; }
}
