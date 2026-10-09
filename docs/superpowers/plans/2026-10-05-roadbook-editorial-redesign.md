# 路书杂志化视觉升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有路书详情页改造成设计稿中的沉浸式旅行杂志布局，同时保持现有功能和数据接口不变。

**Architecture:** 以 `PlanView` 作为页面编排层，新增/拆分封面和推荐侧栏展示组件；`RouteOverview`、`DayDetail`、`Recommendations` 保持数据接口不变，只调整展示结构和样式。图片继续由推荐数据或本地主题图提供。

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, 现有 SVG 路线组件。

**Spec:** `docs/superpowers/specs/2026-10-05-roadbook-editorial-redesign.md`

## Global Constraints

- 不使用真实地图瓦片；路线概览继续使用 SVG 示意路线。
- 不删除或改变现有 AI、高德、天气、住宿、分享、清单接口。
- 去程青绿色、返程蓝紫色、住宿/落脚点浅灰色。
- 图片缺失时使用本地主题图兜底，不显示空白图片区域。

## Review Focus

- 示例只读路书：必须仍显示景点主题图和现有分享入口。
- 返程路线：颜色和虚线语义不能被每日卡片样式覆盖。
- 无天气/无酒店/无推荐数据：布局不能塌陷，必须显示可理解的空状态。
- 移动端窄屏：主栏和推荐侧栏必须纵向排列，不能横向溢出。
- 浏览器翻译插件：根布局不能产生 hydration mismatch。

### Task 1: Page shell and travel cover

**Files:**
- Modify: `src/components/PlanView.tsx`
- Modify: `src/components/TripHero.tsx`
- Modify: `src/app/globals.css`

- [ ] Write/adjust a focused render check for the cover title, route summary, and action buttons.
- [ ] Implement the editorial cover layout with theme image, title block, trip stats, and preserved action controls.
- [ ] Add responsive styles and background texture without changing data contracts.
- [ ] Run `./node_modules/.bin/tsc --noEmit`.

### Task 2: Route overview and daily card composition

**Files:**
- Modify: `src/components/RouteOverview.tsx`
- Modify: `src/components/DayDetail.tsx`
- Modify: `src/components/DayTabs.tsx`

- [ ] Verify route legend and node color behavior for outbound, return, and stay points.
- [ ] Restyle the SVG overview as a prominent editorial section with clear spacing.
- [ ] Compose each day as an image-led card with route heading, weather/drive stats, and timeline entry point.
- [ ] Keep existing day selection and detail interactions intact.
- [ ] Run TypeScript and inspect the page at desktop and narrow width.

### Task 3: Recommendation rail and image states

**Files:**
- Modify: `src/components/Recommendations.tsx`
- Modify: `src/lib/amap.ts`

- [ ] Verify attraction recommendations expose `imageUrl` and read-only fallback data.
- [ ] Implement the three recommendation rail cards: scenic stop, local food, and stay.
- [ ] Preserve navigation/booking links and no-result states.
- [ ] Run TypeScript and verify that image URLs fall back to local themes.

### Task 4: Responsive and regression verification

**Files:**
- Modify: `src/app/globals.css` if needed

- [ ] Check desktop hierarchy: cover → route → daily cards → recommendation rail.
- [ ] Check mobile stacking and horizontal overflow.
- [ ] Check existing share, refresh, checklist, recommendation tabs, and navigation actions remain available.
- [ ] Run `./node_modules/.bin/tsc --noEmit` and inspect the running page.
