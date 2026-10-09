# 卡通旅行手账版整站改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“山海之间”整站升级为可切换三套原创卡通背景的旅行手账产品，同时保留现有路线、天气、住宿、Plan B、分享和动画功能。

**Architecture:** 先建立共享的主题令牌和背景装饰层，再让首页、路线总览、每日行程、侧栏和分享组件复用同一套主题接口。三套主题只替换背景、装饰和角色素材，不改变路线数据和业务组件；GIF 使用同一主题名生成对应的卡通路线动画。

**Tech Stack:** Next.js 15、React 19、TypeScript、Tailwind CSS、html-to-image、现有 map-motion 渲染器。

**Spec:** `docs/superpowers/specs/2026-10-09-cartoon-travel-book-design.md`

## Global Constraints

- 保留现有路线规划、高德核验、天气、住宿、Plan B、分享截图和路线 GIF 能力。
- 数据缺失时显示“待补充 / 待核验”，不能用卡通内容伪装成真实数据。
- 角色使用原创卡通形象，不直接复制具体动漫角色、品牌名称或受版权保护的素材。
- 主题必须支持 `童趣冒险`、`侦探探索`、`幻想旅行` 三套皮肤切换。
- 现有匿名会话、路线下载和分享链接继续兼容。

## Review Focus

- 未选择主题时应稳定回退到默认主题，并且不影响页面渲染：由 Task 1 的主题解析测试覆盖。
- 窄屏下背景装饰不能遮挡表单、路线卡和按钮：由 Task 2/3 的页面 smoke 检查覆盖。
- 缺少风景图片时仍显示可用的卡通占位卡并标注来源状态：由 Task 4 的空数据测试覆盖。
- GIF 主题名必须与网页主题一致，未知主题必须回退到默认样式：由 Task 5 的动画配置 smoke 覆盖。
- 旧路书数据没有新字段时必须正常显示：由 Task 3 的 fixture 页面检查覆盖。

---

### Task 1: 建立主题令牌与背景装饰系统

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/components/ThemeBackground.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Test: `scripts/theme-smoke.mjs`

**Interfaces:**
- Produces `TravelTheme = "childhood" | "detective" | "fantasy"`。
- Produces `getTravelTheme(value: string | null | undefined): TravelTheme`，未知值回退 `childhood`。
- `ThemeBackground` 接收 `{ theme: TravelTheme; variant?: "home" | "roadbook" | "daily" | "share" }`。

- [ ] **Step 1: Write the failing theme test**：断言三套主题可解析，未知值回退 childhood，并断言每套主题拥有背景色、装饰色和角色素材字段。
- [ ] **Step 2: Run `node scripts/theme-smoke.mjs` and verify it fails** with missing theme module.
- [ ] **Step 3: Implement theme tokens and `ThemeBackground`**，背景使用 CSS 渐变、云朵、贴纸、虚线路径和原创角色占位素材；装饰层使用 `aria-hidden`，不影响内容可访问性。
- [ ] **Step 4: Add CSS variables and responsive rules**，窄屏隐藏大装饰，只保留顶部和边缘元素。
- [ ] **Step 5: Run the theme smoke test and targeted ESLint**，确认 PASS。

