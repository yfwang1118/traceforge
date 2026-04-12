import type { ReactNode } from 'react';
import { getSpanTone, type TimelineSpanGroup } from '@/lib/annotation-presentation';
import type { Step } from '@/types';

type StepTimelineProps = {
  steps: Step[];
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
  annotationCountByStepId?: Record<string, number>;
  spanGroups?: TimelineSpanGroup[];
  collapsedSpanIds?: string[];
  onToggleSpanCollapse?: (spanId: string) => void;
  onFocusSpan?: (spanId: string) => void;
};

const statusClassMap: Record<Step['status'], string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
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

function renderStepRow(
  step: Step,
  selectedStepId: string,
  onSelectStep: (stepId: string) => void,
  annotationCountByStepId: Record<string, number>,
) {
  const annotationCount = annotationCountByStepId[step.id] ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelectStep(step.id)}
      className={`w-full rounded border p-2 text-left text-xs transition ${
        selectedStepId === step.id
          ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-sm'
          : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          #{step.index} · {step.type}
        </span>
        <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${statusClassMap[step.status]}`}>{step.status}</span>
      </div>

      <p className="mt-1 max-h-9 overflow-hidden text-[12px] leading-4">{step.title}</p>

      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
        <span className="rounded bg-slate-100 px-1.5 py-0.5">role: {step.role ?? 'unknown'}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5">{formatTime(step.timestamp)}</span>
        {step.toolCalls?.length === 1 && step.toolName ? (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">tool: {step.toolName}</span>
        ) : null}
        {step.toolCalls?.length ? (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">calls: {step.toolCalls.length}</span>
        ) : null}
        {step.toolCalls && step.toolCalls.length > 1 ? (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">parallel</span>
        ) : null}
        {step.toolResults?.length ? (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">results: {step.toolResults.length}</span>
        ) : null}
        {step.toolUseResult !== undefined ? (
          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">toolUseResult</span>
        ) : null}
        {annotationCount > 0 ? (
          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-teal-700">annotations: {annotationCount}</span>
        ) : null}
      </div>
    </button>
  );
}

function renderCollapsedSpanGroup(
  group: TimelineSpanGroup,
  isCollapsed: boolean,
  onToggleSpanCollapse?: (spanId: string) => void,
  onFocusSpan?: (spanId: string) => void,
) {
  const tone = getSpanTone(group.label);

  return (
    <li key={group.id}>
      <div
        className={`rounded-xl border p-3 transition ${
          group.containsSelectedStep ? tone.cardActive : `${tone.card} hover:border-slate-300`
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onToggleSpanCollapse?.(group.id)}
            className="mt-0.5 shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            aria-label={isCollapsed ? `Expand span ${group.label}` : `Collapse span ${group.label}`}
          >
            {isCollapsed ? '展开' : '收起'}
          </button>

          <button type="button" onClick={() => onFocusSpan?.(group.id)} className="flex-1 text-left" title={group.label}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone.chip}`}>
                {group.label}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
                step #{group.startStepIndex}-{group.endStepIndex}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">{group.stepCount} steps</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${tone.chipSoft}`}>step ann {group.stepAnnotationCount}</span>
            </div>
            {group.rationale ? (
              <p className="mt-2 max-h-10 overflow-hidden text-[11px] leading-5 text-slate-600">{group.rationale}</p>
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
) {
  const tone = getSpanTone(group.label);

  return (
    <li key={group.id} className="relative pl-4">
      <button
        type="button"
        onClick={() => onToggleSpanCollapse?.(group.id)}
        title={group.label}
        aria-label={`Collapse span ${group.label}`}
        className={`peer absolute left-0 top-0 bottom-0 w-1.5 rounded-full transition ${
          group.containsSelectedStep ? tone.bar : `${tone.bar} ${tone.barHover}`
        }`}
      >
        <span className="sr-only">{group.label}</span>
      </button>

      <div className="pointer-events-none absolute left-4 top-1 z-10 rounded-full border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-700 opacity-0 shadow-sm transition duration-150 peer-hover:opacity-100 peer-focus-visible:opacity-100">
        {group.label}
      </div>

      <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2 py-1 text-[10px] ${tone.header}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 font-medium ${tone.chip}`}>{group.label}</span>
          <span className={`rounded-full bg-white/80 px-2 py-0.5 ${tone.headerMuted}`}>
            step #{group.startStepIndex}-{group.endStepIndex}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full bg-white/80 px-2 py-0.5 ${tone.headerMuted}`}>{group.stepCount} steps</span>
          <button
            type="button"
            onClick={() => onToggleSpanCollapse?.(group.id)}
            className="rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-white"
            aria-label={`Collapse span ${group.label}`}
          >
            收起
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>{renderStepRow(step, selectedStepId, onSelectStep, annotationCountByStepId)}</li>
        ))}
      </ul>
    </li>
  );
}

export function StepTimeline({
  steps,
  selectedStepId,
  onSelectStep,
  annotationCountByStepId = {},
  spanGroups = [],
  collapsedSpanIds = [],
  onToggleSpanCollapse,
  onFocusSpan,
}: StepTimelineProps) {
  const sortedSpanGroups = [...spanGroups].sort((left, right) => left.startStepIndex - right.startStepIndex);
  const collapsedSpanIdSet = new Set(collapsedSpanIds);

  const items: ReactNode[] = [];
  let nextStepIndex = 1;

  sortedSpanGroups.forEach((group) => {
    const ungroupedSteps = steps.filter((step) => step.index >= nextStepIndex && step.index < group.startStepIndex);

    ungroupedSteps.forEach((step) => {
      items.push(<li key={step.id}>{renderStepRow(step, selectedStepId, onSelectStep, annotationCountByStepId)}</li>);
    });

    const groupSteps = steps.filter((step) => step.index >= group.startStepIndex && step.index <= group.endStepIndex);
    const isCollapsed = collapsedSpanIdSet.has(group.id);

    items.push(
      isCollapsed
        ? renderCollapsedSpanGroup(group, isCollapsed, onToggleSpanCollapse, onFocusSpan)
        : renderExpandedSpanGroup(
            group,
            groupSteps,
            selectedStepId,
            onSelectStep,
            annotationCountByStepId,
            onToggleSpanCollapse,
          ),
    );

    nextStepIndex = group.endStepIndex + 1;
  });

  const trailingSteps = steps.filter((step) => step.index >= nextStepIndex);

  trailingSteps.forEach((step) => {
    items.push(<li key={step.id}>{renderStepRow(step, selectedStepId, onSelectStep, annotationCountByStepId)}</li>);
  });

  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-800">Step Timeline</h3>
      <p className="mb-3 text-xs text-slate-500">
        {steps.length} steps
        {spanGroups.length > 0 ? ` · ${spanGroups.length} spans` : ''}
      </p>
      <ul className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">{items}</ul>
    </aside>
  );
}
