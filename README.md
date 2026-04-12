# traceforge

traceforge 是一个面向 **agent trajectory 审查、标注、分析和 LLM judge 调试** 的研究平台。

它不是通用标注后台，而是用于支持算法研究迭代的工作台：
- 从轨迹中发现失败模式；
- 形成并验证研究假设；
- 沉淀可回流到训练、合成、评测、verifier 设计的结构化信息。

## 当前仓库状态

当前仓库处于 **文档优先 + MVP 技术骨架阶段**：
- 已落地 Next.js + TypeScript + Tailwind 前端骨架；
- 已提供 mock data 与 trajectory detail 页面（轨迹浏览优先，标注按需打开）；
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

### 4) 代码检查

```bash
npm run lint
npx tsc --noEmit
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
- sample trajectory JSON + mock loader。
- 基础 app shell。
- trajectory detail 研究视图：
  - 顶部 Annotation Summary（整体判断、当前阶段、span 快速跳转）
  - 左侧 Step Timeline（状态、角色、工具调用信息、step 标注计数、span 折叠/展开）
  - 中间 Step Detail（工具卡片、参数/结果可读化、原始元信息）
  - 标注抽屉（默认收起，按需打开，支持 step/span/trajectory/all 范围切换）

## 项目原则（摘要）

1. 研究工作台优先，不做通用后台化泛化。
2. 先定义抽象模型，再实现功能。
3. 小步演进，保持数据模型稳定与类型清晰。
4. 早期以 mock data（sample trajectory JSON）驱动功能验证。

## 边界说明（MVP）

本阶段不做：登录、权限、数据库、批量分析、judge playground。
