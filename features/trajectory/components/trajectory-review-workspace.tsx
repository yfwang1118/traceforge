'use client';

import { useMemo, useState } from 'react';
import type { Trajectory } from '@/types';
import { AnnotationPanel } from '@/features/annotation/components/annotation-panel';
import type { AnnotationPanelScope } from '@/features/annotation/components/annotation-panel';
import { StepDetail } from '@/features/trajectory/components/step-detail';
import { StepTimeline } from '@/features/trajectory/components/step-timeline';

type TrajectoryReviewWorkspaceProps = {
  trajectory: Trajectory;
};

export function TrajectoryReviewWorkspace({ trajectory }: TrajectoryReviewWorkspaceProps) {
  const [selectedStepId, setSelectedStepId] = useState(trajectory.steps[0]?.id ?? '');
  const [isAnnotationPanelOpen, setIsAnnotationPanelOpen] = useState(false);
  const [annotationScope, setAnnotationScope] = useState<AnnotationPanelScope>('step');

  const selectedStep = useMemo(
    () => trajectory.steps.find((step) => step.id === selectedStepId) ?? trajectory.steps[0],
    [selectedStepId, trajectory.steps],
  );
  const annotationCountByStepId = useMemo(() => {
    return trajectory.annotations.reduce<Record<string, number>>((acc, annotation) => {
      if (annotation.target.type === 'step') {
        acc[annotation.target.stepId] = (acc[annotation.target.stepId] ?? 0) + 1;
      }
      return acc;
    }, {});
  }, [trajectory.annotations]);
  const selectedStepAnnotationCount = selectedStep ? (annotationCountByStepId[selectedStep.id] ?? 0) : 0;
  const trajectoryAnnotationCount = trajectory.annotations.filter((annotation) => annotation.target.type === 'trajectory').length;

  if (!selectedStep) {
    return null;
  }

  return (
    <>
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Review Focus</h3>
            <p className="mt-1 text-xs text-slate-600">
              默认专注轨迹阅读，标注在需要时打开。当前 step #{selectedStep.index} 有 {selectedStepAnnotationCount} 条标注。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAnnotationScope('step');
                setIsAnnotationPanelOpen(true);
              }}
              className="rounded border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
            >
              标注当前 Step ({selectedStepAnnotationCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setAnnotationScope('trajectory');
                setIsAnnotationPanelOpen(true);
              }}
              className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
            >
              查看轨迹标注 ({trajectoryAnnotationCount})
            </button>
          </div>
        </div>
      </section>

      <section className="grid min-h-[560px] grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <StepTimeline
            steps={trajectory.steps}
            selectedStepId={selectedStep.id}
            onSelectStep={setSelectedStepId}
            annotationCountByStepId={annotationCountByStepId}
          />
        </div>
        <div className="xl:col-span-8">
          <StepDetail
            trajectory={trajectory}
            selectedStep={selectedStep}
            onOpenAnnotation={() => {
              setAnnotationScope('step');
              setIsAnnotationPanelOpen(true);
            }}
          />
        </div>
      </section>

      <AnnotationPanel
        trajectory={trajectory}
        annotations={trajectory.annotations}
        selectedStep={selectedStep}
        isOpen={isAnnotationPanelOpen}
        scope={annotationScope}
        onScopeChange={setAnnotationScope}
        onClose={() => setIsAnnotationPanelOpen(false)}
      />
    </>
  );
}
