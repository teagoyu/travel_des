# 旅行杂志式路书 V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将路书详情页真正改造成已确认设计稿中的“沉浸式 Hero + SVG 路线主视觉 + 单日阅读工作台”，同时保留现有路线核验、天气、住宿、Plan B、分享和清单能力。

**Architecture:** 保持现有 Next.js 页面和数据流不变，主要重构详情页展示层。TripHero、RouteOverview、PlanView 的布局类名与结构负责新的杂志视觉，现有 DayDetail、RecommendationRail、Checklist、ShareCard 等业务组件继续复用，通过轻量 CSS 降低面板感；路线仍使用 SVG 示意，不接入真实地图底图。

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, scoped CSS, existing `html-to-image` sharing flow.

**Spec:** `docs/superpowers/specs/2026-10-06-travel-magazine-redesign.md`

## Global Constraints

- 保留现有功能：高德核验、分享截图、复制文案、每日调整、Plan B、天气、住宿、清单和只读分享。
- 暂不新增或生成图片素材；继续复用现有资源。
- SVG 路线图继续作为示意路线，不引入真实地图底图。
- 移动端仍需单列显示，按钮保持可点击和可见焦点。
- 不重置、覆盖或删除用户现有未提交文件。

## Review Focus

- 只读示例路书：所有可浏览内容仍显示，编辑动作继续给出只读提示。
- 返程路线：返程虚线、起点去重和节点颜色不能被新布局破坏。
- 日期切换：切换日期时主日程、右侧风景/住宿信息和调整目标保持同步。
- 移动端：Hero、路线 SVG、日期导航和右侧信息不能横向溢出或遮挡操作。
- 分享截图：新的装饰背景不能导致 `html-to-image` 生成空白或截断核心内容。

### Task 1: Editorial Hero and page surface

**Files:**
- Modify: `src/components/TripHero.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `TripPlan` and `TripHero` callbacks/links.
- Produces: `travel-editorial-hero` visual surface consumed by `PlanView`.

- [ ] Add a failing smoke assertion or browser check that the route page exposes the existing hero title, origin/destination summary, and share/reading links.
- [ ] Implement the large editorial hero from the approved design: dark green mountain treatment, serif title, gold kicker, compact metadata, and transparent utility actions.
- [ ] Preserve existing links and text semantics; decorative layers must be pointer-transparent.
- [ ] Verify the route page loads and all hero controls remain visible and keyboard-focusable.

### Task 2: Route story and daily reading workbench

**Files:**
- Modify: `src/components/RouteOverview.tsx`
- Modify: `src/components/PlanView.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `TripPlan.days`, route colors, return-trip handling, and `DayDetail` callbacks.
- Produces: the route story SVG, compact day chapter navigation, and single-day reading layout.

- [ ] Add a failing browser assertion that clicking a day changes the visible `day-detail-*` content while retaining the adjustment and Plan B buttons.
- [ ] Reshape RouteOverview into the approved route-story composition without changing its data calculation or return-trip semantics.
- [ ] Keep SVG labels tied to real plan stops and retain the existing latitude markers, color conventions, and return dotted path.
- [ ] Keep only the selected day rendered in the main reading column and keep `RecommendationRail` synchronized with `selectedDay`.
- [ ] Verify DAY 01 and a middle day render correctly, including long city names and missing geometry/coordinates.

### Task 3: Rail, footer, responsive behavior, and regression verification

**Files:**
- Modify: `src/components/RecommendationRail.tsx`
- Modify: `src/app/globals.css`
- Test/verify: existing route page at `/plans/plan-muvdfhk6-9xsc47#daily`

**Interfaces:**
- Consumes: existing recommendation, hotel, weather, checklist, share, and source components.
- Produces: lightweight editorial side rail and lower-priority utility sections.

- [ ] Add a failing smoke check for weather, hotel, Plan B, share screenshot, checklist, and read-only state.
- [ ] Remove heavy nested panel treatment from the side rail while keeping each action and data source visible.
- [ ] Add responsive rules for the desktop three-column workbench, tablet stacked rail, and mobile horizontal day navigation.
- [ ] Run TypeScript and lint checks; inspect the route page in a browser at desktop and mobile widths.
- [ ] Verify share screenshot generation still produces a non-empty image after the new surface styles.

