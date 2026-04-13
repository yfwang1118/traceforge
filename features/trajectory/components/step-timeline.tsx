import { useEffect, useRef, type ReactNode } from 'react';
import { getSpanTone, type TimelineSpanGroup } from '@/lib/annotation-presentation';
import {
  buildConversationRounds,
  getStepDisplayKind,
  getStepDisplayTitle,
  shouldShowStepRole,
  type ConversationRound,
} from '@/lib/trajectory-presentation';
import type { Step } from '@/types';

export type TimelineScrollRequest = {
  targetId: string;
  nonce: number;
};

type StepTimelineProps = {
  steps: Step[];
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
  annotationCountByStepId?: Record<string, number>;
  spanGroups?: TimelineSpanGroup[];
  conversationRounds?: ConversationRound[];
  collapsedSpanIds?: string[];
  collapsedRoundIds?: string[];
  onToggleSpanCollapse?: (spanId: string) => void;
  onToggleRoundCollapse?: (roundId: string) => void;
  onFocusSpan?: (spanId: string, preferredStepId?: string) => void;
  scrollRequest?: TimelineScrollRequest | null;
};

type StatusPresentation = {
  pill: string;
  dot: string;
  label: string;
};

const statusClassMap: Record<Step['status'], StatusPresentation> = {
  ok: {
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'ok',
  },
  warn: {
    pill: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    label: 'warn',
  },
  error: {
    pill: 'border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    label: 'error',
  },
};

const displayKindClassMap: Record<string, string> = {
  prompt: 'bg-sky-100 text-sky-700',
  action: 'bg-indigo-100 text-indigo-700',
  analysis: 'bg-amber-100 text-amber-700',
  plan: 'bg-cyan-100 text-cyan-700',
  response: 'bg-emerald-100 text-emerald-700',
  context: 'bg-slate-100 text-slate-700',
};

const roleClassMap: Record<'system' | 'user' | 'unknown', string> = {
  system: 'border-amber-200 bg-amber-50 text-amber-700',
  user: 'border-slate-200 bg-slate-50 text-slate-700',
  unknown: 'border-slate-200 bg-slate-50 text-slate-500',
};

