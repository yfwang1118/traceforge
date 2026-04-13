# UI Plan (MVP-first)

## 1. 总体原则

- UI 服务研究动作，而不是追求后台管理系统的“功能面面俱到”。
- 页面信息架构围绕“快速定位失败点 + 结构化沉淀结论”。
- 交互优先保证：定位速度、上下文连续性、标注一致性。

## 2. Trajectory Detail 页面布局

建议采用“**轨迹浏览优先**”布局（桌面端优先）：

- 默认态：双栏（左 Timeline + 中 Detail），把主要宽度留给轨迹阅读与定位；
- 标注态：按需打开右侧 Annotation Drawer（覆盖层），而不是长期固定占位。

1. **左栏：Step Timeline**
   - 显示步骤索引、步骤类型、关键状态（成功/失败/异常）。
   - 支持快速跳转与当前 step 高亮。

2. **中栏：Step Detail / Trajectory Context**
   - 显示当前 step 的输入、输出、工具调用、耗时、错误信息。
   - 支持切换“单步视图 / span 视图 / 全轨迹概览”。

3. **按需抽屉：Annotation Panel**
   - 默认收起，不占用主阅读区宽度。
   - 用户在需要时通过“标注当前 step / 标注轨迹”入口打开。
   - 打开后展示当前 target 的标注列表，并提供新建标注与状态操作。

### 2.1 顶部信息区

- trajectory 基础元信息：
  - trajectory id
  - 任务类型/数据集切片
  - 总 step 数、失败位置摘要
- 操作区：导入 JSON、导出标注、切换视图密度、打开标注抽屉。

### 2.2 标注抽屉交互（新增）

1. 默认关闭，避免低频操作干扰高频“看轨迹”流程。
2. 打开时优先定位到当前上下文（当前 step 或 trajectory）。
3. 抽屉内支持 target 快速切换（step / round / span / trajectory / all），减少页面跳转。
4. 关闭后保留当前 step 位置与阅读上下文，不重排主区域。

### 2.3 顶部汇总条（新增）

在 trajectory detail 顶部增加轻量的 annotation summary strip，用于建立全局心智模型，而不是额外引入独立标注页面。

summary strip 至少包含：

1. trajectory / round / span / step 标注数量摘要；
2. 对话结构摘要：dialogue rounds 数量 + round jumps（轮次跳转）数量；
3. trajectory 级整体判断；
4. 当前 round 的用户问题卡片：
   - 用户问题摘要；
   - `request.task_type`；
   - `request.intent_type`；
   - 当前 round 覆盖的 step 范围与 round 标注数。
5. 当前 step 所属阶段（若存在 span）及其简短理由；
6. round 导航 chips，点击后可直接定位到对应用户问题；
7. span 阶段 chips，点击后可直接定位并聚焦对应区段。

原则：

- 顶部汇总条只承担“概览 + 快速跳转”职责；
- 完整细节仍然放在 timeline、detail 与 annotation drawer 中；
- 信息顺序遵循：`trajectory verdict -> current question / round -> current phase -> current step`；
- 这样可以把标注织进原有骨架，而不是让研究员在“阅读轨迹”和“查看标注”之间切到另一个工作区。

## 3. Step Timeline 设计

## 3.1 每个 step 的最小信息

- `step_index`
- `step_type`（reason/tool/observe/plan 等）
- `status`（ok/warn/error）
- 是否已有标注（计数徽标）

## 3.2 核心交互

1. 点击 step：中栏跳转并更新右栏 target 为该 step。
2. Shift 多选/拖选区间：创建 span target。
3. 悬停预览：快速查看 step 摘要，减少来回切换。
4. 对已有 span 标注的区段，支持折叠/展开对应 step。

MVP 当前最小可用交互（必须落地）：
- 支持单选 step（click）并在 Timeline 中高亮当前项；
- Step Detail 随选中 step 实时刷新；
- 对错误/告警 step 提供显式视觉状态，帮助研究员快速回放关键决策链路。

### 3.2.1 Span 折叠（新增）

保持 `step` 是主阅读粒度，但允许用 `span` 做轻量结构化压缩：

