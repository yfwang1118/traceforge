import type { Step, Trajectory } from '@/types';

type StepDetailProps = {
  trajectory: Trajectory;
  selectedStep: Step;
};

export function StepDetail({ trajectory, selectedStep }: StepDetailProps) {
  const inputText = selectedStep.input ?? 'N/A';
  const outputText = selectedStep.output ?? 'N/A';

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
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">status: {selectedStep.status}</span>
            {selectedStep.durationMs ? (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{selectedStep.durationMs}ms</span>
            ) : null}
            {selectedStep.toolName ? (
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">tool: {selectedStep.toolName}</span>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">Input</p>
          <pre className="mt-1 max-h-52 overflow-auto rounded bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 whitespace-pre-wrap break-words">
            {inputText}
          </pre>
          <p className="mt-1 text-[11px] text-slate-500">{inputText.length} chars</p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">Output</p>
          <pre className="mt-1 max-h-64 overflow-auto rounded bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 whitespace-pre-wrap break-words">
            {outputText}
          </pre>
          <p className="mt-1 text-[11px] text-slate-500">{outputText.length} chars</p>
        </div>

        {selectedStep.error ? (
          <div>
            <p className="text-xs uppercase text-rose-600">Error</p>
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-rose-50 p-3 font-mono text-xs leading-5 text-rose-700 whitespace-pre-wrap break-words">
              {selectedStep.error}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
