import type { Step } from '@/types';

type StepTimelineProps = {
  steps: Step[];
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
  annotationCountByStepId?: Record<string, number>;
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

export function StepTimeline({ steps, selectedStepId, onSelectStep, annotationCountByStepId = {} }: StepTimelineProps) {
  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-800">Step Timeline</h3>
      <p className="mb-3 text-xs text-slate-500">{steps.length} steps</p>
      <ul className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
        {steps.map((step) => {
          const annotationCount = annotationCountByStepId[step.id] ?? 0;

          return (
            <li key={step.id}>
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
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${statusClassMap[step.status]}`}>
                    {step.status}
                  </span>
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
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
