import type { Step } from '@/types';

type StepTimelineProps = {
  steps: Step[];
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
};

const statusClassMap: Record<Step['status'], string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function StepTimeline({ steps, selectedStepId, onSelectStep }: StepTimelineProps) {
  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Step Timeline</h3>
      <ul className="space-y-2">
        {steps.map((step) => (
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
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  #{step.index} · {step.type}
                </span>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${statusClassMap[step.status]}`}>
                  {step.status}
                </span>
              </div>
              <p className="mt-1 truncate">{step.title}</p>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
