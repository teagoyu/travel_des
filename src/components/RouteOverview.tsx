import type { TripPlan } from "@/lib/types";

export default function RouteOverview({ plan }: { plan: TripPlan }) {
  return (
    <section className="route-story" aria-labelledby="overview-title">
      <div className="section-kicker">ROUTE OVERVIEW</div>
      <div className="flex items-end justify-between gap-4 max-sm:block">
        <h2 id="overview-title" className="serif m-0 text-[34px] font-medium max-sm:text-[29px]">
          一条路，{plan.days.length} 个日夜
        </h2>
        <p className="m-0 text-xs text-soft max-sm:mt-1">
          {plan.request.origin} → {plan.request.destination.replace(/^.*·\s*/, "")}{plan.request.returnTrip ? ` → ${plan.request.origin}` : ""}
        </p>
      </div>
      <p className="subcopy mt-3 text-[13px] leading-[1.8] text-muted">
        路线由 AI 规划每日落脚点，按行程顺序生成 SVG 路线示意。
      </p>

      <JourneyTimeline plan={plan} />

      <div className="route-story-map mt-5 mb-14 overflow-hidden rounded-[20px] border border-line bg-[radial-gradient(circle_at_50%_30%,#2b352c,#1b211e_64%)] px-6 pt-5 pb-3.5 max-sm:mb-10 max-sm:p-4">
        <div className="route-phase-legend mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#b7c4b8]" aria-label="路线阶段图例">
          <span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#11a89e]" />出发段</span>
          <span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#d0a233]" />中途停留</span>
          {plan.request.returnTrip && <span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#7f92d9]" />返程虚线</span>}
          <span className="ml-auto text-[#819386]">纬度示意 · 非导航地图</span>
        </div>
        <RouteSvg plan={plan} />
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-[1.7] text-soft">
          正式版会在路线核验后显示实际道路、距离、预计耗时与数据更新时间。
        </p>
      </div>
    </section>
  );
}

function RouteSvg({ plan }: { plan: TripPlan }) {
  const W = 900;
  const H = 360;
  // 地图上的点不是“点序号”，而是“出发地 + 每天落脚地”。
  // 因此第 1 天会有出发点和落脚点两个点，标签必须使用真实 dayIndex。
  const rawStops = plan.days.flatMap((day, index) => index === 0
    ? [{ place: day.start, day: day.dayIndex, role: "出发" }, { place: day.end, day: day.dayIndex, role: "落脚" }]
    : [{ place: day.end, day: day.dayIndex, role: "落脚" }]);
  const returnToStart = plan.request.returnTrip && rawStops.length > 1 && rawStops[0].place.name === rawStops[rawStops.length - 1].place.name;
  const stops = returnToStart ? rawStops.slice(0, -1) : rawStops;
  const points = stops.map(({ place, day, role }, index) => ({ name: place.name, day, role, lng: place.lng, lat: place.lat, index }));
  const latitudes = points.map((point) => point.lat).filter((lat): lat is number => Number.isFinite(lat));
  const minLat = latitudes.length ? Math.min(...latitudes) : 0;
  const maxLat = latitudes.length ? Math.max(...latitudes) : 1;
  const coords = points.map((point, index) => ({
    ...point,
    x: 90 + (index / Math.max(points.length - 1, 1)) * 720,
    y: point.lat !== undefined && maxLat > minLat ? 285 - ((point.lat - minLat) / (maxLat - minLat)) * 210 : 175 + [0, -58, 50, -34, 62, -48, 30][index % 7],
  }));
  const labelLayout = buildRouteLabelLayout(coords);
  const returnPath = returnToStart && coords.length > 1 ? routeReturnLane(coords[coords.length - 1], coords[0], W, H) : "";

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-[#18201b]">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`AI 规划路线：${points.map((point) => point.name).join("、")}`} className="h-auto min-w-[680px] w-full">
        <defs>
          <pattern id="route-grid" width="54" height="54" patternUnits="userSpaceOnUse">
            <path d="M54 0H0V54" fill="none" stroke="#657567" strokeOpacity=".16" />
          </pattern>
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#route-grid)" />
        {latitudes.length > 1 && [0, 1, 2, 3].map((tick) => {
          const value = maxLat - ((maxLat - minLat) * tick) / 3;
          const y = 75 + (tick / 3) * 210;
          return <g key={`lat-${tick}`}><line x1="48" x2={W - 40} y1={y} y2={y} stroke="#657567" strokeOpacity=".16" strokeDasharray="3 7" /><text x="10" y={y + 4} fill="#859285" fontSize="11">{value.toFixed(1)}°N</text></g>;
        })}
        {coords.slice(1).map((point, index) => {
          const from = coords[index];
          const color = routeSegmentColor(index, coords.length, plan.request.returnTrip);
          return (
            <g key={`route-segment-${index}`}>
              <path d={buildRouteSegmentPath(from, point, index)} fill="none" stroke="#07100c" strokeWidth="18" strokeLinecap="round" opacity=".9" />
              <path d={buildRouteSegmentPath(from, point, index)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" filter="url(#route-glow)" />
            </g>
          );
        })}
        {returnPath && <path d={returnPath} fill="none" stroke="#7f92d9" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" opacity=".95" />}
        {coords.map((point, index) => {
          const label = labelLayout[index];
          return (
            <g key={`${point.name}-${point.day}`}>
              <circle cx={point.x} cy={point.y} r="10" fill={point.index === 0 ? "#11a89e" : routeColor(point.day, plan.days.length, plan.request.returnTrip)} stroke="#111612" strokeWidth="5" />
              <g className="route-point-label" aria-label={`${point.name}，第 ${point.day} 天`}>
                <rect x={label.boxX} y={label.boxY} width={labelBoxWidth(label)} height="43" rx="8" fill="#18201b" fillOpacity=".94" stroke="#6d7e70" strokeOpacity=".6" />
                <text x={label.x} y={label.dayY} textAnchor="middle" fill="#e7c780" fontSize="11">DAY {String(point.day).padStart(2, "0")} · {point.role}</text>
                <text x={label.x} y={label.nameY} textAnchor="middle" fill="#eef0e8" fontSize="15" textLength={label.nameWidth} lengthAdjust="spacingAndGlyphs">{point.name}</text>
              </g>
            </g>
          );
        })}
        <text x="450" y="324" textAnchor="middle" fill="#aab6aa" fontSize="12">AI 路线规划 · SVG 示意图 · 非导航地图</text>
      </svg>
    </div>
  );
}

function routeSegmentColor(index: number, pointCount: number, returnTrip?: boolean): string {
  if (index === 0) return "#11a89e";
  if (returnTrip && index >= Math.ceil((pointCount - 1) / 2)) return "#7f92d9";
  return "#d0a233";
}

function buildRouteSegmentPath(from: { x: number; y: number }, to: { x: number; y: number }, index: number): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const bow = index % 2 === 0 ? 12 : -12;
  return `M${from.x} ${from.y} Q${midX} ${midY + bow} ${to.x} ${to.y}`;
}

function routeReturnLane(from: { x: number; y: number }, to: { x: number; y: number }, width: number, height: number): string {
  const laneY = height - 36;
  const spread = Math.max(90, width * 0.16);
  return `M${from.x} ${from.y} C${from.x - spread} ${laneY}, ${to.x + spread} ${laneY}, ${to.x} ${to.y}`;
}

type RouteCoord = { x: number; y: number; name: string };
type RouteLabel = { x: number; dayY: number; nameY: number; boxX: number; boxY: number; nameWidth: number; width: number };

function labelBoxWidth(label: RouteLabel): number {
  return label.width;
}

function buildRouteLabelLayout(points: RouteCoord[]): RouteLabel[] {
  return points.map((point, index) => {
    const width = Math.min(156, Math.max(82, point.name.length * 16 + 28));
    const previous = points[index - 1];
    const preferAbove = index % 2 === 1 || point.y > 250;
    const crowded = previous && Math.abs(point.x - previous.x) < width * 0.9 && Math.abs(point.y - previous.y) < 90;
    const above = crowded ? !preferAbove : preferAbove;
    const x = Math.max(width / 2 + 8, Math.min(892 - width / 2, point.x));
    const boxY = above ? Math.max(12, point.y - 60) : Math.min(305, point.y + 17);
    const nameWidth = Math.min(width - 20, Math.max(44, point.name.length * 14));
    return { x, dayY: boxY + 16, nameY: boxY + 35, boxX: x - width / 2, boxY, nameWidth, width };
  });
}

function JourneyTimeline({ plan }: { plan: TripPlan }) {
  return (
    <div className="mt-7 mb-2 overflow-x-auto pb-2">
      <div className="mb-3 flex min-w-[620px] flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
        <span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#11a89e]" />前段路线</span>
        <span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#d0a233]" />中途停留</span>
        <span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#7f92d9]" />抵达段</span>
        <span>● 住宿 / 落脚点</span>
      </div>
      <div className="flex min-w-[620px] items-end gap-0 border-b border-line pb-1">
        {plan.days.map((day, index) => {
          const date = new Date(`${day.date}T12:00:00`);
          return (
            <div key={day.date} className="min-w-[74px] flex-1 text-center">
              <div className="text-[10px] text-soft">{weekday(date)}</div>
              <div className="serif mt-1 text-[16px] text-ink">{date.getDate()}</div>
              <div className="mx-1 mt-2 h-1.5 rounded-full" style={{ background: routeColor(index + 1, plan.days.length, plan.request.returnTrip) }} />
              <div className="mt-2 text-[10px] text-soft">{index === 0 ? "出发" : index === plan.days.length - 1 ? "抵达" : `第 ${index + 1} 天`}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function routeColor(dayIndex: number, totalDays: number, returnTrip?: boolean): string {
  if (dayIndex === 1) return "#11a89e";
  if (returnTrip && dayIndex > Math.ceil(totalDays / 2)) return "#7f92d9";
  return "#d0a233";
}

function weekday(date: Date): string {
  return ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
}
