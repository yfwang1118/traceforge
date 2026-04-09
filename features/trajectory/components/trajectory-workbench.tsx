'use client';

import { useEffect, useMemo, useReducer } from 'react';
import { AnnotationPanel, type AnnotationFormInput } from '@/features/annotation/components/annotation-panel';
import { StepDetail } from '@/features/trajectory/components/step-detail';
import { StepTimeline } from '@/features/trajectory/components/step-timeline';
import type { Annotation, EvidenceSpan, Step, TargetRef, Trajectory } from '@/types';

type TrajectoryWorkbenchProps = {
  trajectory: Trajectory;
};

type State = {
  selectedStepId: string;
  annotations: Annotation[];
  editingAnnotationId: string | null;
};

type Action =
  | { type: 'select_step'; stepId: string }
  | { type: 'select_prev'; stepIds: string[] }
  | { type: 'select_next'; stepIds: string[] }
  | { type: 'start_edit'; annotationId: string }
  | { type: 'cancel_edit' }
  | { type: 'create_annotation'; annotation: Annotation }
  | { type: 'update_annotation'; annotation: Annotation }
  | { type: 'delete_annotation'; annotationId: string };

export function TrajectoryWorkbench({ trajectory }: TrajectoryWorkbenchProps) {
  const [state, dispatch] = useReducer(reducer, {
    selectedStepId: trajectory.steps[0]?.id ?? '',
    annotations: trajectory.annotations,
    editingAnnotationId: null,
  });

  const selectedStep =
    trajectory.steps.find((step) => step.id === state.selectedStepId) ?? trajectory.steps[0] ?? emptyStep;

  const stepIds = useMemo(() => trajectory.steps.map((step) => step.id), [trajectory.steps]);


  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        dispatch({ type: 'select_prev', stepIds });
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        dispatch({ type: 'select_next', stepIds });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepIds]);

  return (
    <section className="grid min-h-[650px] grid-cols-12 gap-4" data-testid="trajectory-workbench">
      <div className="col-span-3">
        <StepTimeline
          steps={trajectory.steps}
          selectedStepId={state.selectedStepId}
          onSelectStep={(stepId) => dispatch({ type: 'select_step', stepId })}
          onSelectPrev={() => dispatch({ type: 'select_prev', stepIds })}
          onSelectNext={() => dispatch({ type: 'select_next', stepIds })}
        />
      </div>

      <div className="col-span-5">
        <StepDetail selectedStep={selectedStep} />
      </div>

      <div className="col-span-4">
        <AnnotationPanel
          trajectory={trajectory}
          selectedStepId={state.selectedStepId}
          annotations={state.annotations}
          editingAnnotationId={state.editingAnnotationId}
          onStartEdit={(annotationId) => dispatch({ type: 'start_edit', annotationId })}
          onCancelEdit={() => dispatch({ type: 'cancel_edit' })}
          onDelete={(annotationId) => dispatch({ type: 'delete_annotation', annotationId })}
          onJumpToStep={(stepId) => dispatch({ type: 'select_step', stepId })}
          onCreate={(input) => {
            const now = new Date().toISOString();
            dispatch({
              type: 'create_annotation',
              annotation: {
                id: `ann_${Date.now()}`,
                target: toTargetRef(input, trajectory.id),
                aspect: input.aspect,
                value: normalizeValue(input),
                confidence: normalizeConfidence(input.confidence),
                evidence: toEvidence(input, trajectory.id),
                provenance: {
                  source: input.provenanceSource,
                  authorId: 'local_researcher',
                },
                status: input.status,
                createdAt: now,
                updatedAt: now,
              },
            });
          }}
          onSaveEdit={(annotationId, input) => {
            const existing = state.annotations.find((item) => item.id === annotationId);
            if (!existing) return;

            dispatch({
              type: 'update_annotation',
              annotation: {
                ...existing,
                target: toTargetRef(input, trajectory.id),
                aspect: input.aspect,
                value: normalizeValue(input),
                confidence: normalizeConfidence(input.confidence),
                evidence: toEvidence(input, trajectory.id),
                provenance: {
                  ...existing.provenance,
                  source: input.provenanceSource,
                },
                status: input.status,
                updatedAt: new Date().toISOString(),
              },
            });
          }}
        />
      </div>
    </section>
  );
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'select_step':
      return { ...state, selectedStepId: action.stepId };
    case 'select_prev': {
      const currentIndex = action.stepIds.indexOf(state.selectedStepId);
      if (currentIndex <= 0) return state;
      return { ...state, selectedStepId: action.stepIds[currentIndex - 1] };
    }
    case 'select_next': {
      const currentIndex = action.stepIds.indexOf(state.selectedStepId);
      if (currentIndex === -1 || currentIndex >= action.stepIds.length - 1) return state;
      return { ...state, selectedStepId: action.stepIds[currentIndex + 1] };
    }
    case 'start_edit':
      return { ...state, editingAnnotationId: action.annotationId };
    case 'cancel_edit':
      return { ...state, editingAnnotationId: null };
    case 'create_annotation':
      return { ...state, annotations: [action.annotation, ...state.annotations] };
    case 'update_annotation':
      return {
        ...state,
        editingAnnotationId: null,
        annotations: state.annotations.map((item) => (item.id === action.annotation.id ? action.annotation : item)),
      };
    case 'delete_annotation':
      return {
        ...state,
        editingAnnotationId:
          state.editingAnnotationId === action.annotationId ? null : state.editingAnnotationId,
        annotations: state.annotations.filter((item) => item.id !== action.annotationId),
      };
    default:
      return state;
  }
}

function toTargetRef(input: AnnotationFormInput, trajectoryId: string): TargetRef {
  if (input.targetType === 'step') {
    return { type: 'step', trajectoryId, stepId: input.stepId };
  }
  if (input.targetType === 'span') {
    return {
      type: 'span',
      trajectoryId,
      startStepId: input.spanStartStepId,
      endStepId: input.spanEndStepId,
    };
  }

  return { type: 'trajectory', trajectoryId };
}

function toEvidence(input: AnnotationFormInput, trajectoryId: string): EvidenceSpan[] | undefined {
  if (input.evidenceMode === 'none') return undefined;

  if (input.evidenceMode === 'step') {
    return [
      {
        id: `ev_${Date.now()}`,
        type: 'step_excerpt',
        trajectoryId,
        stepId: input.evidenceStepId,
        note: `linked from step:${input.evidenceStepId}`,
      },
    ];
  }

  return [
    {
      id: `ev_${Date.now()}`,
      type: 'span_excerpt',
      trajectoryId,
      startStepId: input.evidenceSpanStartStepId,
      endStepId: input.evidenceSpanEndStepId,
      note: `linked from span:${input.evidenceSpanStartStepId}-${input.evidenceSpanEndStepId}`,
    },
  ];
}

function normalizeConfidence(value: string): number | undefined {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return undefined;
  return Math.max(0, Math.min(parsed, 1));
}

function normalizeValue(input: AnnotationFormInput): string | number {
  if (input.aspect === 'decision_criticality') {
    const n = Number(input.value);
    if (!Number.isNaN(n)) {
      return Math.max(1, Math.min(5, n));
    }
  }
  return input.value.trim();
}

const emptyStep: Step = {
  id: 'none',
  index: 0,
  type: 'observe',
  title: 'No step available',
  observation: 'N/A',
  action: 'N/A',
  metadata: {},
  status: 'warn',
};