1. 默认仍按 step 展开，避免丢失局部判断链。
2. 当某段 steps 已有 span 标注时，可将这段收起为一个阶段节点。
3. 折叠态节点需显示：
   - 阶段名称
   - 起止 step
   - 覆盖的 step 数
   - span / step 标注数
4. 展开态下：
   - 恢复原始 step 列表；
   - span 名称退化为一条细 bar，而不是继续占据完整标题行；
   - 鼠标悬停在细 bar 上时，仅显示该 span 的阶段名；
   - 展开态头部第一行仍需保留 span 标签，避免研究员失去当前阶段语义。
5. 对默认 mock annotation 样例，span 需要覆盖完整对话粒度（不留未分段 steps）。
   - 若存在未覆盖区间，展示层允许自动补齐“未标注对话段”作为临时 span，以避免时间线出现语义断档。

这个交互的目标不是把 timeline 改造成“阶段视图”，而是在长轨迹中提供一层不打断 step 阅读的压缩能力。

### 3.2.2 Dialogue Round 分层（新增）

对于真实对话轨迹，`user` 角色不应继续作为普通 step 卡片和 assistant/tool step 混排，而应提升为 **对话轮次（dialogue round）头部**：

1. 每次出现 `user` prompt，视为一个新的 round 开始。
2. round 的层级高于 `span`：
   - `round`
   - `span / phase`
   - `step`
   - 一个 round 应对应一套 spans；默认情况下 span 不跨 round。
3. round header 至少展示：
   - round 序号
   - 用户问题摘要
   - task / intent 标签
   - 覆盖的 step 范围
   - 包含的 assistant/tool step 数
   - round 标注数
4. 默认时间线中：
   - `user` prompt 不再重复渲染成普通 step 卡片；
   - 其内容作为 round header 的主文案；
   - round 内再继续展示 spans 与 steps。
5. 点击 round header 时：
   - 中栏 detail 优先展示该轮的用户问题上下文；
   - 并保留当前选中 step 的细节能力。

目标：

- 让研究员先识别“这一轮在讨论什么”；
- 立即看到“这是 bug fix / 新需求 / 修正 / 不满反馈中的哪一种”；
- 再进入该轮内部的阶段推进与局部 step 判断；
- 避免时间线被大量 `assistant:` / `tool:` 标签噪声淹没。

### 3.2.3 多维折叠（新增）

时间线折叠能力不应只停留在 span 维度，还应支持 round 维度：

1. `round` 支持收起/展开（收起后仅保留 round header 与关键摘要）。
2. `span` 支持收起/展开（保持现有阶段压缩能力）。
3. 当通过 summary chip 跳转到某个 span 时，需自动展开其所属 round 与该 span，避免“跳到了不可见节点”。
4. 顶部总览中的 phase 导航不应再全局平铺，而应按 round 分组展示“这一轮有哪些 phases”。

## 3.3 可视化提示

- 错误 step 使用高对比颜色但避免过度干扰。
- 已标注 step 给出轻量标识，支持快速筛选“未标注步骤”。
- 不同 span 标签应映射为稳定的颜色族，而不是全部使用同一种强调色。

## 4. Annotation Panel 设计

## 4.1 面板结构

1. 当前 target 卡片
   - target type + target id
   - 快速切换 step/round/span/trajectory 上下文

2. annotation 列表
   - 按更新时间倒序
   - 每项展示：aspect、value(label)、rationale、confidence、status、evidence 数量

3. annotation 编辑器
   - 字段顺序固定：`aspect -> value -> confidence -> evidence -> provenance -> status`
   - 根据 aspect 动态约束 value 输入组件（枚举、数值、文本等）

## 4.1.1 Round 标注专属要求（新增）

当 target 为 `round` 时，面板中需要优先暴露“用户问题”相关字段，而不是与 step 完全等权混排：

1. 顶部展示 lead user prompt 摘要与原文回跳入口。
2. 默认优先显示：
   - `request.task_type`
   - `request.intent_type`
   - `correctness.task_understanding`（可选）
3. `request.intent_type` 建议使用多标签 chips 组件，而不是单个自由文本输入。
4. round 标注创建完成后，应在 timeline 的 round header 与顶部 summary strip 中同步可见。

