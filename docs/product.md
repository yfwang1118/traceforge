# Product Definition — traceforge

## 1. 用户是谁

### 1.1 核心用户（Primary Users）

1. **算法研究员 / 研究工程师**
   - 关注模型在长轨迹、多步骤任务中的真实行为。
   - 需要从具体失败案例中提炼“可实验验证”的改进方向。

2. **评测与数据工程人员**
   - 关注如何将人工审查结果转化为结构化标签，服务数据构造与离线评测。

3. **LLM judge / verifier 设计者**
   - 关注 judge 判定与人工结论的偏差来源。
   - 需要在轨迹级和步骤级识别 judge 失效模式。

### 1.2 非目标用户（Not Primary）

- 大规模众包标注团队管理者。
- 以工单流转、计件管理为核心的运营角色。

> 说明：traceforge 的初版目标不是“提升标注吞吐”，而是“提升研究洞察密度”。

## 2. 主要研究动作是什么

平台需支持以下高频研究动作（Research Actions）：

1. **轨迹审查（Trajectory Review）**
   - 查看一条 agent trajectory 的完整执行序列（step timeline、输入输出、工具调用、状态变化）。

2. **局部定位（Failure Localization）**
   - 在 step/span 上定位异常行为（如错误工具选择、上下文遗失、目标偏移、伪完成）。

3. **结构化标注（Structured Annotation）**
   - 对 step/span/round/trajectory 打统一 schema 标注，包含置信度、证据、来源与状态。
   - 在对话型轨迹中，支持对用户问题所属 round 标注任务类别与意图类别。

4. **证据绑定（Evidence Linking）**
   - 将结论绑定到可复核证据（轨迹片段、日志、judge 输出、对比样本）。

5. **假设形成（Hypothesis Formation）**
   - 基于标注聚合形成研究假设，例如：
     - 某类任务中规划错误占比上升；
     - 某 judge 在长上下文时置信度失真。

6. **反馈闭环（Research Loop）**
   - 将标注产出映射到后续动作：训练数据筛选、合成策略设计、评测切片构造、verifier 规则迭代。

## 3. 平台核心价值是什么

### 3.1 对研究效率的价值

- 将“读日志式排查”升级为“可复用、可比较、可统计”的结构化分析流程。
- 把分散在脑中的判断标准，沉淀为可共享的 aspect registry 与 annotation schema。

### 3.2 对研究质量的价值

- 通过 evidence 与 provenance 提高结论可追溯性，降低主观偏差。
- 通过统一 target types 让不同研究员的标注结果可对齐、可聚合。

### 3.3 对闭环建设的价值

- 标注不是终点，而是训练/评测/verifier 设计的中间层。
- 平台输出应天然可被后续 pipeline 消费（结构化 JSON / schema 稳定）。

## 4. 初版边界是什么

### 4.1 初版必须覆盖（In Scope）

- 单条 trajectory detail 浏览。
- 在 step / span / round / trajectory 目标上的统一标注。
- 从 sample trajectory JSON 导入并进行本地审查。
- 支持少量预置 aspect，验证抽象模型可用性。

### 4.2 初版明确不做（Out of Scope）

- 登录与权限系统。
- 生产数据库与多用户协作。
- 批量分析看板与自动聚合报表。
- 完整的任务分发、审核流、计件管理能力。

### 4.3 成功判据（Product-level Success for MVP）

若研究员可以在 30 分钟内完成以下闭环，则初版达标：
1. 导入一条样例轨迹；
2. 在 timeline 中定位关键失败 step/span；
3. 完成结构化标注并绑定证据；
4. 导出可用于后续实验讨论的结论记录。
