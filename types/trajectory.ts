import type { Annotation } from './annotation';

export type StepStatus = 'ok' | 'warn' | 'error';

export type Step = {
  id: string;
  index: number;
  type: 'plan' | 'reason' | 'tool' | 'observe' | 'respond';
  title: string;
  input?: string;
  output?: string;
  toolName?: string;
  durationMs?: number;
  status: StepStatus;
  error?: string;
  role?: 'system' | 'user' | 'assistant' | 'tool' | 'unknown';
  timestamp?: string;
  metadata?: {
    parentUuid?: string | null;
    requestId?: string;
    model?: string;
    stopReason?: string | null;
    inputTokens?: number;
    outputTokens?: number;
  };
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

export type Trajectory = {
  id: string;
  task: string;
  dataset?: string;
  createdAt: string;
  steps: Step[];
  annotations: Annotation[];
  judgeRuns?: JudgeRun[];
};
