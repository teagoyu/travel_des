# 山海之间 · AI 自驾路书（正式版）

基于 [`../index.html`](../index.html) 交互原型与 [`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md) 实施方案开发的正式产品。

当前状态：**阶段 A–E 的主要能力均已落地**（创建、生成、阅读、编辑、版本、收藏、分享、路线动画），处于“可演示、待打磨”阶段。示例路书仍是固定 Fixture；真实路线、天气、酒店依赖外部 API Key。

## 运行

要求 Node.js **≥ 22.5**（使用内置 `node:sqlite`），推荐 Node 24。

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm build && pnpm start  # 生产模式，默认 3000 端口
pnpm lint                 # ESLint
pnpm exec tsc --noEmit    # 类型检查
```

数据存储：`node:sqlite` 单文件数据库 `.data/roadbook.db`，可用 `ROADBOOK_DATA_DIR` 覆盖目录。删除 `.data/roadbook.db*` 后重启服务会自动重建空库。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写；缺少某个 Key 时对应能力会自动降级，不会阻断基础路书。

| 变量 | 必填 | 用途 |
|---|---|---|
| `AMAP_API_KEY` | 是 | 高德 Web 服务：地理编码、POI、驾车算路、天气、输入联想、风景图 |
| `DEEPSEEK_API_KEY` | 是 | 每日落脚点规划、路书文案、自然语言改行程 |
| `DEEPSEEK_MODEL` | 否 | 默认 `deepseek-chat` |
| `QWEATHER_API_KEY` | 否 | 和风天气 10 天预报，补足高德仅 2 天的预报范围 |
| `FLYAI_API_KEY` | 否 | FlyAI / 飞猪酒店查询 |
| `ROADBOOK_DATA_DIR` | 否 | SQLite 数据目录，默认 `.data` |

> `NEXT_PUBLIC_AMAP_JS_KEY` 在当前代码中未使用；页面上的路线示意图是服务端按经纬度绘制的 SVG，不依赖高德 JS SDK。

## 主要功能

1. **创建路书**：出发地/目的地（高德实时候选）、日期、天数、往返/单程、人数、节奏、住宿偏好、预算、兴趣标签；完整表单校验与错误聚焦。
2. **3 套手账主题**：童趣冒险 / 侦探探索 / 幻想旅行，`?theme=` 持久化，首页、路书、分享图共用同一套色板与插画。
3. **异步生成**：`queued → planning → verifying → writing → complete`，jobId 在 URL 中，刷新可恢复；失败给出可读错误码。
4. **生成管线**：Fixture 骨架 → DeepSeek 规划每日落脚点 → 高德地理编码/逐段驾车/天气 → POI 与摄影机位 → FlyAI 酒店 → DeepSeek 撰写文案 → 逐日驾驶上限校验 → 落库 v1。
5. **路书阅读**：封面摘要、SVG 路线总览（纬度示意 + 去程/返程分色 + 每日时间轴）、每日章节导航、天气、时间轴、摄影建议、住宿、风险、Plan B、当日费用、预算拆分、出发清单、数据来源。
6. **编辑与版本**：单日编辑面板（出发时间/驾驶上限/住宿城市/停留点排序）→ 转成 revision 指令；自然语言改行程；“增加中途住宿”可把返程拆成两天；409 版本冲突检测；版本列表、结构化对比、回退生成递增新版本。
7. **收藏**：按天收藏景点/美食（保留来源快照），提交 AI 重排时自动作为固定偏好带入。
8. **分享与导出**：只读分享令牌（可撤销/过期、公开字段投影）、分享截图 PNG、小红书长图 SVG、分享文案复制。
9. **路线动画**：后台调用本机 `map-motion` skill 渲染 MP4/GIF，前端轮询进度、预览与下载。
10. **可信度标注**：`verified` / `estimated` / `needs_check` 贯穿全站；示例与估算数据不会被展示为实时事实。

## 页面

| 路由 | 说明 |
|---|---|
| `/` | 创建路书：主视觉、主题切换、表单 |
| `/plans/new?job=...` | 生成过程：轮询任务状态，刷新恢复 |
| `/plans/:id` | 路书详情（会话归属校验） |
| `/plans/sample-chuanxi-2026` | 公开示例路书（Fixture，只读） |
| `/plans/error-demo` | 生成失败态演示 |
| `/s/:token` | 只读分享页（公开字段投影） |

## API（20 条路由）

| 方法与路径 | 说明 |
|---|---|
| `POST /api/plans` | 校验 TripRequest，创建生成任务（202 + jobId） |
| `GET /api/plans/:id` | 读取当前版本路书 |
| `GET /api/jobs/:jobId` | 任务状态（仅创建会话可查，惰性推进） |
| `POST /api/plans/:id/refresh` | 重新核验高德事实并生成新版本（不重写 AI 文案） |
| `POST /api/plans/:id/revisions` | 修订指定日期（409 冲突检测） |
| `GET /api/plans/:id/versions` | 版本列表与变更摘要 |
| `GET /api/plans/:id/versions/compare` | 结构化版本对比 |
| `POST /api/plans/:id/versions/rollback` | 回退并生成递增新版本 |
| `GET/POST /api/plans/:id/saved-recommendations` | 按天读取/新增收藏 |
| `DELETE /api/plans/:id/saved-recommendations/:id` | 移除收藏 |
| `GET /api/plans/:id/recommendations` | 当日景点/美食推荐（高德 POI） |
| `PATCH /api/plans/:id/checklist/:itemId` | 待办勾选持久化 |
| `POST /api/plans/:id/share` | 创建只读分享链接 |
| `DELETE /api/plans/:id/share/:token` | 撤销分享链接 |
| `GET /api/shared/:token` | 公开字段投影（410 过期/撤销） |
| `GET/POST /api/plans/:id/animation` | 查询/创建路线动画任务 |
| `GET /api/plan-animations/:jobId` | 动画任务状态 |
| `GET /api/plan-animations/:jobId/file` | 下载 MP4/GIF |
| `GET /api/amap/places` | 地名输入联想代理 |
| `GET /api/amap/scenery` | 城市风景图代理（带内存缓存） |

## 结构

```
src/
  lib/
    types.ts          # TripRequest / TripPlan / RouteLeg / SourceRef…（方案 §6 契约）
    schemas.ts        # zod 运行时校验（API 入参 + AI 输出）
    db.ts             # node:sqlite：sessions/plans/versions/meta/jobs/checklist/share/saved
    session.ts        # 匿名会话（httpOnly cookie + sha256）
    jobEngine.ts      # 生成任务引擎（惰性状态推进、刷新恢复）
    deepseek.ts       # 落脚点规划、文案撰写、自然语言修订
    amap.ts           # 地理编码、驾车算路、天气、POI、逐日校验
    flyai.ts          # 飞猪酒店查询（CLI）
    mapMotion.ts      # 路线动画任务（map-motion + ffmpeg）
    fixtures.ts       # 公开示例路书（唯一包含固定示意数值的静态文件）
    fixtureFactory.ts # 按请求生成结构化骨架
    tripForm.ts       # 表单校验与选项
    tripTools.ts      # 出发风险、费用估算、准备事项（纯函数）
    theme.ts          # 三套旅行主题 token
    shareView.ts      # 公开字段投影
    dayTheme.ts       # 每日视觉主题
  components/         # PlanView / DayDetail / RouteOverview / CreateTripForm / …
  app/
    page.tsx                  # /
    plans/new/page.tsx        # /plans/new
    plans/[id]/page.tsx       # /plans/:id
    plans/error-demo/         # 失败态演示
    s/[token]/page.tsx        # /s/:token
    api/…                     # 20 条路由
    not-found.tsx             # 404 空状态
scripts/                      # 25 个源码级 smoke 检查（见下）
```

## 数据边界（重要）

- `src/lib/fixtures.ts` 是公开示例，数值固定且标注为示意；`fixtureFactory.ts` 只生成结构骨架，不伪造地图、费用与天气。
- 真实生成时，里程与耗时来自高德驾车算路，天气标注来源（高德/和风）与获取时间，酒店来自 FlyAI。
- 逐日校验超过驾驶上限时，该日 `SourceRef.status` 置为 `needs_check` 并写入风险说明；不展示模型编造的距离或时间。
- 分享视图只投影公开字段，不包含 `request`、`checklist`、编辑权限与内部错误。

## 已知限制

- **没有自动化测试框架**：`scripts/*.mjs` 是对源码文本/文件的 smoke 断言，且未挂进 `package.json`；没有 Playwright/Jest。手工验证过 `tsc`、`build` 与主要页面。
- **路线动画依赖本机环境**：需要 `~/.claude/skills/map-motion` 与 ffmpeg，产物写到 `~/.shanhai-roadbook/map-motion`，CI/换机环境不可用。
- **匿名会话**：清理 Cookie 会失去编辑权；暂无登录与多端同步。
- **单文件 SQLite**：并发页面数据收集时偶发 `database is locked`（本项目构建中观测到一次，重试即恢复）；规模化需迁移 PostgreSQL。
- **尚未实现**：真实日出/日落计算、可选单价调整的预算模型、多人协作、酒店/门票下单。

## 验证记录

2026-11-04 复核：`pnpm exec tsc --noEmit` 0 错误；`pnpm build` 通过（5 个页面 + 20 条 API）；生产模式 `/`、`/plans/sample-chuanxi-2026` 返回 200。
