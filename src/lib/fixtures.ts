/**
 * 阶段 A 固定示例数据（Fixture）。
 *
 * ⚠️ 原型中的川西路线、里程、驾驶时长、海拔、费用、时间等全部是**示意数据**，
 * 只允许存在于本文件；页面组件一律通过 TripPlan / TripRequest 契约读取，
 * 阶段 C 接入真实数据源后整体替换本文件即可，无需改动组件。
 */

import type { TripPlan, TripRequest } from "./types";

const SAMPLE_REQUEST: TripRequest = {
  origin: "成都",
  destination: "川西 · 稻城亚丁",
  departDate: "2026-10-01",
  days: 7,
  partySize: 2,
  budgetCny: { min: 5000, max: 8000 },
  pace: "balanced",
  accommodation: "hotel",
  interests: ["雪山", "日落", "摄影"],
};

/** 示例来源引用：所有示意数值统一标记为 estimated / needs_check，绝不标 verified */
const sampleSource = (status: "estimated" | "needs_check" = "estimated") => ({
  provider: "sample-fixture",
  fetchedAt: "2026-09-24T00:00:00+08:00",
  status,
});

const SAMPLE_CHECKLIST = [
  { id: "check-weather", label: "核对路况与高原天气", checked: false },
  { id: "check-stay", label: "确认住宿和停车条件", checked: false },
  { id: "check-tires", label: "检查轮胎、刹车和备胎", checked: false },
  { id: "check-maps", label: "下载离线地图", checked: false },
  { id: "check-supplies", label: "准备保暖衣物、饮水与补给", checked: false },
];