## 4.2 输入约束

- aspect 必须来自 registry 下拉选择，不允许自由输入 key。
- value 组件由 value type 决定，防止类型错配。
- confidence 限制 `[0,1]`，支持快捷档位（0.3/0.5/0.7/0.9）。

## 4.3 状态流转

MVP 支持基础状态：
- `draft -> confirmed`
- `draft -> disputed`
- `confirmed -> deprecated`

## 5. Evidence Linking

## 5.1 MVP 能力

- 从当前 trajectory 内选择证据来源：
  - 单 step 片段
  - span 片段
  - artifact 引用
  - judge 输出
- 每条 evidence 可附简短说明（为何支持该判断）。

## 5.2 交互建议

- 在中栏内容选中后可“一键添加为 evidence”。
- evidence 列表支持点击回跳到原始位置（step/span 高亮）。

## 6. 后续扩展页面（非 MVP）

为保证可演进性，预留以下页面：

1. **Trajectory Compare**
   - 并排比较两条轨迹，支持 comparison target 标注。

2. **Aspect Analytics**
   - 按 aspect 聚合标注分布、失败模式热区、版本对比。

3. **Judge Debug Console**
   - 对比 human annotation 与 llm_judge 输出差异。

4. **Hypothesis Workspace**
   - 将多个标注簇组织成研究假设与实验计划。

## 7. MVP UI 验收要点

1. 研究员可在一个页面内完成：阅读轨迹、定位步骤、创建标注、绑定证据。
2. 不出现 target/aspect/value 语义错配。
3. 在 100+ steps 的轨迹中仍可快速定位与回跳。
4. 标注结果可导出并保持 schema 一致性。
5. 对话型样例中，研究员能在 5 秒内看出“当前 round 的用户问题类别与意图类别”。
6. 研究员能在不打开 timeline 细节的情况下，从顶部总览直接看出“当前 round 下有哪几段 phase，以及它们分别在做什么”。

## 8. 真实轨迹（对话流）展示优化（新增）

为支持 code-agent 真实执行轨迹（system/user/assistant/tool 多角色混合、包含长代码块与工具输出），MVP 页面增加以下展示约束：

1. **长文本可读性**
   - Step Detail 中 input/output/error 使用等宽字体 + `pre-wrap`，保留换行与缩进。
   - 单个区域限制最大高度并提供滚动，避免长日志把页面撑开。

2. **时间线信息密度**
   - Step Timeline 支持滚动列表，确保 20+ step 轨迹仍能快速定位。
   - 每个 step 显示：索引、类型、状态、可选 tool 标签，标题最多两行避免抖动。
   - 对话型样例中，`user` prompt 作为 round header 展示，不与 assistant/tool steps 平铺混排。

3. **布局稳定性**
   - 三栏布局在桌面端保持稳定；在窄屏自动降级为单列，优先保证“先定位后阅读”的流畅性。

4. **样例数据升级**
   - `sample-data` 至少保留 1 条真实 code-agent 对话流样例，默认演示可直接使用 `trajectory.cc.example.json` 这类原始 event log。
   - 当前默认对话流样例采用“研究可读优先”的 step 映射：
     - 普通对话/观察类 event 维持 1 event = 1 step；
     - `assistant.tool_use` 与后续匹配的 `tool_result` / `toolUseResult` 合并为一个 tool step；
     - 未匹配到调用的孤立 `tool_result` 保留为独立 step（orphan result）。
   - 配套 mock annotations 仍用于驱动 Timeline / Detail / Annotation UI。
   - 结构化问题修复样例可继续保留为对照输入，用于 UI 回归与研究演示。

5. **工具返回（`toolUseResult`）可读化展示**
   - Step Detail 中新增独立的 `Tool Use Result` 区块，与 input/output 分离，避免工具返回淹没主对话文本。
   - 默认展示结构摘要（类型、顶层 key、条目数量/长度），并保留原始 JSON 视图用于追溯。
   - Timeline 对含 `toolUseResult` 的 step 增加轻量标识，帮助研究员快速定位“工具执行结果驱动”的决策节点。

## 9. Step 语义与角色绑定规则（当前默认样例）

