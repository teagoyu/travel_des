# 路书编辑与出行工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有路书页面中加入单日行程编辑、AI 重排提交、每日出行工具和全程状态概览。

**Architecture:** 保留现有 `TripPlan` 和 revisions API 作为事实与版本来源。新增的费用、风险和准备事项全部作为纯函数派生数据；编辑面板只生成 `DayEditDraft`，再转换为现有 revision instruction，不直接修改路线几何数据。PlanView 负责状态和提交，DayDetail 负责单日展示与面板入口，独立组件负责编辑表单和概览卡片。

**Tech Stack:** Next.js 15 App Router, React client components, TypeScript, existing Tailwind utility classes/CSS, existing smoke scripts, ESLint, `tsc`, Next production build.

**Spec:** `docs/superpowers/specs/2026-10-13-roadbook-editing-tools-design.md`

## Global Constraints

- 示例路书保持只读；示例路书编辑操作不得调用 revisions API。
- 编辑输入不直接写入 `DayPlan.legs`，必须转换为现有 revision instruction。
- 所有费用和风险判断必须标明“估算/示意/待核验”，不得呈现为报价或实时导航事实。
- 保留当前主题系统、移动端布局和现有 `showToast` 反馈方式。
- 不新增第三方依赖，不实现自由拖拽地图编辑器、支付或酒店预订。

## Review Focus

- 过去日期或空输入的编辑值：表单应阻止提交并显示字段错误，不生成 revision 请求。测试归 Task 2。
- 示例路书编辑：应显示只读提示且请求计数保持为 0。测试归 Task 3。
- 缺少天气/里程的 DayPlan：工具卡片应显示可理解的待核验状态而不是 NaN 或空白。测试归 Task 1 和 Task 4。
- 反复点击提交：请求进行中应禁用按钮，不能生成重复版本。测试归 Task 3。
- 手机窄屏：编辑面板和概览卡片不得产生横向溢出。测试归 Task 4。

### Task 1: 纯函数出行工具与编辑类型

**Files:**
- Create: `src/lib/tripTools.ts`
- Modify: `src/lib/types.ts`（新增 `DayEditDraft`、`CostRange` 类型）
- Create: `scripts/trip-tools-smoke.mjs`

**Interfaces:**
- Consumes: `DayPlan`、`TripRequest` 的已有字段。
- Produces: `getDayRisk(day): "good" | "buffer" | "risk"`、`estimateDayCosts(day, partySize)`、`getPreparationItems(day)`、`DayEditDraft`。

- [ ] **Step 1: Write the failing smoke test**

  在 `scripts/trip-tools-smoke.mjs` 读取 `src/lib/tripTools.ts` 和 `src/lib/types.ts`，断言存在三个函数名、`DayEditDraft` 和“估算/待核验”相关状态标记；构造无天气、无腿程的最小 DayPlan，断言工具函数不会返回 NaN 或空数组。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/trip-tools-smoke.mjs`

  Expected: FAIL because `src/lib/tripTools.ts` does not exist or the required exports are missing.

- [ ] **Step 3: Implement the types and pure functions**

  在 `src/lib/types.ts` 新增 `CostRange` 与 `DayEditDraft`。在 `src/lib/tripTools.ts` 实现：风险优先检查雨/雪、驾驶时长和 risks；费用按已有里程计算燃油与路费区间，缺少里程时返回 0 区间并附带可由 UI 判断的 estimated 状态；准备事项从天气、驾驶强度、摄影建议和住宿信息生成去重后的中文字符串数组。

- [ ] **Step 4: Run the smoke test and verify it passes**

  Run: `node scripts/trip-tools-smoke.mjs`

  Expected: `Trip tools smoke passed`。

### Task 2: 单日编辑面板

**Files:**
- Create: `src/components/DayEditPanel.tsx`
- Create: `scripts/day-edit-panel-smoke.mjs`
- Modify: `src/components/DayDetail.tsx`（接入编辑面板入口和面板渲染）

**Interfaces:**
- Consumes: `DayPlan`、`DayEditDraft`、`readOnly`、`busy`。
- Produces: `onSubmit(draft: DayEditDraft) => void`、`onClose() => void`。

- [ ] **Step 1: Write the failing component smoke test**

  断言 `DayEditPanel.tsx` 存在出发时间、驾驶上限、住宿城市、停留点列表、上移/下移/删除、添加停留点、提交和关闭按钮；断言 `DayDetail.tsx` 使用 `DayEditPanel`。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/day-edit-panel-smoke.mjs`

  Expected: FAIL because the component and integration do not exist。

- [ ] **Step 3: Implement the controlled edit panel**

  使用现有 `Modal` 视觉和 `showToast` 约定实现客户端组件。初始化 draft 时从 `day` 的 schedule、start/end 和 legs 推导默认值；停留点排序用不可变数组更新；空城市、非法时间、驾驶上限不在 1–12 小时范围时显示错误；`readOnly` 只显示提示并禁用提交；提交时将 draft 原样交给 `onSubmit`。

