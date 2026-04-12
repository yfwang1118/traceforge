'use client';

import { useMemo, useState } from 'react';
import { AnnotationSummaryStrip } from '@/features/annotation/components/annotation-summary-strip';
import { AnnotationPanel } from '@/features/annotation/components/annotation-panel';
import type { AnnotationPanelScope } from '@/features/annotation/components/annotation-panel';
import { StepDetail } from '@/features/trajectory/components/step-detail';
import { StepTimeline, type TimelineScrollRequest } from '@/features/trajectory/components/step-timeline';
import {
  buildTimelineSpanGroups,
  findCurrentSpanGroup,
  getAnnotationCountByStepId,
} from '@/lib/annotation-presentation';
import type { Trajectory } from '@/types';

type TrajectoryReviewWorkspaceProps = {
  trajectory: Trajectory;
};

export function TrajectoryReviewWorkspace({ trajectory }: TrajectoryReviewWorkspaceProps) {
  const [selectedStepId, setSelectedStepId] = useState(trajectory.steps[0]?.id ?? '');
  const [isAnnotationPanelOpen, setIsAnnotationPanelOpen] = useState(false);
  const [annotationScope, setAnnotationScope] = useState<AnnotationPanelScope>('step');
  const [collapsedSpanIds, setCollapsedSpanIds] = useState<string[]>([]);
  const [timelineScrollRequest, setTimelineScrollRequest] = useState<TimelineScrollRequest | null>(null);

  const selectedStep = useMemo(
    () => trajectory.steps.find((step) => step.id === selectedStepId) ?? trajectory.steps[0],
    [selectedStepId, trajectory.steps],
  );
  const annotationCountByStepId = useMemo(() => getAnnotationCountByStepId(trajectory.annotations), [trajectory.annotations]);
  const spanGroups = useMemo(
    () => buildTimelineSpanGroups(trajectory, annotationCountByStepId, selectedStepId),
    [annotationCountByStepId, selectedStepId, trajectory],
  );
  const currentSpanGroup = useMemo(() => findCurrentSpanGroup(spanGroups, selectedStepId), [selectedStepId, spanGroups]);
  const selectedStepAnnotationCount = selectedStep ? (annotationCountByStepId[selectedStep.id] ?? 0) : 0;
  const totalStepAnnotationCount = trajectory.annotations.filter((annotation) => annotation.target.type === 'step').length;
  const spanAnnotationCount = trajectory.annotations.filter((annotation) => annotation.target.type === 'span').length;
  const trajectoryAnnotations = trajectory.annotations.filter((annotation) => annotation.target.type === 'trajectory');

  if (!selectedStep) {
    return null;
  }

  const openAnnotationPanel = (scope: AnnotationPanelScope) => {
    setAnnotationScope(scope);
    setIsAnnotationPanelOpen(true);
  };

  const toggleSpanCollapse = (spanId: string) => {
    setCollapsedSpanIds((current) => (current.includes(spanId) ? current.filter((id) => id !== spanId) : [...current, spanId]));
  };

  const focusSpan = (spanId: string) => {
    const group = spanGroups.find((item) => item.id === spanId);

    if (!group) {
      return;
    }

    setSelectedStepId(group.startStepId);
    setCollapsedSpanIds((current) => current.filter((id) => id !== spanId));
    setTimelineScrollRequest({
      targetId: group.startStepId,
      nonce: Date.now(),
    });
  };

  return (
    <>
      <AnnotationSummaryStrip
        selectedStep={selectedStep}
        trajectoryAnnotations={trajectoryAnnotations}
        currentSpanGroup={currentSpanGroup}
        spanGroups={spanGroups}
        totalStepAnnotationCount={totalStepAnnotationCount}
        currentStepAnnotationCount={selectedStepAnnotationCount}
        spanAnnotationCount={spanAnnotationCount}
        trajectoryAnnotationCount={trajectoryAnnotations.length}
        onFocusSpan={focusSpan}
        onOpenStepAnnotations={() => openAnnotationPanel('step')}
        onOpenSpanAnnotations={() => openAnnotationPanel('span')}
        onOpenTrajectoryAnnotations={() => openAnnotationPanel('trajectory')}
      />

      <section className="grid min-h-[560px] grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <StepTimeline
            steps={trajectory.steps}
            selectedStepId={selectedStep.id}
            onSelectStep={setSelectedStepId}
            annotationCountByStepId={annotationCountByStepId}
            spanGroups={spanGroups}
            collapsedSpanIds={collapsedSpanIds}
            onToggleSpanCollapse={toggleSpanCollapse}
            onFocusSpan={focusSpan}
            scrollRequest={timelineScrollRequest}
          />
        </div>
        <div className="xl:col-span-8">
          <StepDetail
            trajectory={trajectory}
            selectedStep={selectedStep}
            onOpenAnnotation={() => openAnnotationPanel('step')}
          />
        </div>
      </section>

      <AnnotationPanel
        trajectory={trajectory}
        annotations={trajectory.annotations}
        selectedStep={selectedStep}
        currentSpanGroup={currentSpanGroup}
        isOpen={isAnnotationPanelOpen}
        scope={annotationScope}
        onScopeChange={setAnnotationScope}
        onClose={() => setIsAnnotationPanelOpen(false)}
      />
    </>
  );
}
