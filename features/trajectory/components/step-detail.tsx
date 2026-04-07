import type { Step, Trajectory } from '@/types';

type StepDetailProps = {
  trajectory: Trajectory;
  selectedStep: Step;
};

export function StepDetail({ trajectory, selectedStep }: StepDetailProps) {
  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">Step Detail</h3>
      <p className="mt-1 text-xs text-slate-500">Trajectory: {trajectory.id}</p>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs uppercase text-slate-500">Step</p>
          <p className="font-medium text-slate-900">
            #{selectedStep.index} · {selectedStep.type}
          </p>
          <p className="text-slate-700">{selectedStep.title}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">Input (placeholder)</p>
          <p className="rounded bg-slate-50 p-2 text-slate-700">{selectedStep.input ?? 'N/A'}</p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">Output (placeholder)</p>
          <p className="rounded bg-slate-50 p-2 text-slate-700">{selectedStep.output ?? 'N/A'}</p>
        </div>
      </div>
    </section>
  );
}
