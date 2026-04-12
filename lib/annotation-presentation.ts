import type { Annotation, AnnotationValue, Step, Trajectory } from '@/types';

export type TimelineSpanGroup = {
  id: string;
  annotation: Annotation;
  label: string;
  rationale?: string;
  startStepId: string;
  endStepId: string;
  startStepIndex: number;
  endStepIndex: number;
  stepIds: string[];
  stepCount: number;
  stepAnnotationCount: number;
  containsSelectedStep: boolean;
};

export type SpanTone = {
  bar: string;
  barHover: string;
  header: string;
  headerMuted: string;
  chip: string;
  chipSoft: string;
  card: string;
  cardActive: string;
  text: string;
};

const SPAN_TONES: SpanTone[] = [
  {
    bar: 'bg-sky-500',
    barHover: 'hover:bg-sky-400',
    header: 'border-sky-200 bg-sky-50 text-sky-900',
    headerMuted: 'text-sky-700',
    chip: 'border-sky-200 bg-sky-100 text-sky-800',
    chipSoft: 'bg-sky-100 text-sky-700',
    card: 'border-sky-200 bg-sky-50',
    cardActive: 'border-sky-300 bg-sky-50 shadow-sm',
    text: 'text-sky-800',
  },
  {
    bar: 'bg-rose-500',
    barHover: 'hover:bg-rose-400',
    header: 'border-rose-200 bg-rose-50 text-rose-900',
    headerMuted: 'text-rose-700',
    chip: 'border-rose-200 bg-rose-100 text-rose-800',
    chipSoft: 'bg-rose-100 text-rose-700',
    card: 'border-rose-200 bg-rose-50',
    cardActive: 'border-rose-300 bg-rose-50 shadow-sm',
    text: 'text-rose-800',
  },
  {
    bar: 'bg-emerald-500',
    barHover: 'hover:bg-emerald-400',
    header: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    headerMuted: 'text-emerald-700',
    chip: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    chipSoft: 'bg-emerald-100 text-emerald-700',
    card: 'border-emerald-200 bg-emerald-50',
    cardActive: 'border-emerald-300 bg-emerald-50 shadow-sm',
    text: 'text-emerald-800',
  },
  {
    bar: 'bg-violet-500',
    barHover: 'hover:bg-violet-400',
    header: 'border-violet-200 bg-violet-50 text-violet-900',
    headerMuted: 'text-violet-700',
    chip: 'border-violet-200 bg-violet-100 text-violet-800',
    chipSoft: 'bg-violet-100 text-violet-700',
    card: 'border-violet-200 bg-violet-50',
    cardActive: 'border-violet-300 bg-violet-50 shadow-sm',
    text: 'text-violet-800',
  },
  {
    bar: 'bg-amber-500',
    barHover: 'hover:bg-amber-400',
    header: 'border-amber-200 bg-amber-50 text-amber-900',
    headerMuted: 'text-amber-700',
    chip: 'border-amber-200 bg-amber-100 text-amber-800',
    chipSoft: 'bg-amber-100 text-amber-700',
    card: 'border-amber-200 bg-amber-50',
    cardActive: 'border-amber-300 bg-amber-50 shadow-sm',
    text: 'text-amber-800',
  },
  {
    bar: 'bg-cyan-500',
    barHover: 'hover:bg-cyan-400',
    header: 'border-cyan-200 bg-cyan-50 text-cyan-900',
    headerMuted: 'text-cyan-700',
    chip: 'border-cyan-200 bg-cyan-100 text-cyan-800',
    chipSoft: 'bg-cyan-100 text-cyan-700',
    card: 'border-cyan-200 bg-cyan-50',
    cardActive: 'border-cyan-300 bg-cyan-50 shadow-sm',
    text: 'text-cyan-800',
  },
];

export function annotationValueLabel(value: AnnotationValue): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : typeof item === 'object' && item && 'label' in item ? String(item.label) : 'item'))
      .join(', ');
  }

  if (value && typeof value === 'object' && 'relation' in value) {
    return String(value.relation);
  }

  return 'complex';
}

function fallbackHash(input: string): number {
  return Array.from(input).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function getSpanTone(label: string): SpanTone {
  if (/理解|定位|检索|准备/.test(label)) {
    return SPAN_TONES[0];
  }

  if (/复现|修复|实现|编码/.test(label)) {
    return SPAN_TONES[1];
  }

  if (/验证|清理|测试|回归/.test(label)) {
    return SPAN_TONES[2];
  }

  return SPAN_TONES[fallbackHash(label) % SPAN_TONES.length];
}

export function getAnnotationCountByStepId(annotations: Annotation[]): Record<string, number> {
  return annotations.reduce<Record<string, number>>((acc, annotation) => {
    if (annotation.target.type === 'step') {
      acc[annotation.target.stepId] = (acc[annotation.target.stepId] ?? 0) + 1;
    }

    return acc;
  }, {});
}

function getStepIndexMap(steps: Step[]): Record<string, number> {
  return steps.reduce<Record<string, number>>((acc, step) => {
    acc[step.id] = step.index;
    return acc;
  }, {});
}

export function buildTimelineSpanGroups(
  trajectory: Trajectory,
  annotationCountByStepId: Record<string, number>,
  selectedStepId: string,
): TimelineSpanGroup[] {
  const stepIndexMap = getStepIndexMap(trajectory.steps);

  return trajectory.annotations
    .filter((annotation): annotation is Annotation & { target: Extract<Annotation['target'], { type: 'span' }> } => annotation.target.type === 'span')
    .map((annotation) => {
      const startStepIndex = stepIndexMap[annotation.target.startStepId];
      const endStepIndex = stepIndexMap[annotation.target.endStepId];

      if (startStepIndex === undefined || endStepIndex === undefined) {
        return null;
      }

      const stepIds = trajectory.steps
        .filter((step) => step.index >= startStepIndex && step.index <= endStepIndex)
        .map((step) => step.id);

      const stepAnnotationCount = stepIds.reduce((total, stepId) => total + (annotationCountByStepId[stepId] ?? 0), 0);

      return {
        id: annotation.id,
        annotation,
        label: annotationValueLabel(annotation.value),
        rationale: annotation.rationale,
        startStepId: annotation.target.startStepId,
        endStepId: annotation.target.endStepId,
        startStepIndex,
        endStepIndex,
        stepIds,
        stepCount: stepIds.length,
        stepAnnotationCount,
        containsSelectedStep: stepIds.includes(selectedStepId),
      };
    })
    .filter((group): group is TimelineSpanGroup => Boolean(group))
    .sort((left, right) => left.startStepIndex - right.startStepIndex);
}

export function findCurrentSpanGroup(spanGroups: TimelineSpanGroup[], selectedStepId: string): TimelineSpanGroup | null {
  return spanGroups.find((group) => group.stepIds.includes(selectedStepId)) ?? null;
}
