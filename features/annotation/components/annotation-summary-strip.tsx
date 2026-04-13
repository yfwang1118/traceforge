import {
  annotationValueLabel,
  getSpanTone,
  type RoundAnnotationGroup,
  type TimelineSpanGroup,
} from '@/lib/annotation-presentation';
import type { Annotation, Step } from '@/types';

type AnnotationSummaryStripProps = {
  selectedStep: Step;
  trajectoryAnnotations: Annotation[];
  currentRoundGroup: RoundAnnotationGroup | null;
  roundGroups: RoundAnnotationGroup[];
  currentSpanGroup: TimelineSpanGroup | null;
  spanGroups: TimelineSpanGroup[];
  totalStepAnnotationCount: number;
  currentStepAnnotationCount: number;
  roundAnnotationCount: number;
  spanAnnotationCount: number;
  trajectoryAnnotationCount: number;
  conversationRoundCount: number;
  conversationJumpCount: number;
  onFocusRound: (roundId: string, preferredStepId?: string) => void;
  onFocusSpan: (spanId: string, preferredStepId?: string) => void;
  onOpenStepAnnotations: () => void;
  onOpenRoundAnnotations: () => void;
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

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ');
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

function LabelRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function AnnotationSummaryStrip({
  selectedStep,
  trajectoryAnnotations,
  currentRoundGroup,
  roundGroups,
  currentSpanGroup,
  spanGroups,
  totalStepAnnotationCount,
  currentStepAnnotationCount,
  roundAnnotationCount,
  spanAnnotationCount,
  trajectoryAnnotationCount,
  conversationRoundCount,
  conversationJumpCount,
  onFocusRound,
  onFocusSpan,
  onOpenStepAnnotations,
  onOpenRoundAnnotations,
  onOpenSpanAnnotations,
  onOpenTrajectoryAnnotations,
}: AnnotationSummaryStripProps) {
  const primaryTrajectoryAnnotation = trajectoryAnnotations[0];
  const currentSpanTone = currentSpanGroup ? getSpanTone(currentSpanGroup.label) : null;
  const currentRoundTaskAnnotation = currentRoundGroup?.taskTypeAnnotation ?? null;
  const currentRoundIntentAnnotation = currentRoundGroup?.intentTypeAnnotation ?? null;
  const roundPhaseSets = roundGroups.map((group) => ({
    ...group,
    spans: spanGroups.filter(
      (spanGroup) =>
        group.round.stepIds.includes(spanGroup.startStepId) && group.round.stepIds.includes(spanGroup.endStepId),
    ),
  }));

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Annotation Summary</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">先看用户问题，再钻进阶段与单步证据</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            当前聚焦 step {formatStepIndex(selectedStep.index)}。先用 trajectory / round / span / step 四层判断建立心智模型，再下钻到具体工具动作。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton active onClick={onOpenRoundAnnotations}>
            当前问题 ({currentRoundGroup?.annotationCount ?? 0})
          </ActionButton>
          <ActionButton onClick={onOpenSpanAnnotations}>当前阶段 ({currentSpanGroup ? 1 : 0})</ActionButton>
          <ActionButton onClick={onOpenStepAnnotations}>当前 Step ({currentStepAnnotationCount})</ActionButton>
          <ActionButton onClick={onOpenTrajectoryAnnotations}>整体判断 ({trajectoryAnnotationCount})</ActionButton>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Trajectory" value={trajectoryAnnotationCount} />
        <MetricCard label="Round" value={roundAnnotationCount} />
        <MetricCard label="Span" value={spanAnnotationCount} />
        <MetricCard label="Step" value={totalStepAnnotationCount} />
        <MetricCard label="Rounds" value={conversationRoundCount} />
        <MetricCard label="Jumps" value={conversationJumpCount} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="space-y-4">
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current Question</p>

            {currentRoundGroup ? (
              <div className="mt-3 rounded-[22px] border border-slate-200/80 bg-white/90 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-200 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {currentRoundGroup.round.label}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                    steps {formatStepRange(currentRoundGroup.round.startStepIndex, currentRoundGroup.round.endStepIndex)}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                    annotations {currentRoundGroup.annotationCount}
                  </span>
                  {currentRoundTaskAnnotation ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceTone(currentRoundTaskAnnotation.provenance.source)}`}>
                      {currentRoundTaskAnnotation.provenance.source}
                    </span>
                  ) : null}
                  {currentRoundTaskAnnotation ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(currentRoundTaskAnnotation.status)}`}>
                      {currentRoundTaskAnnotation.status}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">{currentRoundGroup.round.promptPreview}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <LabelRow label="Task Type">
                    {currentRoundGroup.taskTypeLabel ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                        {formatEnumLabel(currentRoundGroup.taskTypeLabel)}
                      </span>
                    ) : (
                      <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                        待标注
                      </span>
                    )}
                  </LabelRow>

                  <LabelRow label="Intent Type">
                    {currentRoundGroup.intentTypeLabels.length > 0 ? (
                      currentRoundGroup.intentTypeLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
                        >
                          {formatEnumLabel(label)}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                        待标注
                      </span>
                    )}
                  </LabelRow>
                </div>

                {currentRoundTaskAnnotation?.rationale ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">{currentRoundTaskAnnotation.rationale}</p>
                ) : currentRoundIntentAnnotation?.rationale ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">{currentRoundIntentAnnotation.rationale}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
                当前 step 未命中任何 round 上下文。
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
                  {currentSpanGroup.isAutoGenerated ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                      auto coverage
                    </span>
                  ) : null}
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

        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.92))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Round Phase Map</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">每个 round 下直接展开这一轮对应的 phase 套件，先看问题，再看这轮内部怎么推进。</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {roundPhaseSets.length === 0 ? (
                <p className="rounded-[22px] border border-dashed border-slate-200 bg-white/75 p-4 text-sm text-slate-500">
                  当前暂无 round 结构。
                </p>
              ) : (
                roundPhaseSets.map((group) => (
                  <div
                    key={group.round.id}
                    className={`rounded-[22px] border p-4 transition ${
                      group.round.containsSelectedStep
                        ? 'border-slate-900/10 bg-white shadow-[0_24px_44px_-34px_rgba(15,23,42,0.4)] ring-1 ring-slate-900/5'
                        : 'border-white/90 bg-white/82 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.34)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onFocusRound(group.round.id, group.round.leadStepId)}
                      className="w-full text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-sky-200 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                          {group.round.label}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                          steps {formatStepRange(group.round.startStepIndex, group.round.endStepIndex)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                          {group.annotationCount} ann
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                          {group.spans.length} phases
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">{group.round.promptPreview}</p>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.taskTypeLabel ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                          {formatEnumLabel(group.taskTypeLabel)}
                        </span>
                      ) : (
                        <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                          task 待标注
                        </span>
                      )}
                      {group.intentTypeLabels.length > 0
                        ? group.intentTypeLabels.map((label) => (
                            <span
                              key={`${group.round.id}-${label}`}
                              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
                            >
                              {formatEnumLabel(label)}
                            </span>
                          ))
                        : (
                            <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">
                              intent 待标注
                            </span>
                          )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.spans.length === 0 ? (
                        <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                          当前 round 暂无 phase
                        </span>
                      ) : (
                        group.spans.map((spanGroup) => {
                          const tone = getSpanTone(spanGroup.label);

                          return (
                            <button
                              key={spanGroup.id}
                              type="button"
                              onClick={() => onFocusSpan(spanGroup.id, spanGroup.startStepId)}
                              title={spanGroup.label}
                              className={`rounded-[20px] border px-3 py-2 text-left text-xs transition ${
                                spanGroup.containsSelectedStep
                                  ? `${tone.chip} shadow-[0_18px_36px_-28px_rgba(15,23,42,0.35)]`
                                  : `${tone.card} hover:shadow-[0_16px_32px_-28px_rgba(15,23,42,0.28)]`
                              }`}
                            >
                              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${tone.text}`}>
                                steps {formatStepRange(spanGroup.startStepIndex, spanGroup.endStepIndex)}
                              </p>
                              <p className={`mt-1.5 text-sm font-semibold ${tone.text}`}>{spanGroup.label}</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
