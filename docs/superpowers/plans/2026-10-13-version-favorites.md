# 路书版本管理与推荐收藏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为真实路书增加可审计的版本历史/回退能力，以及按天收藏景点和美食并带入 AI 重排。

**Architecture:** 版本继续使用现有 `plan_versions` 完整 JSON 存档；新增版本查询、结构化对比和“复制旧版本为新版本”的服务端 API。推荐收藏单独存储为带来源快照的 `saved_recommendations` 表，PlanView 通过客户端状态展示，AI 编辑提交时读取当前日期收藏并追加到已有 revision instruction。

**Tech Stack:** Next.js 15 App Router, React client components, TypeScript, node:sqlite, existing session/db/api/revisions patterns, existing smoke scripts, ESLint, `tsc`, Next production build.

**Spec:** `docs/superpowers/specs/2026-10-13-version-favorites-design.md`

## Global Constraints

- 不删除历史版本，不直接把 `plans.current_version` 指针倒退到旧版本。
- 回退必须创建新的递增版本，并保留目标版本的行程内容。
- 所有版本和收藏写接口必须校验当前 session 与 plan 归属。
- 示例路书写按钮禁用，不调用 POST/DELETE 接口。
- 推荐快照保留 `SourceRef`，没有来源或实时核验的数据必须显示“待核验/估算”。
- 不新增第三方依赖，不修改已核验路线几何数据的事实来源。

## Review Focus

- 目标版本不存在：回退应返回明确 404，不改变当前版本。测试归 Task 2。
- baseVersion 过期：回退应返回 409，不覆盖其他更新。测试归 Task 2。
- 示例路书收藏/回退：按钮禁用且请求不发出。测试归 Task 4。
- 重复收藏同一推荐：应幂等，不出现重复卡片。测试归 Task 3。
- 推荐接口异常：收藏区应回滚或显示错误，不能清空已有收藏。测试归 Task 4。

### Task 1: 版本与收藏数据层类型、SQLite 存储函数

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db.ts`（新增 `plan_version_meta` 与 `saved_recommendations` migration）
- Create: `scripts/version-favorites-db-smoke.mjs`

**Interfaces:**
- Consumes: `TripPlan`、`Recommendation`、当前 session 数据。
- Produces: `PlanVersionMeta`、`PlanVersionDiff`、`SavedRecommendation` 类型及版本/收藏 CRUD 函数。

- [ ] **Step 1: Write the failing smoke test**

  断言类型文件包含版本元数据、版本差异和收藏快照类型；断言 db 文件包含 `saved_recommendations` 建表、版本列表/回退所需函数和收藏增删查函数。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/version-favorites-db-smoke.mjs`

  Expected: FAIL because the new types, table and functions do not exist。

- [ ] **Step 3: Implement the data contracts and persistence helpers**

  在 `types.ts` 新增 `PlanVersionMeta`、`PlanVersionDiff`、`SavedRecommendation`。在 `db.ts` migration 中创建 `plan_version_meta` 和 `saved_recommendations`；版本元数据按 `plan_id + version` 唯一约束，收藏按 `plan_id + day_index + recommendation_id` 唯一约束。更新 `insertVersion` 的可选 summary 参数，并实现 `listPlanVersions`、`getVersionDiffInputs`、`createRollbackVersion` 所需的基础读取/写入函数，以及 `listSavedRecommendations`、`saveRecommendation`、`removeSavedRecommendation`。写入使用现有 session 归属在 route 层完成，DB 函数保持纯数据操作。

- [ ] **Step 4: Run the smoke test and verify it passes**

  Run: `node scripts/version-favorites-db-smoke.mjs`

  Expected: `Version favorites DB smoke passed`。

### Task 2: 版本历史、对比和回退 API

**Files:**
- Create: `src/app/api/plans/[id]/versions/route.ts`
- Create: `src/app/api/plans/[id]/versions/compare/route.ts`
- Create: `src/app/api/plans/[id]/versions/rollback/route.ts`
- Modify: `src/lib/schemas.ts`
- Create: `scripts/version-api-smoke.mjs`

**Interfaces:**
- Consumes: Task 1 DB helpers and existing `getSessionId`/`jsonError` patterns。
- Produces: `GET /versions`、`GET /versions/compare?from=&to=`、`POST /versions/rollback`。

