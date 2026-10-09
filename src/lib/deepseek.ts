import type { TripPlan } from "./types";

type DeepSeekResponse = { choices?: Array<{ message?: { content?: string } }> };

type AiRouteSkeleton = { days?: Array<{ dayIndex?: number; start?: string; end?: string; focus?: string }> };
type AiRevision = { summary?: string; alternative?: string; targetEnd?: string; schedule?: Array<{ time?: string; title?: string; description?: string }>; risks?: string[] };

/** 将用户的自然语言调整要求解析成受限结构化指令。AI 不能填写距离、时长或经纬度。 */
export async function interpretRevisionWithDeepSeek(plan: TripPlan, dayIndex: number, instruction: string): Promise<AiRevision | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你是旅行路线修改助手。只能修改指定日期的行程文案、备用方案、风险和落脚城市。只有用户明确要求换城市或减少驾驶时，才填写 targetEnd；targetEnd 必须是明确的中国城市/县镇名称，不能填景点、经纬度或虚构地点。绝对不要输出距离、耗时、价格。严格输出 JSON：{summary,alternative,targetEnd,schedule:[{time,title,description}],risks}。" },
        { role: "user", content: JSON.stringify({ dayIndex, instruction, day: plan.days.find((day) => day.dayIndex === dayIndex), request: plan.request }) },
      ],
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  try {
    const content = ((await response.json()) as DeepSeekResponse).choices?.[0]?.message?.content;
    return content ? JSON.parse(content) as AiRevision : null;
  } catch { return null; }
}

/** 让 AI 先决定每日落脚点，距离和道路随后交给高德核验。 */
export async function planRouteWithDeepSeek(plan: TripPlan): Promise<TripPlan> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return plan;
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你是自驾路线规划器。请根据出发地、目的地、天数、节奏和兴趣，规划每日连续落脚点。只输出 JSON：{days:[{dayIndex,start,end,focus}]}。第1天 start 必须是出发地，最后一天 end 必须是目的地；往返路线最后一天必须回到出发地。不要输出经纬度、距离或耗时，不要编造景点作为城市。每天只规划一个 end。" },
        { role: "user", content: JSON.stringify({ request: plan.request, templateDays: plan.days.map((day) => ({ dayIndex: day.dayIndex, date: day.date })) }) },
      ],
    }),
    cache: "no-store",
  });
  if (!response.ok) return plan;
  const data = (await response.json()) as DeepSeekResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) return plan;
  try {
    const parsed = JSON.parse(content) as AiRouteSkeleton;
    if (!Array.isArray(parsed.days) || parsed.days.length === 0) return plan;
    const origin = plan.request.origin;
    const destination = plan.request.destination;
    const lastIndex = plan.days.length;
    const aiDays = parsed.days.filter((day) => Number.isInteger(day.dayIndex) && day.start && day.end);
    if (aiDays.length !== plan.days.length) return plan;
    return {
      ...plan,
      days: plan.days.map((day) => {
        const ai = aiDays.find((item) => item.dayIndex === day.dayIndex);
        if (!ai) return day;
        const start = day.dayIndex === 1 ? origin : ai.start!;
        const end = day.dayIndex === lastIndex ? (plan.request.returnTrip ? origin : destination) : ai.end!;
        return {
          ...day,
          start: { ...day.start, name: start },
          end: { ...day.end, name: end },
          title: `${start} → ${end}`,
          summary: ai.focus ? `${start} → ${end}：${ai.focus}` : `${start} → ${end}`,
          legs: [],
        };
      }),
    };
  } catch {
    return plan;
  }
}

export async function enrichPlanWithDeepSeek(plan: TripPlan): Promise<TripPlan> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return plan;
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你是自驾旅行路书编辑。只能基于用户请求和已核验路线生成建议，不能修改起点、终点、日期、里程和驾驶时长。输出严格 JSON，字段为 days 数组，每项包含 dayIndex、summary、schedule、photoTips、stayAdvice、risks、alternative、imageTheme。imageTheme 只能是 city-day、city-night、snow-mountain、lake-sunset、old-town、highway-return、forest-road 之一，用于前端选择每日视觉主题。" },
        { role: "user", content: JSON.stringify({ request: plan.request, days: plan.days.map((day) => ({ dayIndex: day.dayIndex, date: day.date, start: day.start.name, end: day.end.name, distanceKm: day.legs[0]?.distanceKm, durationMinutes: day.legs[0]?.durationMinutes })) }) },
      ],
    }),
    cache: "no-store",
  });
  if (!response.ok) return plan;
  const data = (await response.json()) as DeepSeekResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) return plan;
  try {
    const parsed = JSON.parse(content) as { days?: Array<Partial<TripPlan["days"][number]> & { dayIndex: number; imageTheme?: TripPlan["days"][number]["imageTheme"]; schedule?: Array<{ time?: string; title?: string; description?: string; activity?: string }>; photoTips?: Array<string | { title?: string; bestTime?: string; description?: string }> }> };
    if (!Array.isArray(parsed.days)) return plan;
    return { ...plan, days: plan.days.map((day) => {
      const ai = parsed.days?.find((item) => item.dayIndex === day.dayIndex);
      if (!ai) return day;
      const rawSchedule = ai.schedule as Array<{ time?: string; title?: string; description?: string; activity?: string }> | undefined;
      const rawPhotoTips = ai.photoTips as Array<string | { title?: string; bestTime?: string; description?: string }> | undefined;
      const schedule = rawSchedule?.map((item, index) => ({ ...day.schedule[index], time: item.time, title: item.title ?? item.activity ?? "当日安排", description: item.description ?? item.activity ?? "" })) ?? day.schedule;
      const photoTips = rawPhotoTips?.map((item, index) => typeof item === "string" ? { ...day.photoTips[index], title: "AI 拍摄建议", description: item } : { ...day.photoTips[index], title: item.title ?? "AI 拍摄建议", bestTime: item.bestTime, description: item.description }) ?? day.photoTips;
      return { ...day, summary: ai.summary ?? day.summary, schedule, photoTips, stayAdvice: ai.stayAdvice ?? day.stayAdvice, risks: ai.risks ?? day.risks, alternative: ai.alternative ?? day.alternative, imageTheme: ai.imageTheme ?? day.imageTheme };
    }) };
  } catch { return plan; }
}
