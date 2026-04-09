'use client';

import { useMemo, useState } from 'react';
import type { Trajectory } from '@/types';
import { AnnotationPanel } from '@/features/annotation/components/annotation-panel';
import { StepDetail } from '@/features/trajectory/components/step-detail';
import { StepTimeline } from '@/features/trajectory/components/step-timeline';

type TrajectoryReviewWorkspaceProps = {
  trajectory: Trajectory;
};

export function TrajectoryReviewWorkspace({ trajectory }: TrajectoryReviewWorkspaceProps) {
  const [selectedStepId, setSelectedStepId] = useState(trajectory.steps[0]?.id ?? '');

  const selectedStep = useMemo(
    () => trajectory.steps.find((step) => step.id === selectedStepId) ?? trajectory.steps[0],
    [selectedStepId, trajectory.steps],
  );

  if (!selectedStep) {
    return null;
  }

  return (
    <section className="grid min-h-[560px] grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-3">
        <StepTimeline steps={trajectory.steps} selectedStepId={selectedStep.id} onSelectStep={setSelectedStepId} />
      </div>
      <div className="xl:col-span-6">
        <StepDetail trajectory={trajectory} selectedStep={selectedStep} />
      </div>
      <div className="xl:col-span-3">
        <AnnotationPanel trajectory={trajectory} annotations={trajectory.annotations} />
      </div>
    </section>
  );
}
