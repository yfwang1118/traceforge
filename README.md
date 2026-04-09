# traceforge

traceforge 是一个面向 **agent trajectory 审查、标注、分析和 LLM judge 调试** 的研究平台。

它不是通用标注后台，而是用于支持算法研究迭代的工作台：
- 从轨迹中发现失败模式；
- 形成并验证研究假设；
- 沉淀可回流到训练、合成、评测、verifier 设计的结构化信息。

## 当前仓库状态

当前仓库处于 **文档优先 + MVP 技术骨架阶段**：
- 已落地 Next.js + TypeScript + Tailwind 前端骨架；
- 已提供 mock data 与 trajectory detail 三栏页面占位；
- 当前 MVP 明确不接数据库，先用 sample/mock JSON 验证研究闭环。

## 快速开始

### 1) 安装依赖

```bash
npm install
```

### 2) 本地启动

```bash
npm run dev
```

默认访问：`http://localhost:3000`

### 3) 生产构建

```bash
npm run build
npm run start
```

## 目录结构

```text
traceforge/
  app/                          # Next.js App Router 页面
    trajectory/[trajectoryId]/  # trajectory detail 骨架页
  components/                   # 通用 UI 组件（如 app shell）
  features/
    trajectory/                 # trajectory 领域页面组件/逻辑
    annotation/                 # annotation 领域页面组件/逻辑
  lib/                          # 跨 feature 的基础库（mock loader、registry 等）
  types/                        # 核心领域类型定义
  sample-data/                  # 本地样例 JSON（mock 数据源）
  docs/                         # 产品/模型/MVP/UI 规范文档
```

## 已实现的最小能力（本轮）

- 核心类型：`Trajectory`、`Step`、`Annotation`、`EvidenceSpan`、`AspectSpec`、`JudgeRun`。
- 更复杂的 OpenHands / SWE-bench 风格 sample trajectory JSON + mock loader。
- 基础 app shell。
- trajectory detail 页面骨架：
  - 左侧 step timeline 占位
  - 中间 step detail 占位
  - 右侧 annotation panel 占位

## 项目原则（摘要）

1. 研究工作台优先，不做通用后台化泛化。
2. 先定义抽象模型，再实现功能。
3. 小步演进，保持数据模型稳定与类型清晰。
4. 早期以 mock data（sample trajectory JSON）驱动功能验证。

## 边界说明（MVP）

本阶段不做：登录、权限、数据库、批量分析、judge playground。

## 本轮垂直切片（trajectory detail + annotation）

当前已实现第一个可用交互闭环：

1. StepTimeline
   - 点击 step 选中并高亮
   - 支持 Prev / Next 上下切换
   - 支持通过 annotation evidence 跳转到关联 step

2. StepDetail
   - 结构化展示以下字段：
     - step index / id
     - observation
     - action
     - tool call
     - tool result
     - metadata

3. AnnotationPanel
   - 展示已有 annotations
   - 支持新增 / 编辑 / 删除 annotation
   - target 限制：`step | span | trajectory`
   - aspect 限制：`tool_call_validity | decision_criticality | failure_mode`
   - value 输入支持：enum / ordinal / text（按 aspect spec 切换）
   - evidence 支持 step id 或 step range，并可点击定位

说明：
- 本轮仅本地状态（React state / reducer），不接数据库与后端。
- 页面刷新后本地新增编辑会丢失（符合当前 MVP 约束）。


## 本轮轨迹查看增强

- Sample 数据已从简单示例升级为更复杂的代码修复轨迹（12 steps），覆盖：
  - 问题理解
  - 测试复现
  - 根因分析
  - 多轮补丁
  - focused test + full regression
  - 最终交付
- Step Timeline 交互已强化：
  - 点击 step 切换当前详情
  - 当前 step 高亮
  - Prev / Next 按钮切换
  - 键盘 `↑/↓` 快捷切换
- StepDetail 研究视图增加：
  - observation / action / tool call / tool result / metadata
  - command / filesTouched / testSummary / error context

> 说明：sample 数据为开源 OpenHands/SWE-bench 轨迹语义的本地化、schema 对齐版本，用于 UI 与研究流程调试。