针对当前默认的 Claude Code event log 样例，展示层采用 **工具调用绑定视图**：

1. **step 粒度规则**
   - 普通 event（user / assistant text）默认 1 event = 1 step；
   - `assistant.tool_use` 与其后匹配的 `tool_result` / `toolUseResult` 绑定为同一个 step；
   - 时间顺序必须保持与原始 JSON 一致，不允许重排。

1.1 **round 粒度规则**
   - `user` step 同时承担 “对话轮次起点” 的语义；
   - 展示时，`user` step 上浮为 round header；
   - round 内部继续容纳 spans 与普通 steps。
   - 用户问题类别与意图类别默认挂在 `round` 上，而不是分散挂在 round 内各个 step 上。

2. **绑定与回溯并存**
   - Step Detail 以“Tool Call + Tool Result”作为主视图；
   - 同时保留原始 event 证据（调用参数、返回原文、来源 event）用于追溯；
   - 不允许因为绑定展示而丢失原始证据路径。

3. **多工具调用场景**
   - 若同一 assistant event 中包含多个 `tool_use`，该 event 仍只占一个 step；
   - Step Detail 中按调用顺序渲染工具列表，并把返回按 `tool_use_id` 绑定到对应调用；
   - 若返回缺失或未匹配，显式展示 `waiting` / `orphan result` 状态，不静默丢弃。

4. **原始证据优先**
   - 标题、状态和 tool 标签允许做轻量摘要；
   - 但详情面板必须能看到原始参数、原始结果和来源 event 证据。

5. **标题去角色噪声**
   - 对默认样例而言，大部分 action 都由 assistant 发起，因此标题默认不再重复展示 `assistant:` 前缀；
   - tool step 默认以工具名或动作摘要作为标题；
   - role 仅在非默认语境（如 `user` / `system` / `unknown`）时作为辅助信息出现。

## 10. Tool 参数 / 返回的可读化视图规范（新增）

Step Detail 在工具 step 中至少包含以下层级：

1. **Tool Card（主视图）**
   - 每个工具调用单独占一张卡片；
   - 卡片头部只保留最关键的信息：
     - 工具名
     - 执行状态（completed / failed / waiting / orphan result）
     - 可选的调用序号

2. **Arguments View（参数视图）**
   - 默认直接展示结构化参数字段，不再先展示工具汇总；
   - 参数名按字段标签展示，例如 `path`、`file_path`、`pattern`；
   - 简单标量以内联 code 方式展示，复杂对象/数组以下沉代码块展示；
   - 对高频批量参数（如 `TodoWrite.todos`）提供专用列表视图：
     - 展示总条目数与状态分布；
     - 每条任务展示 `id/content/status/priority`，优先可扫读而不是原始 JSON；
     - 原始 JSON 保留在 `Raw Arguments` 折叠区用于证据核对；
   - 原始 JSON 作为次级信息收纳进可折叠区域。

3. **Result View（结果视图）**
   - 默认直接展示该工具调用对应的结果，不做额外汇总层；
   - 短文本结果应以可快速扫读的文本面板展示；
   - 长文本或结构化结果再降级为等宽滚动区；
   - 对明显错误（error/exception/not found/does not exist）提供失败态高亮。

4. **Raw Transcript（次级信息）**
   - 原始 `tool_use` / `tool_result` 文本不作为主视图默认展开；
   - 仅在研究员需要核对底层证据时，通过折叠区查看。

5. **User / Assistant 问题上下文分层**
   - 用户问题（prompt）与 assistant 工具动作分开展示：
     - 用户意图：`User Prompt`
     - 模型行动：`Assistant Action`
     - 工具证据：`Tool Call + Tool Result`
   - 防止将工具返回误读为用户消息正文。

6. **并行工具展示规范（新增）**
   - 默认按卡片列表直接拆开渲染，不额外提供“工具汇总区”作为主入口；
   - 同一 step 中的多个工具卡片按调用顺序排列；
   - 每张卡片内固定为：
     - tool header
     - arguments
     - result
     - raw details（可折叠）
   - 不要求用户理解底层并行执行机制，也能直接看懂“哪个返回属于哪个调用”。
