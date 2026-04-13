'use client';

import { useMemo, useState } from 'react';
import { AnnotationSummaryStrip } from '@/features/annotation/components/annotation-summary-strip';
import { AnnotationPanel } from '@/features/annotation/components/annotation-panel';
import type { AnnotationPanelScope } from '@/features/annotation/components/annotation-panel';
import { StepDetail } from '@/features/trajectory/components/step-detail';
import { StepTimeline, type TimelineScrollRequest } from '@/features/trajectory/components/step-timeline';
import {
  buildRoundAnnotationGroups,
  buildTimelineSpanGroups,
  findCurrentRoundGroup,
  findCurrentSpanGroup,
  getAnnotationCountByTargetType,
  getAnnotationCountByStepId,
} from '@/lib/annotation-presentation';
import { buildConversationRounds, countConversationJumps } from '@/lib/trajectory-presentation';
import type { Trajectory } from '@/types';

type TrajectoryReviewWorkspaceProps = {
  trajectory: Trajectory;
};

export function TrajectoryReviewWorkspace({ trajectory }: TrajectoryReviewWorkspaceProps) {
  const [selectedStepId, setSelectedStepId] = useState(trajectory.steps[0]?.id ?? '');
  const [isAnnotationPanelOpen, setIsAnnotationPanelOpen] = useState(false);
  const [annotationScope, setAnnotationScope] = useState<AnnotationPanelScope>('step');
  const [collapsedSpanIds, setCollapsedSpanIds] = useState<string[]>([]);
  const [collapsedRoundIds, setCollapsedRoundIds] = useState<string[]>([]);
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
  const conversationRounds = useMemo(
    () => buildConversationRounds(trajectory.steps, selectedStep?.id ?? ''),
    [selectedStep?.id, trajectory.steps],
  );
  const roundGroups = useMemo(
    () => buildRoundAnnotationGroups(conversationRounds, trajectory.annotations),
    [conversationRounds, trajectory.annotations],
  );
  const currentRoundGroup = useMemo(
    () => findCurrentRoundGroup(roundGroups, selectedStepId),
    [roundGroups, selectedStepId],
  );
  const conversationJumpCount = useMemo(() => countConversationJumps(conversationRounds), [conversationRounds]);
  const selectedStepAnnotationCount = selectedStep ? (annotationCountByStepId[selectedStep.id] ?? 0) : 0;
  const totalStepAnnotationCount = getAnnotationCountByTargetType(trajectory.annotations, 'step');
  const roundAnnotationCount = getAnnotationCountByTargetType(trajectory.annotations, 'round');
  const spanAnnotationCount = getAnnotationCountByTargetType(trajectory.annotations, 'span');
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

  const toggleRoundCollapse = (roundId: string) => {
    setCollapsedRoundIds((current) => (current.includes(roundId) ? current.filter((id) => id !== roundId) : [...current, roundId]));
  };

  const focusSpan = (spanId: string, preferredStepId?: string) => {
    const group = spanGroups.find((item) => item.id === spanId);

    if (!group) {
      return;
    }

    const targetStepId = preferredStepId && group.stepIds.includes(preferredStepId) ? preferredStepId : group.startStepId;

    setSelectedStepId(targetStepId);
    setCollapsedRoundIds((current) => {
      const containingRound = conversationRounds.find((round) => round.stepIds.includes(targetStepId));
      if (!containingRound || !current.includes(containingRound.id)) {
        return current;
      }

      return current.filter((id) => id !== containingRound.id);
    });
    setCollapsedSpanIds((current) => current.filter((id) => id !== spanId));
    setTimelineScrollRequest({
      targetId: targetStepId,
      nonce: Date.now(),
    });
  };

  const focusRound = (roundId: string, preferredStepId?: string) => {
    const group = roundGroups.find((item) => item.round.id === roundId);

    if (!group) {
      return;
    }

    const targetStepId =
      preferredStepId && group.round.stepIds.includes(preferredStepId) ? preferredStepId : group.round.leadStepId;

    setSelectedStepId(targetStepId);
    setCollapsedRoundIds((current) => current.filter((id) => id !== roundId));
    setTimelineScrollRequest({
      targetId: targetStepId,
      nonce: Date.now(),
    });
  };

  return (
    <>
      <AnnotationSummaryStrip
        selectedStep={selectedStep}
        trajectoryAnnotations={trajectoryAnnotations}
        currentRoundGroup={currentRoundGroup}
        roundGroups={roundGroups}
        currentSpanGroup={currentSpanGroup}
        spanGroups={spanGroups}
        totalStepAnnotationCount={totalStepAnnotationCount}
        currentStepAnnotationCount={selectedStepAnnotationCount}
        roundAnnotationCount={roundAnnotationCount}
        spanAnnotationCount={spanAnnotationCount}
        trajectoryAnnotationCount={trajectoryAnnotations.length}
        conversationRoundCount={conversationRounds.length}
        conversationJumpCount={conversationJumpCount}
        onFocusRound={focusRound}
        onFocusSpan={focusSpan}
        onOpenStepAnnotations={() => openAnnotationPanel('step')}
        onOpenRoundAnnotations={() => openAnnotationPanel('round')}
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
            conversationRounds={conversationRounds}
            roundGroups={roundGroups}
            collapsedSpanIds={collapsedSpanIds}
            collapsedRoundIds={collapsedRoundIds}
            onToggleSpanCollapse={toggleSpanCollapse}
            onToggleRoundCollapse={toggleRoundCollapse}
            onFocusSpan={focusSpan}
            scrollRequest={timelineScrollRequest}
          />
        </div>
        <div className="xl:col-span-8">
          <StepDetail
            trajectory={trajectory}
            selectedStep={selectedStep}
            currentRoundGroup={currentRoundGroup}
            onOpenAnnotation={() => openAnnotationPanel('step')}
          />
        </div>
      </section>

      <AnnotationPanel
        trajectory={trajectory}
        annotations={trajectory.annotations}
        selectedStep={selectedStep}
        currentRoundGroup={currentRoundGroup}
        currentSpanGroup={currentSpanGroup}
        isOpen={isAnnotationPanelOpen}
        scope={annotationScope}
        onScopeChange={setAnnotationScope}
        onClose={() => setIsAnnotationPanelOpen(false)}
      />
    </>
  );
}
