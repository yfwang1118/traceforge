import { annotationValueLabel, type TimelineSpanGroup } from '@/lib/annotation-presentation';
import type { Annotation, Step, Trajectory } from '@/types';

type AnnotationPanelProps = {
  trajectory: Trajectory;
  annotations: Annotation[];
  selectedStep: Step;
  currentSpanGroup: TimelineSpanGroup | null;
  isOpen: boolean;
  scope: AnnotationPanelScope;
  onScopeChange: (scope: AnnotationPanelScope) => void;
  onClose: () => void;
};

export type AnnotationPanelScope = 'step' | 'span' | 'trajectory' | 'all';

function targetLabel(annotation: Annotation): string {
  switch (annotation.target.type) {
    case 'step':
      return `step · ${annotation.target.stepId}`;
    case 'span':
      return `span · ${annotation.target.startStepId} - ${annotation.target.endStepId}`;
    case 'trajectory':
      return `trajectory · ${annotation.target.trajectoryId}`;
    default:
      return annotation.target.type;
  }
}

function formatStepIndex(index: number): string {
  return index.toString().padStart(2, '0');
}

function formatStepRange(start: number, end: number): string {
  return `${formatStepIndex(start)}-${formatStepIndex(end)}`;
}

export function AnnotationPanel({
  trajectory,
  annotations,
  selectedStep,
  currentSpanGroup,
  isOpen,
  scope,
  onScopeChange,
  onClose,
}: AnnotationPanelProps) {
  const stepAnnotations = annotations.filter(
    (annotation) => annotation.target.type === 'step' && annotation.target.stepId === selectedStep.id,
  );
  const spanAnnotations = currentSpanGroup
    ? annotations.filter(
        (annotation) =>
          annotation.target.type === 'span' &&
          annotation.target.startStepId === currentSpanGroup.startStepId &&
          annotation.target.endStepId === currentSpanGroup.endStepId,
      )
    : [];
  const trajectoryAnnotations = annotations.filter(
    (annotation) => annotation.target.type === 'trajectory' && annotation.target.trajectoryId === trajectory.id,
  );

  const visibleAnnotations =
    scope === 'step'
      ? stepAnnotations
      : scope === 'span'
        ? spanAnnotations
        : scope === 'trajectory'
          ? trajectoryAnnotations
          : annotations;

  const scopeOptions: { key: AnnotationPanelScope; label: string }[] = [
    { key: 'step', label: `Current Step (${stepAnnotations.length})` },
    { key: 'span', label: `Current Span (${spanAnnotations.length})` },
    { key: 'trajectory', label: `Trajectory (${trajectoryAnnotations.length})` },
    { key: 'all', label: `All (${annotations.length})` },
  ];

  return (
    <div className={`fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <button
        type="button"
        aria-label="Close annotation panel"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/30 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[440px] border-l border-white/80 bg-white/88 p-5 shadow-[0_0_80px_-28px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-transform duration-200 sm:max-w-[480px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Annotation Panel</p>
            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">按需打开，不打断轨迹阅读</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">围绕当前上下文切换 step / span / trajectory scope，快速沉淀判断。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-600 hover:bg-white"
          >
            关闭
          </button>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.94))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current Context</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Trajectory: {trajectory.id}</p>
            <p>Current step: {formatStepIndex(selectedStep.index)} · {selectedStep.id}</p>
            {currentSpanGroup ? (
              <p>Current span: {formatStepRange(currentSpanGroup.startStepIndex, currentSpanGroup.endStepIndex)} · {currentSpanGroup.label}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {scopeOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onScopeChange(option.key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                scope === option.key
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_36px_-26px_rgba(15,23,42,0.8)]'
                  : 'border-white/90 bg-white/85 text-slate-700 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] hover:border-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 max-h-[calc(100vh-255px)] space-y-3 overflow-y-auto pr-1">
          {visibleAnnotations.length === 0 ? (
            <p className="rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 text-sm leading-6 text-slate-600">
              当前范围暂无标注。可以继续浏览轨迹，定位到关键 step 或阶段后再打开抽屉记录。
            </p>
          ) : (
            visibleAnnotations.map((annotation) => (
              <article
                key={annotation.id}
                className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.94))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{annotation.aspect}</p>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">{annotation.status}</span>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{targetLabel(annotation)}</p>
                <p className="mt-3 text-base font-semibold tracking-tight text-slate-900">
                  {annotationValueLabel(annotation.value)}
                </p>
                {annotation.rationale ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{annotation.rationale}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {annotation.confidence !== undefined ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                      confidence {annotation.confidence.toFixed(2)}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                    source {annotation.provenance.source}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        <p className="mt-4 text-[11px] text-slate-500">Target scope: step / span / trajectory / all</p>
      </aside>
    </div>
  );
}
