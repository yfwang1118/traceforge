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
      return 'bg-emerald-100 text-emerald-700';
    case 'draft':
      return 'bg-amber-100 text-amber-700';
    case 'disputed':
      return 'bg-rose-100 text-rose-700';
    case 'deprecated':
      return 'bg-slate-200 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function sourceTone(source: Annotation['provenance']['source']): string {
  switch (source) {
    case 'human':
      return 'bg-slate-900 text-white';
    case 'llm_judge':
      return 'bg-sky-100 text-sky-700';
    case 'heuristic':
      return 'bg-emerald-100 text-emerald-700';
    case 'imported':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
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
    <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h3 className="text-sm font-semibold text-slate-900">Annotation Summary</h3>
          <p className="mt-1 text-xs text-slate-600">
            先看整体判断与阶段划分，再进入 step 细节。当前聚焦 step #{selectedStep.index}。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenStepAnnotations}
            className="rounded border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            当前 Step ({currentStepAnnotationCount})
          </button>
          <button
            type="button"
            onClick={onOpenSpanAnnotations}
            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
          >
            当前阶段 ({currentSpanGroup ? 1 : 0})
          </button>
          <button
            type="button"
            onClick={onOpenTrajectoryAnnotations}
            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400"
          >
            整体判断 ({trajectoryAnnotationCount})
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-white px-2 py-1 text-slate-600">trajectory {trajectoryAnnotationCount}</span>
            <span className="rounded-full bg-white px-2 py-1 text-slate-600">span {spanAnnotationCount}</span>
            <span className="rounded-full bg-white px-2 py-1 text-slate-600">step {totalStepAnnotationCount}</span>
          </div>

          {primaryTrajectoryAnnotation ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${sourceTone(primaryTrajectoryAnnotation.provenance.source)}`}>
                  {primaryTrajectoryAnnotation.provenance.source}
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusTone(primaryTrajectoryAnnotation.status)}`}>
                  {primaryTrajectoryAnnotation.status}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                  {primaryTrajectoryAnnotation.aspect}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {annotationValueLabel(primaryTrajectoryAnnotation.value)}
              </p>
              {primaryTrajectoryAnnotation.rationale ? (
                <p className="mt-2 text-xs leading-5 text-slate-600">{primaryTrajectoryAnnotation.rationale}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">当前暂无 trajectory 级标注。</p>
          )}

          {currentSpanGroup && currentSpanTone ? (
            <div className={`mt-3 rounded-xl border p-3 ${currentSpanTone.card}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${currentSpanTone.chip}`}>
                  {currentSpanGroup.label}
                </span>
                <span className={`rounded-full bg-white px-2 py-1 text-[11px] ${currentSpanTone.headerMuted}`}>
                  step #{currentSpanGroup.startStepIndex}-{currentSpanGroup.endStepIndex}
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${sourceTone(currentSpanGroup.annotation.provenance.source)}`}>
                  {currentSpanGroup.annotation.provenance.source}
                </span>
              </div>
              {currentSpanGroup.rationale ? (
                <p className="mt-2 text-xs leading-5 text-slate-600">{currentSpanGroup.rationale}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">当前 step 不在任何 span 标注范围内。</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-slate-800">Phases</p>
              <p className="mt-1 text-[11px] text-slate-500">点击阶段 chip 可直接定位到对应 span。</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {spanGroups.length === 0 ? (
              <p className="text-xs text-slate-500">当前暂无 span 标注。</p>
            ) : (
              spanGroups.map((group) => {
                const tone = getSpanTone(group.label);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onFocusSpan(group.id)}
                    title={group.label}
                    className={`rounded-full border px-3 py-2 text-left text-xs transition ${
                      group.containsSelectedStep ? `${tone.chip} shadow-sm` : `${tone.card} hover:shadow-sm`
                    }`}
                  >
                    <span className={`font-medium ${tone.text}`}>#{group.startStepIndex}-{group.endStepIndex}</span>
                    <span className="mx-1 text-slate-400">·</span>
                    <span className={tone.text}>{group.label}</span>
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
