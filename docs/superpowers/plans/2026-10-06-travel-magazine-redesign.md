# 旅行杂志式路书页面改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将路书详情页从多面板仪表盘调整为旅行杂志式长页，同时保留现有交互和数据功能。

**Architecture:** 继续使用现有 Next.js 客户端组件，不改数据契约。通过 `PlanView` 调整页面骨架，通过 `DayDetail` 和 `RecommendationRail` 降低卡片密度，统一在 `globals.css` 增加编辑型布局样式。

**Tech Stack:** Next.js 15、React、TypeScript、Tailwind utility classes、现有 CSS variables。

**Spec:** `docs/superpowers/specs/2026-10-06-travel-magazine-redesign.md`

## Global Constraints

- 保留现有功能：高德核验、分享截图、复制文案、每日调整、Plan B、天气、住宿、清单和只读分享。
- 暂不新增或生成图片素材；继续复用现有资源。
- SVG 路线图继续作为示意路线，不引入真实地图底图。
- 移动端仍需单列显示，按钮保持可点击和可见焦点。

## Review Focus

- 长标题和长城市名不应撑破每日卡片。
- 没有天气、酒店或推荐数据时仍保持稳定布局。
- 点击日期导航只滚动，不触发父级卡片的错误交互。
- 只读路书仍显示正确的不可编辑状态。
- 移动端侧栏内容顺序与桌面端一致。

### Task 1: 路书页面骨架

**Files:**
- Modify: `src/components/PlanView.tsx`
- Modify: `src/app/globals.css`

- [ ] 将每日区增加紧凑的日期导航，并让导航点击滚动到对应 `day-detail-*`。
- [ ] 将主栏与侧栏间距、背景层和底部模块改成长页布局，保留所有现有按钮和回调。
- [ ] TypeScript 检查：`./node_modules/.bin/tsc --noEmit`。

### Task 2: 每日行程阅读卡

**Files:**
- Modify: `src/components/DayDetail.tsx`
- Modify: `src/app/globals.css`

- [ ] 减弱每日卡片的完整边框和阴影，增加日期编号、路线标题、天气和时间轴的层级。
- [ ] 保留调整、导航、住宿、Plan B 和预算信息。
- [ ] 处理空数据和长文本，确保不影响布局。

### Task 3: 侧栏信息收敛

**Files:**
- Modify: `src/components/RecommendationRail.tsx`
- Modify: `src/app/globals.css`

- [ ] 将每日风景导航做成紧凑目录，保留小图和滚动联动。
- [ ] 降低沿途推荐、住宿块的视觉重量，避免侧栏与每日主内容竞争。
- [ ] 在无推荐数据时保持稳定占位。

### Task 4: 验证和打开页面

**Files:**
- No source changes.

- [ ] 运行 `./node_modules/.bin/tsc --noEmit`。
- [ ] 运行 `git diff --check`。
- [ ] 打开 `http://127.0.0.1:43130/plans/plan-muvdfhk6-9xsc47`，确认首屏、日期导航和侧栏结构正常。
