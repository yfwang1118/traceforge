import type { Step } from '@/types';

type StepTimelineProps = {
  steps: Step[];
};

export function StepTimeline({ steps }: StepTimelineProps) {
  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Step Timeline</h3>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="rounded border border-slate-100 bg-slate-50 p-2 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-medium">#{step.index}</span>
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] uppercase">{step.status}</span>
            </div>
            <p className="mt-1 truncate">{step.title}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
