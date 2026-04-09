import type { Step } from '@/types';

type StepTimelineProps = {
  steps: Step[];
  selectedStepId: string;
  onSelectStep: (stepId: string) => void;
  onSelectPrev: () => void;
  onSelectNext: () => void;
};

export function StepTimeline({
  steps,
  selectedStepId,
  onSelectStep,
  onSelectPrev,
  onSelectNext,
}: StepTimelineProps) {
  const selectedStep = steps.find((step) => step.id === selectedStepId);

  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Step Timeline</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onSelectPrev}
            className="cursor-pointer rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            ↑ Prev
          </button>
          <button
            type="button"
            onClick={onSelectNext}
            className="cursor-pointer rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            ↓ Next
          </button>
        </div>
      </div>

      <p className="mb-2 rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-800">
        当前: {selectedStep ? `#${selectedStep.index} ${selectedStep.id}` : 'N/A'}
      </p>

      <ul className="space-y-2">
        {steps.map((step) => {
          const isSelected = step.id === selectedStepId;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep(step.id)}
                aria-pressed={isSelected}
                className={[
                  'w-full cursor-pointer rounded border p-2 text-left text-xs transition',
                  isSelected
                    ? 'border-blue-500 bg-blue-100 text-blue-950 ring-1 ring-blue-300'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">#{step.index}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase">{step.status}</span>
                </div>
                <p className="mt-1 truncate">{step.title}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