export const SAMPLE_TRIP_PLAN: TripPlan = {
  id: "sample-chuanxi-2026",
  version: 1,
  status: "partial",
  title: "7 天，把川西写进风景里。",
  request: SAMPLE_REQUEST,
  totalDistanceKm: 1450,
  totalBudgetCny: { min: 5800, max: 8000 },
  checklist: SAMPLE_CHECKLIST,
  factsUpdatedAt: "2026-09-24T00:00:00+08:00",
  createdAt: "2026-09-24T00:00:00+08:00",
  days: [
    {
      dayIndex: 1,
      date: "2026-10-01",
      title: "成都 → 康定",
      summary: "收起城市节奏，沿着山路缓慢进入高原。今天的重点是适应海拔与保持体力。",
      start: { name: "成都", lng: 104.065, lat: 30.57 },
      end: { name: "康定", lng: 101.965, lat: 30.052 },
      legs: [
        {
          from: { name: "成都", lng: 104.065, lat: 30.57 },
          to: { name: "康定", lng: 101.965, lat: 30.052 },
          distanceKm: 280,
          durationMinutes: 270,
          source: sampleSource(),
        },
      ],
      schedule: [
        { time: "08:00", title: "成都出发", description: "早点离城，给途中停车和休息留出余量。" },
        { time: "12:30", title: "途中午餐", description: "在沿线城镇用餐，驾驶员充分休息。" },
        { time: "16:30", title: "抵达康定", description: "办理入住，傍晚在城区周边散步。" },
      ],
      photoTips: [
        { title: "黄昏街景", bestTime: "傍晚", description: "傍晚的山城层次适合轻装拍摄。无需为了追光继续赶路。" },
      ],
      stayAdvice: "住在康定：选择有停车位、第二天出城方便的住宿。",
      risks: ["路况提醒：路线与时长仅为示意；正式版以地图和当天路况校验。"],
      budgetCny: { min: 800, max: 1100 },
    },
    {
      dayIndex: 2,
      date: "2026-10-02",
      title: "康定 → 新都桥",
      summary: "把这一天交给沿途风景。早起、慢行，在适合停车的地方等光。",
      start: { name: "康定", lng: 101.965, lat: 30.052 },
      end: { name: "新都桥", lng: 101.507, lat: 30.03 },
      legs: [
        {
          from: { name: "康定", lng: 101.965, lat: 30.052 },
          to: { name: "新都桥", lng: 101.507, lat: 30.03 },
          distanceKm: 90,
          durationMinutes: 120,
          source: sampleSource(),
        },
      ],
      schedule: [
        { time: "06:30", title: "出发拍晨光", description: "提前确认天气和安全停车位置。" },
        { time: "10:00", title: "沿途观景", description: "经过山口时控制停留时间，注意海拔变化。" },
        { time: "16:30", title: "新都桥入住", description: "为傍晚和次日清晨拍摄留出空间。" },
      ],
      photoTips: [
        { title: "黄金一小时", bestTime: "日出后一小时", description: "示意机位：新都桥周边开阔草地。正式版须标记可停车地点。" },
      ],
      stayAdvice: "住在新都桥：优先选择可停车、供暖稳定的住宿。",
      risks: ["高原节奏：轻微不适应就减慢活动，明显症状需及时求助。"],
      budgetCny: { min: 600, max: 900 },
    },
    {
      dayIndex: 3,
      date: "2026-10-03",
      title: "新都桥 → 理塘",
      summary: "高原公路与开阔地貌是今天的主角。拍摄停留应服从天气和行车安全。",
      start: { name: "新都桥", lng: 101.507, lat: 30.03 },
      end: { name: "理塘", lng: 100.27, lat: 29.997 },
      legs: [
        {
          from: { name: "新都桥", lng: 101.507, lat: 30.03 },
          to: { name: "理塘", lng: 100.27, lat: 29.997 },
          distanceKm: 290,
          durationMinutes: 300,
          source: sampleSource(),
        },
      ],
      schedule: [
        { time: "07:30", title: "新都桥出发", description: "先确认油量/电量与沿线补给。" },
        { time: "11:30", title: "途中休息", description: "午餐和驾驶员休息合并安排。" },
        { time: "17:00", title: "抵达理塘", description: "尽量在天黑前进城并入住。" },
      ],
      photoTips: [
        { title: "公路与远山", bestTime: "午后", description: "长焦可压缩山峦层次；无人机拍摄遵守当地规定。" },
      ],
      stayAdvice: "住在理塘：优先供暖与停车条件，不为夜景延长驾驶。",
      risks: ["海拔较高：当天安排较轻，避免剧烈活动。"],
      budgetCny: { min: 800, max: 1200 },
    },
    {
      dayIndex: 4,
      date: "2026-10-04",
      title: "理塘 → 稻城",
      summary: "今天不追求打卡数量。中途留出观景时间，傍晚抵达住宿地。",
      start: { name: "理塘", lng: 100.27, lat: 29.997 },
      end: { name: "稻城", lng: 100.298, lat: 29.038 },
      legs: [
        {
          from: { name: "理塘", lng: 100.27, lat: 29.997 },
          to: { name: "稻城", lng: 100.298, lat: 29.038 },
          distanceKm: 150,
          durationMinutes: 180,
          source: sampleSource(),
        },
      ],
      schedule: [
        { time: "08:30", title: "理塘出发", description: "出发前检查天气和剩余里程。" },
        { time: "11:30", title: "沿途观景", description: "仅在允许、安全的地点停车。" },
        { time: "16:00", title: "稻城入住", description: "提前休息，为次日户外活动留体力。" },
      ],
      photoTips: [
        { title: "草地的侧光", bestTime: "下午", description: "选择光线柔和时段，山地天气可能快速变化。" },
      ],
      stayAdvice: "住在稻城：靠近次日出行方向，减少早晨折返。",
      risks: ["天气变化：雨雪时减少观景停留，按实时路况调整。"],
      budgetCny: { min: 700, max: 1000 },
    },
    {
      dayIndex: 5,
      date: "2026-10-05",
      title: "稻城 · 山野慢行",
      summary: "把一天留给山野。正式版将根据门票、开放时间和体能选择合适的步行路线。",
      start: { name: "稻城", lng: 100.298, lat: 29.038 },
      end: { name: "稻城", lng: 100.298, lat: 29.038 },
      legs: [],
      schedule: [
        { time: "07:00", title: "确认天气", description: "决定徒步强度和拍摄目标。" },
        { time: "09:00", title: "进入景区", description: "按照实际预约和开放时间安排。" },
        { time: "17:00", title: "返回住宿", description: "日落拍摄以体力和返程安全为前提。" },
      ],
      photoTips: [
        { title: "晨雾与山体", bestTime: "清晨", description: "携带广角与轻便脚架；机位与日出时间需当日核验。" },
      ],
      stayAdvice: "续住稻城：减少搬运行李和海拔适应成本。",
      risks: ["步行强度：正式版须显示徒步距离、爬升及天气备选方案。"],
      budgetCny: { min: 500, max: 900 },
    },
    {
      dayIndex: 6,
      date: "2026-10-06",
      title: "稻城 → 新都桥",
      summary: "返程不必复制去程。让每段驾驶都留出休息与天气缓冲。",
      start: { name: "稻城", lng: 100.298, lat: 29.038 },
      end: { name: "新都桥", lng: 101.507, lat: 30.03 },
      legs: [
        {
          from: { name: "稻城", lng: 100.298, lat: 29.038 },
          to: { name: "新都桥", lng: 101.507, lat: 30.03 },
          distanceKm: 420,
          durationMinutes: 420,
          source: sampleSource(),
        },
      ],
      schedule: [
        { time: "06:30", title: "尽早出发", description: "较长驾驶日，保持休息频率。" },
        { time: "12:00", title: "途中午餐", description: "根据实时位置选择正规补给点。" },
        { time: "18:00", title: "抵达住宿", description: "如疲劳或天气变差，应提前调整落脚点。" },
      ],
      photoTips: [
        { title: "路上随手记", bestTime: "途中", description: "今天以安全返程为主，拍摄不宜占用驾驶时间。" },
      ],
      stayAdvice: "住在新都桥：正式版需根据实时路况重新确认落脚点。",
      risks: ["长距离驾驶：这是示意行程中最需要进一步校验和优化的一天。"],
      budgetCny: { min: 900, max: 1300 },
    },
    {
      dayIndex: 7,
      date: "2026-10-07",
      title: "新都桥 → 成都",
      summary: "最后一段路，留给从容的归程。高速与山路可能受天气和假期车流影响。",
      start: { name: "新都桥", lng: 101.507, lat: 30.03 },
      end: { name: "成都", lng: 104.065, lat: 30.57 },
      legs: [
        {
          from: { name: "新都桥", lng: 101.507, lat: 30.03 },
          to: { name: "成都", lng: 104.065, lat: 30.57 },
          distanceKm: 220,
          durationMinutes: 240,
          source: sampleSource(),
        },
      ],
      schedule: [
        { time: "08:00", title: "早餐后出发", description: "先查看路况与返程车流。" },
        { time: "11:00", title: "途中休息", description: "避免在最后一天疲劳驾驶。" },
        { time: "16:00", title: "抵达成都", description: "旅程结束，照片可以慢慢整理。" },
      ],
      photoTips: [
        { title: "旅程收尾", bestTime: "途中", description: "把沿途所见整理成影像故事。" },
      ],
      stayAdvice: "返抵成都：无需新增住宿。",
      risks: ["返程拥堵：正式版需展示节假日和实时交通提醒。"],
      budgetCny: { min: 500, max: 800 },
    },
  ],
};

/** 表单默认值也来自 Fixture，保证"示例文案和数值都能从 Fixture 替换" */
export const SAMPLE_TRIP_REQUEST: TripRequest = SAMPLE_TRIP_PLAN.request;