- [ ] **Step 1: Write the failing API smoke test**

  断言三个 route 文件、版本参数 schema、409/404 错误码、`baseVersion` 校验和“新版本号递增”逻辑存在。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/version-api-smoke.mjs`

  Expected: FAIL because the version API routes do not exist。

- [ ] **Step 3: Implement version listing and comparison**

  `GET /versions` 只返回当前 session 所有权下的版本号、时间、是否当前版本和变更摘要。`GET /compare` 加载两个版本，按天比较标题、start/end、驾驶分钟和 schedule 标题，返回新增/调整/移除结构化差异；版本或参数无效返回 400/404。

- [ ] **Step 4: Implement safe rollback**

  `POST /rollback` 校验 `targetVersion` 和 `baseVersion`；baseVersion 不等于当前版本返回 409；目标版本不存在返回 404。复制目标 `TripPlan`，设置新版本号为当前最大版本 + 1，更新 `createdAt`，写入变化摘要，插入新版本并前移 current pointer。任何异常不得改变 pointer。

- [ ] **Step 5: Run the API smoke test and verify it passes**

  Run: `node scripts/version-api-smoke.mjs`

  Expected: `Version API smoke passed`。

### Task 3: 收藏推荐 API 与推荐卡片操作

**Files:**
- Create: `src/app/api/plans/[id]/saved-recommendations/route.ts`
- Create: `src/app/api/plans/[id]/saved-recommendations/[recommendationId]/route.ts`
- Modify: `src/components/Recommendations.tsx`
- Modify: `src/components/RecommendationRail.tsx`
- Create: `scripts/saved-recommendations-smoke.mjs`

**Interfaces:**
- Consumes: `SavedRecommendation` persistence and current selected day。
- Produces: GET/POST/DELETE saved recommendation behavior and an `onSave(dayIndex, recommendation)` callback from recommendation UI。

- [ ] **Step 1: Write the failing component/API smoke test**

  断言 route 文件存在 GET/POST/DELETE；推荐卡片存在“加入当天”“已加入当天”“移除收藏”文案和 `readOnly` 分支。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/saved-recommendations-smoke.mjs`

  Expected: FAIL because the saved recommendation routes and actions do not exist。

- [ ] **Step 3: Implement the saved recommendation routes**

  GET 支持 `day` 查询，POST 保存推荐的名称、类型、地址、图片、导航地址和完整 source JSON；重复主键返回当前记录或 200 幂等结果；DELETE 按 plan、day 和 recommendationId 删除。所有 route 做 session 归属检查并在示例路书前端不调用写接口。

- [ ] **Step 4: Add optimistic recommendation actions**

  在推荐卡片增加保存/移除按钮，使用当前选中天，成功后 toast；失败时恢复原状态。按钮在 `readOnly` 时禁用并显示“示例路书仅供浏览”。

- [ ] **Step 5: Run the smoke test and verify it passes**

  Run: `node scripts/saved-recommendations-smoke.mjs`

  Expected: `Saved recommendations smoke passed`。

### Task 4: 版本历史 UI、每日收藏区和 AI 上下文

**Files:**
- Create: `src/components/VersionHistoryPanel.tsx`
- Create: `src/components/SavedRecommendations.tsx`
- Modify: `src/components/PlanView.tsx`
- Modify: `src/components/DayDetail.tsx`
- Modify: `src/app/globals.css`
- Create: `scripts/version-favorites-ui-smoke.mjs`

**Interfaces:**
- Consumes: Tasks 2–3 APIs and `DayEditDraft` submit flow。
- Produces: top-level version entry, comparison/rollback modal, daily saved recommendation section, and revision instruction enriched with saved items。

- [ ] **Step 1: Write the failing UI smoke test**

  断言版本入口、对比/回退文案、收藏区、移除按钮和 `savedRecommendations` instruction 拼接逻辑存在；断言 `readOnly` 传递到两个新组件。

- [ ] **Step 2: Run the smoke test and verify it fails**

  Run: `node scripts/version-favorites-ui-smoke.mjs`

  Expected: FAIL because the panels and integrations do not exist。

- [ ] **Step 3: Implement version history panel**

  打开面板后请求版本列表；选择版本请求 compare；展示当前版本和目标版本的每日差异；回退前使用现有 Modal 做确认，成功后显示新版本并 `router.refresh()`；readOnly 时按钮禁用。

- [ ] **Step 4: Implement saved recommendation section**

  每日卡片展示当前 day 的收藏，最多 6 条，支持移除；加载失败保留已有本地状态并 toast；移动端单列；推荐来源和待核验状态可见。

- [ ] **Step 5: Enrich AI revision instruction**

  `submitDayEdit` 读取当前 selectedDay 的收藏，将名称和类型追加到 instruction，明确要求优先保留并解释冲突；没有收藏时保持现有 instruction 不变。

- [ ] **Step 6: Run the UI smoke test and verify it passes**

  Run: `node scripts/version-favorites-ui-smoke.mjs`

  Expected: `Version favorites UI smoke passed`。

### Task 5: 全量验证与浏览器回归

**Files:**
- Modify: smoke scripts only if stable selectors are needed。

- [ ] **Step 1: Run all smoke tests**

  Run: `for f in scripts/*smoke.mjs; do node "$f" || exit 1; done`

  Expected: every smoke script passes。

- [ ] **Step 2: Run static checks and build**

  Run: `npx tsc --noEmit && npm run lint && git diff --check && npm run build`

  Expected: all checks and production build pass。

- [ ] **Step 3: Browser verify the primary flows**

  Open a real plan, create a revision, inspect version history and compare, roll back to an earlier version, open recommendations, add one to a day, refresh, remove it, and confirm its name appears in the next AI edit instruction. Open the sample plan and verify all write controls remain disabled.
