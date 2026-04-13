# MVP Scope (Phase 1)

## 1. MVP 目标

初版目标是验证：

1. 研究员能否在单条轨迹上高效完成“阅读-定位-标注-证据绑定”闭环；
2. 统一 annotation 模型在真实审查流程中是否足够表达核心判断；
3. 产出是否可直接用于后续研究讨论与实验设计。

## 2. MVP 功能范围（仅做这些）

## 2.1 Trajectory Detail 页面

- 展示单条 trajectory 的完整结构与步骤序列。
- 支持按 step 定位、展开详情、查看输入输出/工具调用摘要。

## 2.2 Annotation Panel

- 支持创建、编辑、删除 annotation。
- 支持 target：
  - `step`
  - `span`
  - `round`
  - `trajectory`
- 字段覆盖：`target / aspect / value / rationale / confidence / evidence / provenance / status`。

## 2.3 导入 sample trajectory JSON

- 支持从本地或预置目录加载样例 JSON。
- 导入后可立即在 trajectory detail 中浏览与标注。
- 导入格式应可校验并给出可读错误信息（字段缺失、类型不匹配、step 引用非法）。
- 当前默认展示路径使用 `sample-data/trajectory.cc.example.json`，并按原始 event 顺序逐条映射为统一 `Trajectory` 抽象中的 step。
- 与该样例配套的 mock annotations 存放在 `sample-data/trajectory.cc.annotations.json`，用于驱动 step / span / trajectory 三层演示。
- 该 mock annotation 样例中的 span 需要连续覆盖完整对话粒度；若存在未覆盖区间，展示层需自动补齐为“未标注对话段”以避免时间线断层。
- 对话型样例中，span 的分段默认必须完整落在各自 round 内；展示层应优先表达 `round -> spans -> steps` 的层级，而不是把 span 视为全局平铺切片。
- `sample-data/trajectory.sample.json` 继续保留为结构化旧样例，用于对照和回归，不再作为默认 loader 的主路径。

## 2.4 少量 aspect 先行

初版只启用最小 aspect 集合，建议 6~10 个，覆盖：
- 任务理解（task understanding）
- 计划质量（planning quality）
- 工具使用有效性（tool usefulness）
- 事实一致性/幻觉风险（factuality risk）
- 进度推进情况（progression）
- 最终完成度（outcome quality）
- 用户问题任务类别（request task type）
- 用户问题意图类别（request intent type）

## 3. 明确不做（MVP 非目标）

以下能力本期不进入实现：

1. 登录与用户管理
2. 权限系统与多角色协作
3. 数据库持久化（先用本地数据或内存态）
4. 批量分析看板与统计报表
5. 自动任务分发、审核流、计件流程
6. 复杂对比分析页（多轨迹聚合）

## 4. 数据与技术策略（MVP）

1. **先 mock data**
   - 样例数据必须覆盖成功与失败轨迹。
   - 至少包含：短轨迹、长轨迹、工具调用失败案例。
   - 至少提供 1 条来自开源 code agent 场景的复杂轨迹样例（含多轮编辑、测试失败与回归验证步骤），用于“以看轨迹为主”的审查演练。

2. **模型优先**
   - 先固化 annotation schema 与 aspect registry。
   - UI 只作为模型操作界面，不引入额外隐式状态。

3. **可迁移性**
   - 即使本期不接数据库，也应让数据结构可平滑迁移到后端服务。

## 5. MVP 验收标准

满足以下条件即可视为 MVP 可用：

1. 能导入并渲染 sample trajectory JSON；
2. 能在 step/span/trajectory 上完成标注 CRUD；
2.1. 对话型样例中，能在 `round` 上查看与创建标注；
3. 每条标注可设置 aspect、value、rationale、confidence、evidence、status；
4. 标注数据可导出为结构化 JSON；
5. 研究员可基于该结果完成一次失败案例复盘。

## 6. 里程碑建议

- M1：数据模型与导入校验完成
- M2：trajectory detail + step timeline 可用
- M3：annotation panel 可用（step/span/round/trajectory）
- M4：evidence linking 与导出闭环完成

## 7. 关于大规模数据与数据库策略

你提到“后续分析数据量会非常大”，这是明确预期。MVP 阶段 **有意不接数据库**，原因是：

1. 先验证 annotation 抽象与研究工作流是否成立，避免过早绑定存储实现；
2. 降低实现复杂度，让研究迭代速度优先；
3. 使用 sample/mock JSON 更容易复现实验与快速修订 schema。

但在 MVP 之后，建议按以下顺序演进：

- **Phase 2（协作化）**：引入 OLTP 数据库（如 Postgres）保存 trajectory 元数据、annotation、aspect registry 与审计日志。
- **Phase 3（规模化）**：
  - 原始 trajectory payload（大文本/大对象）放对象存储；
  - 结构化索引和事务数据放 OLTP；
  - 聚合分析与离线统计进入 OLAP/数仓；
  - 必要时增加检索索引（如全文/向量）用于 evidence 与相似案例回查。

换言之：**现在没有数据库是刻意的 MVP 边界，不是忽略大规模需求**。

## 8. 参考输入样例

当前仓库保留了两类样例，用于默认演示、导入器设计与 UI 回归：

1. `sample-data/trajectory.cc.example.json`
   - Claude Code 风格事件流样例；
   - 当前默认演示即基于这份原始 event log；
   - 当前展示层对它采用 **研究可读优先** 的 step 映射：
     - 普通消息 event 保持 1 event = 1 step；
     - `assistant.tool_use` 与其对应的 `tool_result` / `toolUseResult` 绑定为同一个 tool step。
     - `user` step 在展示层上浮为对话轮次头部（round header），位于 span 之上。
   - 页面开头总览需直接展示：`steps / rounds / jumps / annotations` 等关键指标，帮助研究员先建立对话结构心智模型。

2. `sample-data/trajectory.cc.annotations.json`
   - 与上述事件流样例配套的 mock annotations；
   - 提供 trajectory / round / span / step 四层标注演示；
   - 每个 round 都需要至少对应 1 组 span，且这些 spans 只服务该 round；
   - round 标注至少覆盖：
     - 用户问题主任务类别（如 `bug_fix` / `feature` / `config_setup`）；
     - 用户意图类别（如 `new_requirement` / `follow_up` / `correction` / `dissatisfaction`）；
   - 用于验证“先看用户问题，再看阶段推进，再看局部 step 证据”的阅读路径。

3. `sample-data/trajectory.sample.json`
   - 旧的结构化样例；
   - 现作为备用结构化对照样例保留；
   - 继续覆盖问题修复/回归验证场景，便于和 event-log 适配结果对照。

原则：

- 默认演示可以基于真实 event log，且优先保证“研究可读性 + 证据可回溯”；
- 即便展示经过绑定后的 step，UI 仍然必须落在统一抽象模型上；
- 不因为保留原始 event log 就夸大“通用事件流导入”已经完成；
- 若后续要支持通用事件流导入，仍需单独在 docs 中明确“已实现”与“计划中”的边界。
