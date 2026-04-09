# Annotation Model Specification

## 1. 设计目标

本模型用于统一 traceforge 中“对轨迹行为的研究判断”表示方式，要求：

- **统一**：不同 target（step/span/trajectory...）共享同一标注骨架；
- **可扩展**：新增 aspect 不破坏已有数据；
- **可消费**：可直接进入训练/评测/verifier 后续流程；
- **可追溯**：每条结论具备证据、来源与状态。

## 2. Annotation 的统一抽象形式

统一抽象：

> Annotation = 对某个 target，在某个 aspect 上给出的 value 判断，附带 confidence / evidence / provenance / status。

建议数据结构（概念层）：

```ts
type Annotation = {
  id: string;
  target: TargetRef;
  aspect: AspectKey;
  value: Value;
  confidence?: number;
  evidence?: EvidenceRef[];
  provenance: Provenance;
  status: AnnotationStatus;
  createdAt: string;
  updatedAt: string;
};
```

## 3. Target Types（封闭集合）

初始 target types 约定为以下七类：

1. `step`
   - 单个执行步骤（一个 thought/action/tool/result 单元）。
2. `span`
   - 若干连续步骤形成的区间（例如 steps 8-12）。
3. `transition`
   - 两个相邻或指定步骤之间的状态转移关系（step i -> step j）。
4. `trajectory`
   - 整条轨迹级判断。
5. `artifact`
   - 轨迹中生成或引用的中间产物（文本、代码片段、工具输出文件等）。
6. `milestone`
   - 研究上定义的阶段性节点（例如“完成问题理解”“形成可执行计划”）。
7. `comparison`
   - 对两个实体（可为 step/span/trajectory）进行对比后的判断。

> 说明：target type 是封闭集合，扩展必须通过文档版本化进行，不允许实现中临时发明未登记类型。

## 4. Annotation Schema

每条标注必须包含以下字段（除显式标注可选项外）：

### 4.1 `target`

指向被标注对象。

```ts
type TargetRef =
  | { type: 'step'; trajectoryId: string; stepId: string }
  | { type: 'span'; trajectoryId: string; startStepId: string; endStepId: string }
  | { type: 'transition'; trajectoryId: string; fromStepId: string; toStepId: string }
  | { type: 'trajectory'; trajectoryId: string }
  | { type: 'artifact'; trajectoryId: string; artifactId: string }
  | { type: 'milestone'; trajectoryId: string; milestoneId: string }
  | { type: 'comparison'; left: TargetRef; right: TargetRef; comparisonId: string };
```

### 4.2 `aspect`

- 表示“从什么研究视角”评价 target。
- 只能来自 aspect registry（见第 5 节）。

示例：
- `correctness.task_understanding`
- `planning.decomposition_quality`
- `tool.usefulness`
- `safety.policy_risk`

### 4.3 `value`

- 表示评价结果；
- 类型必须来自 value type 封闭集合（见第 6 节）；
- 与 aspect 定义兼容（由 registry 约束）。

### 4.4 `confidence`（可选但推荐）

- 区间 `[0, 1]`。
- 研究语义：标注者对当前 value 判断可信度。
- 非模型概率，不用于替代统计置信区间。

### 4.5 `evidence`（可选但推荐）

引用支持该判断的证据对象列表（可跨 target）。

```ts
type EvidenceRef = {
  type: 'step_excerpt' | 'span_excerpt' | 'artifact_quote' | 'judge_output' | 'external_note';
  refId: string;
  note?: string;
};
```

### 4.6 `provenance`

记录标注来源与方式：

```ts
type Provenance = {
  source: 'human' | 'llm_judge' | 'heuristic' | 'imported';
  authorId?: string;
  toolVersion?: string;
  runId?: string;
};
```

### 4.7 `status`

建议枚举：
- `draft`：草稿
- `confirmed`：已确认
- `disputed`：有争议
- `deprecated`：已废弃/被替换

## 5. Aspect Registry 机制

## 5.1 目标

aspect registry 是“研究视角”的唯一注册源，解决以下问题：
- 避免同义重复字段（例如 `is_good_plan` vs `plan_quality`）。
- 保障 value type、默认置信度策略、适用 target 范围一致。

## 5.2 Registry 条目建议结构

```ts
type AspectDefinition = {
  key: string;                      // 全局唯一，如 planning.decomposition_quality
  name: string;                     // 可读名称
  description: string;              // 研究语义定义
  allowedTargetTypes: TargetType[]; // 允许作用对象
  valueType: ValueType;             // 与第6节一致
  valueConstraints?: object;        // 例如枚举值集合
  guideline?: string;               // 标注判定建议
  version: string;                  // 语义版本
  active: boolean;
};
```

## 5.3 Registry 演进规则

1. 新增 aspect：允许，必须文档登记。
2. 修改既有语义：需提升 version，避免静默破坏历史数据。
3. 删除 aspect：不物理删除，仅 `active=false`，保证可追溯。

## 6. Value Type（封闭集合）

value type 必须从以下集合中选择：

1. `boolean`：二元判断（true/false）
2. `categorical`：离散枚举（如 `good|ok|bad`）
3. `ordinal`：有序等级（如 1-5）
4. `numeric`：连续数值
5. `text`：自由文本结论
6. `distribution`：多类别概率/权重分布
7. `set`：标签集合（无序）
8. `relation`：关系结构（用于关系型标注）

> 说明：value type 也是封闭集合，新增需先更新本规范。

## 7. 关系型标注 vs 属性型标注

## 7.1 属性型标注（Attribute Annotation）

- 形式：`target + aspect + scalar/structured value`
- 作用：描述单一对象的属性判断。
- 示例：
  - 在 `step#12` 上标注 `tool.usefulness = bad`。
  - 在 `trajectory#A` 上标注 `outcome.success = false`。

## 7.2 关系型标注（Relational Annotation）

- 形式：显式描述多个对象间关系，通常依赖 `comparison` 或 `transition` target，或 `valueType=relation`。
- 作用：表达“因果、优劣、替代、一致性、前后影响”等关系。
- 示例：
  - 比较两段 span：`comparison` 上标注 `efficiency.relative = left_better`。
  - 转移关系：`transition(i->j)` 上标注 `state.progress_delta = regress`。

## 7.3 区分原则

- 若判断可归属于单个 target 的内在属性，使用属性型标注。
- 若判断本质依赖多个对象之间的联系，使用关系型标注。

## 8. MVP 阶段的最小落地约束

在初版中：
- target 仅强制支持 `step` / `span` / `trajectory`；
- 其他 target type 在 schema 层预留，但可以不在 UI 暴露；
- aspect registry 仅启用少量高价值 aspect；
- 所有 annotation 写入都必须经过 schema 校验。
