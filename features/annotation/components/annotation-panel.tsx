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
        className={`absolute inset-0 bg-slate-900/35 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[420px] border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 sm:max-w-[460px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Annotation Panel</h3>
            <p className="mt-1 text-xs text-slate-500">按需打开：不打断轨迹阅读，仅在需要时记录结论。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            关闭
          </button>
        </div>

        <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>Trajectory: {trajectory.id}</p>
          <p className="mt-1">
            Current step: #{selectedStep.index} · {selectedStep.id}
          </p>
          {currentSpanGroup ? (
            <p className="mt-1">
              Current span: #{currentSpanGroup.startStepIndex}-{currentSpanGroup.endStepIndex} · {currentSpanGroup.label}
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {scopeOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onScopeChange(option.key)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                scope === option.key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 max-h-[calc(100vh-210px)] space-y-2 overflow-y-auto pr-1">
          {visibleAnnotations.length === 0 ? (
            <p className="rounded bg-slate-50 p-3 text-xs text-slate-600">
              当前范围暂无标注。可以继续浏览轨迹，定位到关键 step 或阶段后再打开抽屉记录。
            </p>
          ) : (
            visibleAnnotations.map((annotation) => (
              <article key={annotation.id} className="rounded border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-xs font-medium text-slate-800">{annotation.aspect}</p>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">{annotation.status}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{targetLabel(annotation)}</p>
                <p className="mt-1 text-xs font-medium text-slate-800">label: {annotationValueLabel(annotation.value)}</p>
                {annotation.rationale ? (
                  <p className="mt-2 text-xs leading-5 text-slate-600">reason: {annotation.rationale}</p>
                ) : null}
                {annotation.confidence !== undefined ? (
                  <p className="mt-1 text-[11px] text-slate-500">confidence: {annotation.confidence.toFixed(2)}</p>
                ) : null}
              </article>
            ))
          )}
        </div>

        <p className="mt-4 text-[11px] text-slate-500">Target scope: step / span / trajectory (MVP)</p>
      </aside>
    </div>
  );
}