function formatTime(timestamp?: string): string {
  if (!timestamp) {
    return '--';
  }

  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatStepIndex(index: number): string {
  return index.toString().padStart(2, '0');
}

function formatStepRange(start: number, end: number): string {
  return `${formatStepIndex(start)}-${formatStepIndex(end)}`;
}

function MetaChip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-600 ${className}`}>
      {children}
    </span>
  );
}

function StepOrdinalBadge({ index, selected }: { index: number; selected: boolean }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border transition ${
        selected
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_24px_50px_-28px_rgba(15,23,42,0.85)]'
          : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.26em] opacity-70">step</span>
      <span className="mt-1 text-sm font-semibold tracking-[0.08em]">{formatStepIndex(index)}</span>
    </div>
  );
}

function renderStepRow(
  step: Step,
  selectedStepId: string,
  onSelectStep: (stepId: string) => void,
  annotationCountByStepId: Record<string, number>,
) {
  const annotationCount = annotationCountByStepId[step.id] ?? 0;
  const isSelected = selectedStepId === step.id;
  const statusTone = statusClassMap[step.status];
  const displayKind = getStepDisplayKind(step);
  const stepRole = step.role === 'system' || step.role === 'user' || step.role === 'unknown' ? step.role : null;
  const toolNames = (step.toolCalls ?? []).map((call) => call.name).filter((name, index, names) => names.indexOf(name) === index);

  return (
    <button
      type="button"
      onClick={() => onSelectStep(step.id)}
      className={`group relative w-full overflow-hidden rounded-[24px] border px-3.5 py-3.5 text-left transition duration-200 ${
        isSelected
          ? 'border-slate-900/10 bg-white shadow-[0_28px_50px_-30px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5'
          : 'border-white/80 bg-white/75 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.35)] hover:border-slate-200 hover:bg-white'
      }`}
    >
      <div
        className={`absolute inset-x-4 top-0 h-px transition ${
          isSelected ? 'bg-gradient-to-r from-amber-300 via-sky-300 to-teal-300' : 'bg-transparent group-hover:bg-slate-200'
        }`}
      />

      <div className="flex items-start gap-3">
        <StepOrdinalBadge index={step.index} selected={isSelected} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    displayKindClassMap[displayKind] ?? displayKindClassMap.context
                  }`}
                >
                  {displayKind}
                </span>
                {annotationCount > 0 ? <MetaChip className="border-teal-100 bg-teal-50 text-teal-700">annotations {annotationCount}</MetaChip> : null}
              </div>
              <p className="mt-2 max-h-12 overflow-hidden text-[13px] font-medium leading-6 text-slate-800">{getStepDisplayTitle(step)}</p>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusTone.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
              {statusTone.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {shouldShowStepRole(step) && stepRole ? <MetaChip className={roleClassMap[stepRole]}>{stepRole}</MetaChip> : null}
            <MetaChip>{formatTime(step.timestamp)}</MetaChip>
            {toolNames.length === 1 ? <MetaChip className="border-indigo-200 bg-indigo-50 text-indigo-700">{toolNames[0]}</MetaChip> : null}
            {step.toolCalls?.length ? (
              <MetaChip className="border-indigo-200 bg-indigo-50 text-indigo-700">
                {step.toolCalls.length === 1 ? '1 call' : `${step.toolCalls.length} calls`}
              </MetaChip>
            ) : null}
            {step.toolCalls && step.toolCalls.length > 1 ? <MetaChip className="border-indigo-200 bg-indigo-50 text-indigo-700">parallel</MetaChip> : null}
            {step.toolResults?.length ? (
              <MetaChip className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700">
                {step.toolResults.length === 1 ? '1 result' : `${step.toolResults.length} results`}
              </MetaChip>
            ) : null}
            {step.toolUseResult !== undefined ? (
              <MetaChip className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700">payload</MetaChip>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function renderCollapsedSpanGroup(
  group: TimelineSpanGroup,
  isCollapsed: boolean,
  onToggleSpanCollapse?: (spanId: string) => void,
  onFocusSpan?: (spanId: string, preferredStepId?: string) => void,
  itemRef?: (node: HTMLLIElement | null) => void,
) {
  const tone = getSpanTone(group.label);

  return (
    <li key={group.id} ref={itemRef}>
      <div
        className={`overflow-hidden rounded-[24px] border p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.35)] transition ${
          group.containsSelectedStep ? tone.cardActive : `${tone.card} hover:border-slate-300`
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleSpanCollapse?.(group.id)}
            className="mt-0.5 shrink-0 rounded-full border border-white/90 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.5)] hover:bg-white"
            aria-label={isCollapsed ? `Expand span ${group.label}` : `Collapse span ${group.label}`}
          >
            {isCollapsed ? '展开' : '收起'}
          </button>

          <button type="button" onClick={() => onFocusSpan?.(group.id, group.startStepId)} className="flex-1 text-left" title={group.label}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.chip}`}>
                {group.label}
              </span>
              {group.isAutoGenerated ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">
                  auto coverage
                </span>
              ) : null}
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                steps {formatStepRange(group.startStepIndex, group.endStepIndex)}
              </span>
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-600">{group.stepCount} steps</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${tone.chipSoft}`}>annotations {group.stepAnnotationCount}</span>
            </div>
            {group.rationale ? (
              <p className="mt-3 max-h-11 overflow-hidden text-[12px] leading-5 text-slate-600">{group.rationale}</p>
            ) : null}
          </button>
        </div>
      </div>
    </li>
  );
}

function renderExpandedSpanGroup(
  group: TimelineSpanGroup,
  steps: Step[],
  selectedStepId: string,
  onSelectStep: (stepId: string) => void,
  annotationCountByStepId: Record<string, number>,
  onToggleSpanCollapse?: (spanId: string) => void,
  itemRef?: (node: HTMLLIElement | null) => void,
  stepItemRef?: (stepId: string) => (node: HTMLLIElement | null) => void,
) {
  const tone = getSpanTone(group.label);

  return (
    <li key={group.id} ref={itemRef} className="relative pl-5">
      <button
        type="button"
        onClick={() => onToggleSpanCollapse?.(group.id)}
        title={group.label}
        aria-label={`Collapse span ${group.label}`}
        className={`peer absolute bottom-0 left-0 top-0 w-2 rounded-full transition ${group.containsSelectedStep ? tone.bar : `${tone.bar} ${tone.barHover}`}`}
      >
        <span className="sr-only">{group.label}</span>
      </button>

      <div className="pointer-events-none absolute left-5 top-2 z-10 rounded-full border border-white/90 bg-white/95 px-2.5 py-1 text-[10px] font-medium text-slate-700 opacity-0 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.5)] transition duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
        {group.label}
      </div>

      <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[22px] border px-3 py-2.5 text-[10px] shadow-[0_16px_28px_-24px_rgba(15,23,42,0.35)] ${tone.header}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 font-semibold uppercase tracking-[0.16em] ${tone.chip}`}>{group.label}</span>
          {group.isAutoGenerated ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700">
              auto coverage
            </span>
          ) : null}
          <span className={`rounded-full bg-white/85 px-2.5 py-1 font-medium ${tone.headerMuted}`}>
            steps {formatStepRange(group.startStepIndex, group.endStepIndex)}
          </span>
          <span className={`rounded-full bg-white/85 px-2.5 py-1 font-medium ${tone.headerMuted}`}>{group.stepCount} steps</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleSpanCollapse?.(group.id)}
          className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-white"
          aria-label={`Collapse span ${group.label}`}
        >
          收起阶段
        </button>
      </div>

      <ul className="space-y-2.5">
        {steps.map((step) => (
          <li key={step.id} ref={stepItemRef?.(step.id)}>
            {renderStepRow(step, selectedStepId, onSelectStep, annotationCountByStepId)}
          </li>
        ))}
      </ul>
    </li>
  );
}

function buildStepItemsForSegment(
  steps: Step[],
  spanGroups: TimelineSpanGroup[],
  selectedStepId: string,
  onSelectStep: (stepId: string) => void,
  annotationCountByStepId: Record<string, number>,
  collapsedSpanIdSet: Set<string>,
  onToggleSpanCollapse?: (spanId: string) => void,
  onFocusSpan?: (spanId: string, preferredStepId?: string) => void,
  setItemRef?: (itemId: string) => (node: HTMLLIElement | null) => void,
): ReactNode[] {
  const visibleSteps = steps.filter((step) => step.role !== 'user');
  const sortedSpanGroups = [...spanGroups].sort((left, right) => left.startStepIndex - right.startStepIndex);
  const items: ReactNode[] = [];
  let nextStepIndex = visibleSteps[0]?.index ?? 1;

  sortedSpanGroups.forEach((group) => {
    const ungroupedSteps = visibleSteps.filter((step) => step.index >= nextStepIndex && step.index < group.startStepIndex);

    ungroupedSteps.forEach((step) => {
      items.push(
        <li key={step.id} ref={setItemRef?.(step.id)}>
          {renderStepRow(step, selectedStepId, onSelectStep, annotationCountByStepId)}
        </li>,
      );
    });

    const groupSteps = visibleSteps.filter((step) => step.index >= group.startStepIndex && step.index <= group.endStepIndex);
    const isCollapsed = collapsedSpanIdSet.has(group.id);

    items.push(
      isCollapsed
        ? renderCollapsedSpanGroup(group, isCollapsed, onToggleSpanCollapse, onFocusSpan, setItemRef?.(group.id))
        : renderExpandedSpanGroup(
            group,
            groupSteps,
            selectedStepId,
            onSelectStep,
            annotationCountByStepId,
            onToggleSpanCollapse,
            setItemRef?.(group.id),
            setItemRef,
          ),
    );

    nextStepIndex = group.endStepIndex + 1;
  });

  const trailingSteps = visibleSteps.filter((step) => step.index >= nextStepIndex);

  trailingSteps.forEach((step) => {
    items.push(
      <li key={step.id} ref={setItemRef?.(step.id)}>
        {renderStepRow(step, selectedStepId, onSelectStep, annotationCountByStepId)}
      </li>,
    );
  });

  return items;
}

function clipSpanGroupsForRound(
  round: ConversationRound,
  roundSteps: Step[],
  spanGroups: TimelineSpanGroup[],
  annotationCountByStepId: Record<string, number>,
  selectedStepId: string,
): TimelineSpanGroup[] {
  return spanGroups
    .filter((group) => group.endStepIndex >= round.startStepIndex && group.startStepIndex <= round.endStepIndex)
    .map((group) => {
      const clippedStart = Math.max(group.startStepIndex, round.startStepIndex);
      const clippedEnd = Math.min(group.endStepIndex, round.endStepIndex);
      const clippedStepIds = roundSteps
        .filter((step) => step.index >= clippedStart && step.index <= clippedEnd)
        .map((step) => step.id);

      if (clippedStepIds.length === 0) {
        return null;
      }

      const clippedStepAnnotationCount = clippedStepIds.reduce((total, stepId) => total + (annotationCountByStepId[stepId] ?? 0), 0);

      return {
        ...group,
        startStepId: clippedStepIds[0],
        endStepId: clippedStepIds[clippedStepIds.length - 1],
        startStepIndex: clippedStart,
        endStepIndex: clippedEnd,
        stepIds: clippedStepIds,
        stepCount: clippedStepIds.length,
        stepAnnotationCount: clippedStepAnnotationCount,
        containsSelectedStep: clippedStepIds.includes(selectedStepId),
      };
    })
    .filter((group): group is TimelineSpanGroup => group !== null);
}

function ConversationRoundCard({
  round,
  selectedStepId,
  onSelectStep,
  roundSpanCount,
  isCollapsed,
  onToggleRoundCollapse,
  bodyItems,
  itemRef,
}: {
  round: ConversationRound;
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
  roundSpanCount: number;
  isCollapsed: boolean;
  onToggleRoundCollapse?: (roundId: string) => void;
  bodyItems: ReactNode[];
  itemRef?: (node: HTMLLIElement | null) => void;
}) {
  const isSelected = round.containsSelectedStep;
  const leadSelected = selectedStepId === round.leadStepId;

  return (
    <li ref={itemRef} className="space-y-3">
      <div
        className={`overflow-hidden rounded-[26px] border p-4 shadow-[0_24px_48px_-38px_rgba(15,23,42,0.38)] transition ${
          isSelected ? 'border-sky-200 bg-sky-50/80 ring-1 ring-sky-100' : 'border-white/80 bg-white/82'
        }`}
      >
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => onSelectStep(round.leadStepId)} className="min-w-0 flex-1 text-left">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border ${
                  leadSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-sky-200 bg-white text-slate-800'
                }`}
              >
                <span className="text-[8px] font-semibold uppercase tracking-[0.26em] opacity-70">round</span>
                <span className="mt-1 text-sm font-semibold tracking-[0.08em]">
                  {round.kind === 'user_turn' ? String(round.roundIndex).padStart(2, '0') : '00'}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {round.kind === 'user_turn' ? 'dialogue round' : 'setup'}
                  </span>
                  <MetaChip>{round.label}</MetaChip>
                  <MetaChip>steps {formatStepRange(round.startStepIndex, round.endStepIndex)}</MetaChip>
                </div>
                <p className="mt-3 text-[14px] font-medium leading-6 text-slate-900">{round.promptPreview}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <MetaChip>{round.actionStepCount} actions</MetaChip>
                  {roundSpanCount > 0 ? <MetaChip>{roundSpanCount} phases</MetaChip> : null}
                  {round.stepCount > 1 ? <MetaChip>{round.stepCount - 1} jumps</MetaChip> : <MetaChip>0 jumps</MetaChip>}
                  {round.kind === 'user_turn' ? <MetaChip className="border-slate-200 bg-slate-50 text-slate-700">user prompt</MetaChip> : null}
                </div>
              </div>
            </div>
          </button>

          {onToggleRoundCollapse ? (
            <button
              type="button"
              onClick={() => onToggleRoundCollapse(round.id)}
              className="mt-0.5 shrink-0 rounded-full border border-white/90 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.5)] hover:bg-white"
              aria-label={isCollapsed ? `Expand round ${round.label}` : `Collapse round ${round.label}`}
            >
              {isCollapsed ? '展开轮次' : '收起轮次'}
            </button>
          ) : null}
        </div>
      </div>

      {!isCollapsed && bodyItems.length > 0 ? <ul className="space-y-2.5 pl-3">{bodyItems}</ul> : null}
    </li>
  );
}