### Task 2: 重做首页规划页

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/TravelThemePicker.tsx`
- Create: `src/components/TravelPlannerHero.tsx`
- Modify: `src/components/CityAutocomplete.tsx` 或当前城市输入组件
- Test: `scripts/home-page-smoke.mjs`

**Interfaces:**
- `TravelThemePicker` 通过 `onChange(theme: TravelTheme)` 返回主题选择。
- 首页通过 URL 参数 `?theme=childhood|detective|fantasy` 保持主题可分享和刷新恢复。

- [ ] **Step 1: Write the failing home smoke test**：检查“我的旅行地图”“开始规划旅程”、主题切换三个入口和默认收起城市输入。
- [ ] **Step 2: Run the smoke test and verify the new markers are missing**。
- [ ] **Step 3: Implement卡通旅行者 Hero、手账输入卡、主题选择器和去过的地方区域**，保持现有表单字段、默认出发日期和 5 天默认值。
- [ ] **Step 4: Verify city autocomplete remains closed until focus/input**，并保留高德建议结果。
- [ ] **Step 5: Run首页 smoke、TypeScript和页面截图检查**。

### Task 3: 重做路书总览与每日行程卡

**Files:**
- Modify: `src/components/PlanView.tsx`
- Modify: `src/components/RouteOverview.tsx`
- Modify: `src/components/DayDetail.tsx`
- Create: `src/components/TravelTimeline.tsx`
- Create: `src/components/TravelInfoCard.tsx`
- Modify: `src/components/RecommendationRail.tsx`
- Test: `scripts/route-page-smoke.mjs`

**Interfaces:**
- `TravelTimeline` 接收当前 `DayPlan`，输出出发、休息、午餐、景点、入住节点。
- `TravelInfoCard` 接收 `{ type: "scenery" | "food" | "stay"; title; subtitle; imageUrl?; sourceStatus? }`。
- 旧 `TripPlan` 字段缺失时使用现有摘要和占位状态，不改变 API 数据结构。

- [ ] **Step 1: Extend route smoke markers**，先断言卡通路线、旅行时间线、风景/美食/住宿卡存在，确认当前实现失败。
- [ ] **Step 2: Implement路线总览卡**：浅色插画地图、蓝色虚线路线、卡通车辆、城市贴纸、驾驶强度和天气状态贴纸。
- [ ] **Step 3: Implement每日时间线和三类信息卡**，保留“调整这一天”“生成 Plan B”“在高德中导航”等操作。
- [ ] **Step 4: Implement主题背景挂载**，确保每日页和侧栏共享当前主题。
- [ ] **Step 5: Run route smoke、TypeScript、targeted ESLint并检查窄屏布局**。

### Task 4: 三套原创素材与分享海报

**Files:**
- Create: `public/themes/childhood/`
- Create: `public/themes/detective/`
- Create: `public/themes/fantasy/`
- Modify: `src/components/ShareCard.tsx`
- Modify: `src/components/PlanView.tsx`
- Test: `scripts/theme-assets-smoke.mjs`

**Interfaces:**
- 每套主题提供 `character`, `hero`, `sticker`, `emptyScenery` 素材；素材缺失时由 CSS 占位，不阻塞页面。
- 分享海报读取当前主题令牌和主题素材，不重复维护颜色。

- [ ] **Step 1: Write the failing asset smoke test**：断言三套主题目录和必需素材清单存在。
- [ ] **Step 2: Run it and verify failure**。
- [ ] **Step 3: Add或生成原创素材**，不使用具体动漫角色和品牌标识；分别匹配童趣、侦探、幻想三种气质。
- [ ] **Step 4: Update分享截图和小红书长图**，加入城市照片框、旅行清单、路线摘要和主题装饰。
- [ ] **Step 5: Run asset smoke并用浏览器验证截图下载**。

### Task 5: 将主题接入路线 GIF

**Files:**
- Modify: `src/lib/mapMotion.ts`
- Modify: `/Users/yuhao/.claude/skills/map-motion/scripts/runtime/mm.js`
- Modify: `scripts/map-motion-cartoon-smoke.mjs`
- Test: `scripts/map-motion-cartoon-smoke.mjs`

**Interfaces:**
- `createMapMotionJob(plan, sessionId, theme?: TravelTheme)` 默认使用当前主题或 childhood。
- map-motion 样式至少支持 `cartoon-childhood`、`cartoon-detective`、`cartoon-fantasy`，未知值回退 `cartoon-childhood`。

- [ ] **Step 1: Extend cartoon smoke test**，断言三套样式存在、未知样式有回退配置，并确认当前测试失败。
- [ ] **Step 2: Add three renderer palettes**：分别配置背景、路线、节点、贴纸和文字颜色，保留现有路线和 GIF 文件接口。
- [ ] **Step 3: Pass the selected theme through animation spec**，让网页主题和 GIF 主题一致。
- [ ] **Step 4: Generate one sample per theme**，检查 GIF 预览、MP4/GIF下载和旧任务兼容。
- [ ] **Step 5: Run cartoon smoke、TypeScript和动画接口验证**。

### Task 6: 整体验收与回归

**Files:**
- Modify: `scripts/route-page-smoke.mjs`
- Create: `scripts/cartoon-theme-regression.mjs`

- [ ] **Step 1: Run `node scripts/theme-smoke.mjs`、`node scripts/home-page-smoke.mjs`、`node scripts/theme-assets-smoke.mjs` 和 `node scripts/map-motion-cartoon-smoke.mjs`**。
- [ ] **Step 2: Run `./node_modules/.bin/tsc --noEmit`**。
- [ ] **Step 3: Run targeted ESLint on changed TypeScript and script files**。
- [ ] **Step 4: Run `node scripts/route-page-smoke.mjs`**，确认旧路书页面标记仍然存在。
- [ ] **Step 5: 在浏览器验证三套主题切换、城市输入、每日卡点击、Plan B、分享截图、GIF预览和下载**。
- [ ] **Step 6: 修复回归问题并记录最终主题与素材路径**。