- [ ] **Step 4: Connect the “调整这一天” action**

  在 `DayDetail` 中新增 `editing` 状态，按钮打开面板，面板提交调用父级提供的回调；保留原有 Plan B 按钮和每日卡片内容。面板关闭后不丢失服务端当前数据。

- [ ] **Step 5: Run the component smoke test and verify it passes**

  Run: `node scripts/day-edit-panel-smoke.mjs`

  Expected: `Day edit panel smoke passed`。

### Task 3: PlanView 的 AI 重排提交与只读保护

**Files:**
- Modify: `src/components/PlanView.tsx`
- Create: `scripts/day-edit-submit-smoke.mjs`

**Interfaces:**
- Consumes: Task 2 `DayEditDraft` and existing `submitRevision` flow。
- Produces: `submitDayEdit(draft: DayEditDraft, targetDay: number)` behavior that sends one existing revisions request and refreshes on success。

- [ ] **Step 1: Write the failing integration smoke test**

  断言 `PlanView.tsx` 有 draft 到自然语言 instruction 的转换、调用 `/api/plans/${plan.id}/revisions`、`baseVersion`、目标 `dayIndex`、提交 busy 状态和 `readOnly` 分支。断言 instruction 包含出发时间、驾驶上限、住宿城市和停留点顺序。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/day-edit-submit-smoke.mjs`

  Expected: FAIL because the draft submit flow is missing。

- [ ] **Step 3: Implement `submitDayEdit`**

  在 `PlanView` 中把 draft 序列化为明确的中文 instruction，调用现有 revisions API，传入 `baseVersion: plan.version` 和 `dayIndex: targetDay + 1`。提交期间禁用编辑面板按钮；409 时刷新版本；成功时关闭面板、显示版本号与 changes；失败时保留面板并提示错误。`readOnly` 只提示不可修改，不发请求。

- [ ] **Step 4: Verify the integration smoke test**

  Run: `node scripts/day-edit-submit-smoke.mjs`

  Expected: `Day edit submit smoke passed`。

### Task 4: 每日出行工具与全程状态概览

**Files:**
- Create: `src/components/DayTravelTools.tsx`
- Create: `src/components/TripHealthSummary.tsx`
- Create: `scripts/trip-tools-ui-smoke.mjs`
- Modify: `src/components/DayDetail.tsx`
- Modify: `src/components/PlanView.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: Task 1 pure functions and current `TripPlan`。
- Produces: Daily risk/cost/preparation UI and clickable whole-trip summary.

- [ ] **Step 1: Write the failing UI smoke test**

  断言两个组件及其关键文案存在：出发判断、费用估算、准备事项、预算、清单完成度、最长驾驶日、天气风险日；断言风险日带可定位的 `data-day-index`。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/trip-tools-ui-smoke.mjs`

  Expected: FAIL because the new UI components do not exist。

- [ ] **Step 3: Implement daily tools**

  `DayTravelTools` 使用 Task 1 的派生值，按 good/buffer/risk 显示主题色和清晰中文文案；费用分为油费、过路费、当日合计；准备事项最多展示 4 条并提供“估算/待核验”说明。

- [ ] **Step 4: Implement trip health summary**

  `TripHealthSummary` 从 `TripPlan` 计算预算区间、清单完成度、最长驾驶日和风险日。风险日按钮点击后通过 `document.getElementById("day-detail-${dayIndex}")?.scrollIntoView({ behavior: "smooth" })` 定位，并更新当前选中日（由 PlanView 传入 callback）。

- [ ] **Step 5: Integrate and style the tools**

  在 `DayDetail` 的天气区之后加入 `DayTravelTools`；在 PlanView 侧栏合适位置加入 `TripHealthSummary`。CSS 沿用三套旅行主题变量，窄屏改为单列，所有卡片设置 `min-width: 0` 防止横向溢出。

- [ ] **Step 6: Run the UI smoke test**

  Run: `node scripts/trip-tools-ui-smoke.mjs`

  Expected: `Trip tools UI smoke passed`。

### Task 5: 全量验证与回归

**Files:**
- Modify: `scripts/route-readability-smoke.mjs` only if selectors need stable test hooks。

- [ ] **Step 1: Run all smoke tests**

  Run: `for f in scripts/*smoke.mjs; do node "$f" || exit 1; done`

  Expected: every smoke script passes。

- [ ] **Step 2: Run static checks**

  Run: `npx tsc --noEmit && npm run lint && git diff --check`

  Expected: no TypeScript errors, no ESLint errors/warnings, no whitespace errors。

- [ ] **Step 3: Run the production build**

  Run: `npm run build`

  Expected: Next.js production build completes successfully。

- [ ] **Step 4: Browser verify the primary flow**

  Open `http://127.0.0.1:43130/`, create/open a real plan, open a day editor, reorder a stop, submit, observe the revision toast, inspect daily tools, click a risk day, and verify the example plan remains read-only.
