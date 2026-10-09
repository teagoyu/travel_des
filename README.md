# 山海之间 · AI 自驾路书（正式版）

基于 `../index.html` 交互原型与 `../IMPLEMENTATION_PLAN.md` 实施方案开发的正式产品。
当前进度：**阶段 A（前端与数据契约）+ 阶段 B（计划保存与任务流）已完成**；
高德地图 MCP 已接入（阶段 C 数据源就绪）；阶段 C–E 待开发。

## 运行

```bash
pnpm install
pnpm dev          # http://127.0.0.1:43130（或 next 默认 3000）
pnpm build && pnpm start
pnpm lint         # ESLint
pnpm exec tsc --noEmit   # 类型检查
```

数据存储：`node:sqlite` 单文件数据库，位于 `.data/roadbook.db`（可用 `ROADBOOK_DATA_DIR` 覆盖）。

## 页面与 API

| 路由 | 说明 | 阶段 |
|---|---|---|
| `/` | 创建路书：主视觉 + 表单（校验、兴趣标签） | A 完成 |
| `/plans/new?job=...` | 生成过程：轮询任务状态，刷新自动恢复 | B 完成 |
| `/plans/sample-chuanxi-2026` | 公开示例路书（fixture 驱动） | A 完成 |
| `/plans/:id` | 用户路书详情（会话归属校验） | B 完成 |
| `/s/:token` | 只读分享页 | B 占位 / E 完善 |
| `POST /api/plans` | 创建生成任务（202 + jobId） | B 完成 |
| `GET /api/jobs/:jobId` | 任务状态（仅创建会话可查） | B 完成 |
| `GET /api/plans/:id` | 读取当前版本路书 | B 完成 |
| `POST /api/plans/:id/revisions` | 修订（409 冲突检测） | B 完成 |
| `POST /api/plans/:id/share` | 创建只读链接 | B 完成 |
| `DELETE /api/plans/:id/share/:token` | 撤销链接 | B 完成 |
| `PATCH /api/plans/:id/checklist/:itemId` | 待办勾选持久化 | B 完成 |
| `GET /api/shared/:token` | 公开字段投影（410 过期/撤销） | B 完成 |

## 结构

```
src/
  lib/
    types.ts        # TripRequest / TripPlan / RouteLeg / SourceRef…（方案 §6 契约）
    schemas.ts      # zod 运行时校验（API 入参 + 阶段 C AI 输出复用）
    db.ts           # node:sqlite 存储层（sessions/plans/versions/jobs/checklist/share_tokens）
    session.ts      # 匿名会话（httpOnly cookie + sha256 存储）
    jobEngine.ts    # 生成任务引擎（惰性状态推进，刷新恢复）
    fixtureFactory.ts # 按请求生成示例路书（阶段 C 替换为 AI+地图）
    shareView.ts    # 公开字段投影
    fixtures.ts     # 阶段 A 川西示例（唯一包含示意数值的静态文件）
    tripForm.ts     # 表单校验与 TripRequest 转换
  components/       # TopBar / HomeHero / TripHero / CreateTripForm / RouteOverview
                    # DayTabs / DayDetail / BudgetPanel / Checklist / TripSummary
                    # DataSources / ShareCard / Modal / Toast / GeneratingView / PlanView
  app/
    page.tsx                # /
    plans/new/page.tsx      # /plans/new（轮询恢复）
    plans/[id]/page.tsx     # /plans/:id（会话校验）
    plans/error-demo/       # 错误态演示
    s/[token]/page.tsx      # /s/:token
    api/plans|jobs|shared/  # 8 个 API 路由
    not-found.tsx           # 404 空状态
```

## 阶段 A 验收结果（2026-09-24）

- 360 / 768 / 1440px 三档宽度，首页、路书详情、生成页均无横向溢出（Puppeteer 断言 9/9）。
- 键盘：日期条 roving tabindex + ←/→ 切换；弹窗 Esc 关闭；校验失败自动聚焦首个错误字段。
- 可读性：`tablist/tab/tabpanel`、`label[for]`×8、`aria-pressed` 兴趣标签齐备；`role=status` 播报 toast。
- 表单校验：空输入、日期过期、天数/人数越界、出发地=目的地均有错误提示且不跳转。
- 空状态：未知路书 id 返回 404 页面；生成失败态不展示任何编造数值。
- `pnpm build` 通过；`tsc --noEmit` 与 ESLint 0 错误。

## 阶段 B 验收结果（2026-09-24，Puppeteer 16/16 通过）

- 刷新生成页不丢任务：jobId 在 URL 中，轮询从数据库恢复进度，完成后自动进入详情。
- 编辑旧版本返回 409（VERSION_CONFLICT + currentVersion）。
- 另一会话（隔离 browser context）访问原计划/任务返回 403，修改返回 403。
- 待办勾选 PATCH 持久化，刷新后保留；失败回滚并提示。
- 只读链接：公开视图可读且不含 request/checklist 等私有字段；撤销后 410 SHARE_REVOKED。
- 非法输入返回 422 + 字段级错误文案。
- `pnpm build` 通过（15 条路由）；`tsc --noEmit` 与 ESLint 0 错误。

## 数据边界（重要）

示例路书与生成结果中的里程、费用、时间均为**示意数据**：静态示例在
`src/lib/fixtures.ts`，按请求生成的示例在 `src/lib/fixtureFactory.ts`，
来源状态一律标记 `estimated` / `needs_check`，页面明确标注"示意/演示"。
阶段 C 接入高德地图（MCP 已配置）与 AI 后，由 `routing` / `facts` 模块
回填真实数据并标注来源与更新时间。

## 高德地图 MCP（已接入）

- Server：`@amap/amap-maps-mcp-server`，安装于 `~/.dsh-mcp/amap-maps/`
- 注册：DSH profile `cordis.patch.yml`（serverName: amap-maps，stdio + 自动重连）
- 工具：`mcp__amap-maps__maps_geo / maps_text_search / maps_direction_driving / maps_weather / maps_distance / maps_around_search` 等 12 个
- Key 已验证（真实地理编码 + 天气查询通过）；重启 DSH 后工具自动注册进会话

## 后续阶段

- **C**：地名解析（maps_geo + 歧义确认）、AI 路线骨架、地图逐段算路（maps_direction_driving），替换示意里程与示意 SVG。
- **D**：天气（maps_weather）/ 日出日落 / 预算计算，逐项标注来源与获取时间。
- **E**：自然语言改行程（revisions 升级为 AI）、版本对比、分享页 `/s/:token` 完整渲染、上线前 3 条手工场景。

# travel_des
