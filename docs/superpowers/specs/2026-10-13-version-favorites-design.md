# 路书版本管理与推荐收藏设计规格

## 目标

让用户可以安全查看路书历史、比较版本并回退，同时把沿途景点和美食加入指定日期，作为后续 AI 重排的明确偏好。

## 范围与非目标

### 本期范围

1. 版本历史：列出版本号、创建时间、变更摘要和当前版本标识。
2. 版本对比：对选定版本和当前版本展示标题、天数、每日落脚点、驾驶时长和停留点变化。
3. 版本回退：以目标历史版本内容创建一个新的当前版本，不删除原有版本。
4. 推荐收藏：景点/美食推荐卡片可加入指定天，已加入内容可移除。
5. AI 上下文：提交每日 AI 重排时，将当天收藏内容追加到 instruction。
6. 示例路书只读，所有写入按钮禁用并显示原因。

### 非目标

- 不删除历史版本，不直接把 `plans.current_version` 指针倒退到旧版本。
- 不在本期实现多人协作、冲突合并或拖拽地图编辑。
- 不把第三方推荐图片或价格复制为无来源事实。

## 用户流程

### 查看和回退版本

用户点击路书顶部“版本历史”，看到当前版本和历史列表。选择任意历史版本后可打开差异面板：左侧为当前版本，右侧为历史版本，按天展示落脚点、驾驶时长和停留点变化。点击“回退到此版本”前显示确认提示；确认后服务端复制目标版本内容，生成新的递增版本，并返回变更摘要。回退后页面刷新到新版本。

### 收藏景点和美食

推荐卡片增加“加入 DAY XX”按钮。加入后记录推荐名称、类型、地址、来源和加入日期，按钮变为“已加入当天”。用户可在每日行程的“我的收藏”区域移除。加入和移除均使用乐观 UI，失败时回滚并提示。

### AI 重排

每日编辑提交时，如果当天存在收藏，将它们作为固定偏好追加到 instruction：要求优先保留这些地点，并在路线或时间冲突时解释取舍。收藏不会直接改写 `DayPlan.legs`，路线事实仍由现有 revisions + 地图核验流程产生。

## 数据与接口

### 版本

沿用 `plan_versions` 完整 JSON 存档，并新增 `plan_version_meta` 元数据表保存变更摘要（`plan_id, version, summary_json, created_at`），再提供只读查询：

- `GET /api/plans/:id/versions`：返回版本元数据和变更摘要。
- `GET /api/plans/:id/versions/compare?from=&to=`：返回结构化差异。
- `POST /api/plans/:id/versions/rollback`：body `{ targetVersion, baseVersion }`，创建新版本，要求 baseVersion 等于当前版本。

回退版本号永远为当前最大版本 + 1；新版本 `data` 使用目标版本内容，但 `version`、`createdAt` 和变更摘要更新为回退操作。

### 推荐收藏

新增 `saved_recommendations` 表：

```text
plan_id, day_index, recommendation_id, name, type, address, image_url,
navigation_url, source_json, created_at, PRIMARY KEY(plan_id, day_index, recommendation_id)
```

接口：

- `GET /api/plans/:id/saved-recommendations?day=`
- `POST /api/plans/:id/saved-recommendations`：写入推荐快照。
- `DELETE /api/plans/:id/saved-recommendations/:recommendationId?day=`：移除收藏。

所有接口校验当前 session 与 plan 归属；示例路书不调用写接口。推荐快照保留 `SourceRef`，UI 显示来源或“待核验”。

## 视觉与交互

- 版本入口使用当前路书顶部工具按钮风格，不增加新的主导航。
- 版本面板采用时间线列表，当前版本使用金色徽标；对比内容用“新增 / 调整 / 移除”三种轻量色标。
- 推荐按钮保持卡片内操作，不阻断用户浏览；成功后显示短 toast。
- 每日收藏显示在每日安排之后、Plan B 之前，最多展示 6 条，超出后提示“其余收藏将在 AI 重排时带入”。
- 移动端版本面板和收藏区域单列，按钮可触控，不能出现横向滚动。

## 验收标准

1. 真实路书可查看版本列表、版本差异并回退；回退不会删除旧版本，且生成递增新版本。
2. 版本 API 校验 session、当前版本冲突和目标版本存在性。
3. 推荐卡片可加入/移除指定日期，刷新后收藏仍存在。
4. AI 重排 instruction 包含当天收藏名称与类型。
5. 示例路书所有写操作按钮禁用，不产生 POST/DELETE 请求。
6. 收藏和版本接口失败时 UI 回滚或保留当前状态，并显示错误提示。
7. 所有新增 smoke、TypeScript、Lint、构建和浏览器流程通过。
