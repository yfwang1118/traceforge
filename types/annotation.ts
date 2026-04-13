export type TargetType =
  | 'step'
  | 'span'
  | 'round'
  | 'transition'
  | 'trajectory'
  | 'artifact'
  | 'milestone'
  | 'comparison';

export type AnnotationStatus = 'draft' | 'confirmed' | 'disputed' | 'deprecated';

export type EvidenceType =
  | 'step_excerpt'
  | 'span_excerpt'
  | 'artifact_quote'
  | 'judge_output'
  | 'external_note';

export type ValueType =
  | 'boolean'
  | 'categorical'
  | 'ordinal'
  | 'numeric'
  | 'text'
  | 'distribution'
  | 'set'
  | 'relation';

export type EvidenceSpan = {
  id: string;
  type: EvidenceType;
  trajectoryId: string;
  stepId?: string;
  startStepId?: string;
  endStepId?: string;
  quote?: string;
  note?: string;
};

export type TargetRef =
  | { type: 'step'; trajectoryId: string; stepId: string }
  | { type: 'span'; trajectoryId: string; startStepId: string; endStepId: string }
  | { type: 'round'; trajectoryId: string; roundId: string; leadStepId: string; startStepId: string; endStepId: string }
  | { type: 'transition'; trajectoryId: string; fromStepId: string; toStepId: string }
  | { type: 'trajectory'; trajectoryId: string }
  | { type: 'artifact'; trajectoryId: string; artifactId: string }
  | { type: 'milestone'; trajectoryId: string; milestoneId: string }
  | { type: 'comparison'; left: TargetRef; right: TargetRef; comparisonId: string };

export type AnnotationValue =
  | boolean
  | number
  | string
  | string[]
  | { label: string; score: number }[]
  | { relation: string; from: string; to: string; meta?: Record<string, unknown> };

export type Annotation = {
  id: string;
  target: TargetRef;
  aspect: string;
  value: AnnotationValue;
  rationale?: string;
  confidence?: number;
  evidence?: EvidenceSpan[];
  provenance: {
    source: 'human' | 'llm_judge' | 'heuristic' | 'imported';
    authorId?: string;
    toolVersion?: string;
    runId?: string;
  };
  status: AnnotationStatus;
  createdAt: string;
  updatedAt: string;
};

export type AspectSpec = {
  key: string;
  name: string;
  description: string;
  allowedTargetTypes: TargetType[];
  valueType: ValueType;
  valueConstraints?: {
    options?: string[];
    min?: number;
    max?: number;
  };
  guideline?: string;
  version: string;
  active: boolean;
};
