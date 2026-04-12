import { annotationValueLabel, getSpanTone, type TimelineSpanGroup } from '@/lib/annotation-presentation';
import type { Annotation, Step } from '@/types';

type AnnotationSummaryStripProps = {
  selectedStep: Step;
  trajectoryAnnotations: Annotation[];
  currentSpanGroup: TimelineSpanGroup | null;
  spanGroups: TimelineSpanGroup[];
  totalStepAnnotationCount: number;
  currentStepAnnotationCount: number;
  spanAnnotationCount: number;
  trajectoryAnnotationCount: number;
  onFocusSpan: (spanId: string) => void;
  onOpenStepAnnotations: () => void;
  onOpenSpanAnnotations: () => void;
  onOpenTrajectoryAnnotations: () => void;
};

function statusTone(status: Annotation['status']): string {
  switch (status) {
    case 'confirmed':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'draft':
      return 'border border-amber-200 bg-amber-50 text-amber-700';
    case 'disputed':
      return 'border border-rose-200 bg-rose-50 text-rose-700';
    case 'deprecated':
      return 'border border-slate-200 bg-slate-100 text-slate-600';
    default:
      return 'border border-slate-200 bg-slate-100 text-slate-600';
  }
}

function sourceTone(source: Annotation['provenance']['source']): string {
  switch (source) {
    case 'human':
      return 'border border-slate-900 bg-slate-900 text-white';
    case 'llm_judge':
      return 'border border-sky-200 bg-sky-50 text-sky-700';
    case 'heuristic':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'imported':
      return 'border border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border border-slate-200 bg-slate-100 text-slate-600';
  }
}

function formatStepIndex(index: number): string {
  return index.toString().padStart(2, '0');
}

function formatStepRange(start: number, end: number): string {
  return `${formatStepIndex(start)}-${formatStepIndex(end)}`;
}

function ActionButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.8)]'
          : 'border-white/90 bg-white/85 text-slate-700 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-white/90 bg-white/90 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export function AnnotationSummaryStrip({
  selectedStep,
  trajectoryAnnotations,
  currentSpanGroup,
  spanGroups,
  totalStepAnnotationCount,
  currentStepAnnotationCount,
  spanAnnotationCount,
  trajectoryAnnotationCount,
  onFocusSpan,
  onOpenStepAnnotations,
  onOpenSpanAnnotations,
  onOpenTrajectoryAnnotations,
}: AnnotationSummaryStripProps) {
  const primaryTrajectoryAnnotation = trajectoryAnnotations[0];
  const currentSpanTone = currentSpanGroup ? getSpanTone(currentSpanGroup.label) : null;

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Annotation Summary</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">先看整体判断，再钻进单步证据</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            当前聚焦 step {formatStepIndex(selectedStep.index)}，从 trajectory 判断、span 阶段和当前 step 三层建立心智模型。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton active onClick={onOpenStepAnnotations}>
            当前 Step ({currentStepAnnotationCount})
          </ActionButton>
          <ActionButton onClick={onOpenSpanAnnotations}>当前阶段 ({currentSpanGroup ? 1 : 0})</ActionButton>
          <ActionButton onClick={onOpenTrajectoryAnnotations}>整体判断 ({trajectoryAnnotationCount})</ActionButton>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <MetricCard label="Trajectory" value={trajectoryAnnotationCount} />
            <MetricCard label="Span" value={spanAnnotationCount} />
            <MetricCard label="Step" value={totalStepAnnotationCount} />
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.92))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Trajectory Verdict</p>

            {primaryTrajectoryAnnotation ? (
              <div className="mt-3 rounded-[22px] border border-slate-200/80 bg-white/90 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceTone(primaryTrajectoryAnnotation.provenance.source)}`}>
                    {primaryTrajectoryAnnotation.provenance.source}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(primaryTrajectoryAnnotation.status)}`}>
                    {primaryTrajectoryAnnotation.status}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                    {primaryTrajectoryAnnotation.aspect}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                  {annotationValueLabel(primaryTrajectoryAnnotation.value)}
                </p>
                {primaryTrajectoryAnnotation.rationale ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{primaryTrajectoryAnnotation.rationale}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
                当前暂无 trajectory 级标注。
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.92))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current Phase</p>

            {currentSpanGroup && currentSpanTone ? (
              <div className={`mt-3 rounded-[22px] border p-4 ${currentSpanTone.card}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${currentSpanTone.chip}`}>
                    {currentSpanGroup.label}
                  </span>
                  <span className={`rounded-full bg-white/90 px-2.5 py-1 text-[11px] ${currentSpanTone.headerMuted}`}>
                    steps {formatStepRange(currentSpanGroup.startStepIndex, currentSpanGroup.endStepIndex)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceTone(currentSpanGroup.annotation.provenance.source)}`}
                  >
                    {currentSpanGroup.annotation.provenance.source}
                  </span>
                </div>
                {currentSpanGroup.rationale ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">{currentSpanGroup.rationale}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
                当前 step 不在任何 span 标注范围内。
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.92))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Phases</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">点击阶段 chip 直接聚焦到对应 span，同时保持当前阅读上下文。</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {spanGroups.length === 0 ? (
              <p className="rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
                当前暂无 span 标注。
              </p>
            ) : (
              spanGroups.map((group) => {
                const tone = getSpanTone(group.label);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onFocusSpan(group.id)}
                    title={group.label}
                    className={`rounded-[22px] border px-4 py-3 text-left text-xs transition ${
                      group.containsSelectedStep
                        ? `${tone.chip} shadow-[0_20px_40px_-28px_rgba(15,23,42,0.38)]`
                        : `${tone.card} hover:shadow-[0_18px_36px_-30px_rgba(15,23,42,0.34)]`
                    }`}
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${tone.text}`}>steps {formatStepRange(group.startStepIndex, group.endStepIndex)}</p>
                    <p className={`mt-2 text-sm font-semibold ${tone.text}`}>{group.label}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
