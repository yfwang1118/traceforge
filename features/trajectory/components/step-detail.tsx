import type { Step } from '@/types';

type StepDetailProps = {
  selectedStep: Step;
};

export function StepDetail({ selectedStep }: StepDetailProps) {
  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Step Detail</h3>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs uppercase text-slate-700">{selectedStep.status}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <InfoKpi label="Step Index" value={`#${selectedStep.index}`} />
        <InfoKpi label="Step ID" value={selectedStep.id} />
        <InfoKpi label="Type" value={selectedStep.type} />
      </div>

      <h4 className="mt-4 text-sm font-medium text-slate-900">{selectedStep.title}</h4>

      <div className="mt-3 space-y-3 text-sm">
        <InfoBlock title="Observation" content={selectedStep.observation} />
        <InfoBlock title="Action" content={selectedStep.action} />

        <section>
          <p className="mb-1 text-xs uppercase text-slate-500">Tool Call</p>
          <div className="rounded bg-slate-50 p-2 text-slate-700">
            {selectedStep.toolCall ? (
              <>
                <p>
                  <span className="font-medium">name:</span> {selectedStep.toolCall.name}
                </p>
                <p className="mt-1 break-all text-xs text-slate-600">
                  <span className="font-medium">args:</span> {JSON.stringify(selectedStep.toolCall.args)}
                </p>
              </>
            ) : (
              'N/A'
            )}
          </div>
        </section>

        <section>
          <p className="mb-1 text-xs uppercase text-slate-500">Tool Result</p>
          <div className="rounded bg-slate-50 p-2 text-slate-700">
            {selectedStep.toolResult ? (
              <>
                <p>
                  <span className="font-medium">ok:</span> {String(selectedStep.toolResult.ok)}
                </p>
                <p>
                  <span className="font-medium">summary:</span> {selectedStep.toolResult.summary}
                </p>
              </>
            ) : (
              'N/A'
            )}
          </div>
        </section>

        <section>
          <p className="mb-1 text-xs uppercase text-slate-500">Metadata</p>
          <div className="rounded bg-slate-50 p-2 text-xs text-slate-700">
            <p>durationMs: {selectedStep.metadata.durationMs ?? 'N/A'}</p>
            <p>tokenIn: {selectedStep.metadata.tokenIn ?? 'N/A'}</p>
            <p>tokenOut: {selectedStep.metadata.tokenOut ?? 'N/A'}</p>
            <p>model: {selectedStep.metadata.model ?? 'N/A'}</p>
            <p>command: {selectedStep.metadata.command ?? 'N/A'}</p>
            <p>filesTouched: {selectedStep.metadata.filesTouched?.join(', ') ?? 'N/A'}</p>
            <p>testSummary: {selectedStep.metadata.testSummary ?? 'N/A'}</p>
            <p>tags: {selectedStep.metadata.tags?.join(', ') ?? 'N/A'}</p>
            <p>note: {selectedStep.metadata.note ?? 'N/A'}</p>
          </div>
        </section>

        {selectedStep.error ? (
          <section>
            <p className="mb-1 text-xs uppercase text-red-600">Error Context</p>
            <p className="rounded bg-red-50 p-2 text-sm text-red-800">{selectedStep.error}</p>
          </section>
        ) : null}
      </div>
    </section>
  );
}

function InfoKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-slate-50 p-2">
      <p className="text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <p className="mb-1 text-xs uppercase text-slate-500">{title}</p>
      <p className="rounded bg-slate-50 p-2 text-slate-700">{content}</p>
    </section>
  );
}