export function StepTimeline({
  steps,
  selectedStepId,
  onSelectStep,
  annotationCountByStepId = {},
  spanGroups = [],
  conversationRounds,
  collapsedSpanIds = [],
  collapsedRoundIds = [],
  onToggleSpanCollapse,
  onToggleRoundCollapse,
  onFocusSpan,
  scrollRequest,
}: StepTimelineProps) {
  const rounds = conversationRounds ?? buildConversationRounds(steps, selectedStepId);
  const collapsedSpanIdSet = new Set(collapsedSpanIds);
  const collapsedRoundIdSet = new Set(collapsedRoundIds);
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefMap = useRef<Record<string, HTMLLIElement | null>>({});
  const annotatedStepCount = Object.values(annotationCountByStepId).filter((count) => count > 0).length;
  const roundJumpCount = Math.max(rounds.length - 1, 0);

  const setItemRef = (itemId: string) => (node: HTMLLIElement | null) => {
    itemRefMap.current[itemId] = node;
  };

  const setItemRefAlias = (itemIds: string[]) => (node: HTMLLIElement | null) => {
    itemIds.forEach((itemId) => {
      itemRefMap.current[itemId] = node;
    });
  };

  useEffect(() => {
    if (!scrollRequest) {
      return;
    }

    const targetNode = itemRefMap.current[scrollRequest.targetId];
    const listNode = listRef.current;

    if (!targetNode || !listNode) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const listRect = listNode.getBoundingClientRect();
      const targetRect = targetNode.getBoundingClientRect();
      const targetTop = listNode.scrollTop + (targetRect.top - listRect.top);
      const paddingTop = 8;

      listNode.scrollTo({
        top: Math.max(targetTop - paddingTop, 0),
        behavior: 'smooth',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [scrollRequest]);

  return (
    <aside className="h-full overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Step Timeline</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">先按对话轮次理解用户意图，再进入阶段与局部动作，默认省略 assistant/tool 角色噪声。</p>
        </div>

        <div className="grid min-w-[220px] flex-1 gap-2 sm:max-w-[420px] sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Steps</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{steps.length}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Rounds</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{rounds.length}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Phases</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{spanGroups.length}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Jumps</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{roundJumpCount}</p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Annotated</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{annotatedStepCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.9))] p-2 ring-1 ring-white/80">
        <ul ref={listRef} className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
          {rounds.map((round) => {
            const roundSteps = steps.filter((step) => round.stepIds.includes(step.id));
            const roundSpanGroups = clipSpanGroupsForRound(
              round,
              roundSteps,
              spanGroups,
              annotationCountByStepId,
              selectedStepId,
            );
            const isRoundCollapsed = collapsedRoundIdSet.has(round.id);
            const bodyItems = isRoundCollapsed
              ? []
              : buildStepItemsForSegment(
                  roundSteps,
                  roundSpanGroups,
                  selectedStepId,
                  onSelectStep,
                  annotationCountByStepId,
                  collapsedSpanIdSet,
                  onToggleSpanCollapse,
                  onFocusSpan,
                  setItemRef,
                );

            return (
              <ConversationRoundCard
                key={round.id}
                round={round}
                selectedStepId={selectedStepId}
                onSelectStep={onSelectStep}
                roundSpanCount={roundSpanGroups.length}
                isCollapsed={isRoundCollapsed}
                onToggleRoundCollapse={onToggleRoundCollapse}
                bodyItems={bodyItems}
                itemRef={setItemRefAlias([round.id, round.leadStepId])}
              />
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
