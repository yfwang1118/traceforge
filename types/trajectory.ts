import type { Annotation } from './annotation';

export type StepStatus = 'ok' | 'warn' | 'error';

export type ToolCall = {
  name: string;
  args: Record<string, unknown>;
};

export type ToolResult = {
  ok: boolean;
  summary: string;
  raw?: string;
};

export type Step = {
  id: string;
  index: number;
  type: 'plan' | 'reason' | 'tool' | 'observe' | 'respond';
  title: string;
  observation: string;
  action: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  metadata: {
    durationMs?: number;
    tokenIn?: number;
    tokenOut?: number;
    model?: string;
    tags?: string[];
    command?: string;
    filesTouched?: string[];
    testSummary?: string;
    note?: string;
  };
  status: StepStatus;
  error?: string;
};

export type JudgeRun = {
  id: string;
  judgeName: string;
  judgeVersion: string;
  verdict: 'pass' | 'fail' | 'uncertain';
  score?: number;
  notes?: string;
  createdAt: string;
};

export type TrajectorySource = {
  name: string;
  url: string;
  note?: string;
};

export type Trajectory = {
  id: string;
  task: string;
  dataset?: string;
  createdAt: string;
  steps: Step[];
  annotations: Annotation[];
  judgeRuns?: JudgeRun[];
  source?: TrajectorySource;
};
