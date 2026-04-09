import type { Step, Trajectory } from '@/types';

type StepDetailProps = {
  trajectory: Trajectory;
  selectedStep: Step;
};

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return 'N/A';
  }

  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

function toPrettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function summarizeToolUseResult(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [`type: array`, `items: ${value.length}`];
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return [`type: object`, `keys: ${keys.length}`, `fields: ${keys.slice(0, 6).join(', ') || 'N/A'}`];
  }

  if (typeof value === 'string') {
    return [`type: string`, `length: ${value.length}`];
  }

  return [`type: ${typeof value}`];
}

type ToolInteractionGroup = {
  key: string;
  toolName: string;
  callId?: string;
  argumentsText: string;
  results: { toolUseId?: string; contentText: string }[];
};

function buildToolInteractionGroups(selectedStep: Step): { groups: ToolInteractionGroup[]; unmatchedResults: { toolUseId?: string; contentText: string }[] } {
  const calls = selectedStep.toolCalls ?? [];
  const results = [...(selectedStep.toolResults ?? [])];
  const consumedResultIndexes = new Set<number>();

  const groups = calls.map((call, idx) => {
    const matchedById = call.callId
      ? results
          .map((result, resultIdx) => ({ result, resultIdx }))
          .filter(({ result, resultIdx }) => !consumedResultIndexes.has(resultIdx) && result.toolUseId === call.callId)
      : [];

    let matched = matchedById.map(({ resultIdx }) => resultIdx);

    if (!call.callId && matched.length === 0) {
      const sequentialIdx = results.findIndex((_, resultIdx) => !consumedResultIndexes.has(resultIdx));
      if (sequentialIdx >= 0) {
        matched = [sequentialIdx];
      }
    }

    matched.forEach((resultIdx) => consumedResultIndexes.add(resultIdx));

    return {
      key: `${call.callId ?? call.name}-${idx}`,
      toolName: call.name,
      callId: call.callId,
      argumentsText: call.argumentsText,
      results: matched.map((resultIdx) => ({
        toolUseId: results[resultIdx]?.toolUseId,
        contentText: results[resultIdx]?.contentText ?? '',
      })),
    };
  });

  const unmatchedResults = results
    .map((result, resultIdx) => ({ result, resultIdx }))
    .filter(({ resultIdx }) => !consumedResultIndexes.has(resultIdx))
    .map(({ result }) => ({ toolUseId: result.toolUseId, contentText: result.contentText }));

  return { groups, unmatchedResults };
}

export function StepDetail({ trajectory, selectedStep }: StepDetailProps) {
  const inputText = selectedStep.input ?? 'N/A';
  const outputText = selectedStep.output ?? 'N/A';
  const toolUseResultSummary = selectedStep.toolUseResult !== undefined ? summarizeToolUseResult(selectedStep.toolUseResult) : [];
  const toolCalls = selectedStep.toolCalls ?? [];
  const toolResults = selectedStep.toolResults ?? [];
  const isToolStep = selectedStep.type === 'tool' || toolCalls.length > 0 || toolResults.length > 0;
  const interactionGroups = buildToolInteractionGroups(selectedStep);

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
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">status: {selectedStep.status}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">role: {selectedStep.role ?? 'unknown'}</span>
            {selectedStep.durationMs ? (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{selectedStep.durationMs}ms</span>
            ) : null}
            {selectedStep.toolName ? (
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">tool: {selectedStep.toolName}</span>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">{selectedStep.role === 'user' ? 'User Prompt' : 'Input'}</p>
          <pre className="mt-1 max-h-52 overflow-auto rounded bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 whitespace-pre-wrap break-words">
            {inputText}
          </pre>
          <p className="mt-1 text-[11px] text-slate-500">{inputText.length} chars</p>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-500">{selectedStep.role === 'assistant' ? 'Assistant Action' : 'Output'}</p>
          <pre className="mt-1 max-h-64 overflow-auto rounded bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 whitespace-pre-wrap break-words">
            {outputText}
          </pre>
          <p className="mt-1 text-[11px] text-slate-500">{outputText.length} chars</p>
        </div>

        {isToolStep ? (
          <div className="space-y-3 rounded border border-indigo-100 bg-indigo-50/30 p-3">
            <p className="text-xs uppercase text-indigo-700">Tool Interaction</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-indigo-700">
              <span className="rounded bg-indigo-100 px-2 py-0.5">groups: {interactionGroups.groups.length}</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5">calls: {toolCalls.length}</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5">results: {toolResults.length}</span>
            </div>

            {interactionGroups.groups.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Parallel Tool Groups</p>
                {interactionGroups.groups.map((group, idx) => (
                  <div key={group.key} className="space-y-2 rounded bg-white/80 p-2 text-xs text-slate-700">
                    <p className="font-semibold text-indigo-700">
                      Group #{idx + 1}: {group.toolName}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      callId: {group.callId ?? 'N/A'} · matched results: {group.results.length}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Arguments View</p>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 font-mono text-xs leading-5 whitespace-pre-wrap break-words">
                      {group.argumentsText || '(empty arguments)'}
                    </pre>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Result View</p>
                    {group.results.length > 0 ? (
                      group.results.map((result, resultIdx) => (
                        <div key={`${group.key}-${result.toolUseId ?? resultIdx}`} className="rounded bg-slate-50 p-2">
                          <p className="text-[11px] text-slate-500">toolUseId: {result.toolUseId ?? 'N/A'}</p>
                          <pre className="mt-1 max-h-40 overflow-auto font-mono text-xs leading-5 whitespace-pre-wrap break-words">
                            {result.contentText || '(empty result)'}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <p className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">No matched result yet</p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {interactionGroups.unmatchedResults.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Unmatched Results</p>
                {interactionGroups.unmatchedResults.map((result, idx) => (
                  <div key={`${result.toolUseId ?? 'result'}-${idx}`} className="rounded bg-white/80 p-2 text-xs text-slate-700">
                    <p className="font-semibold text-indigo-700">Result #{idx + 1}</p>
                    <p className="mt-1 text-[11px] text-slate-500">toolUseId: {result.toolUseId ?? 'N/A'}</p>
                    <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 font-mono text-xs leading-5 whitespace-pre-wrap break-words">
                      {result.contentText || '(empty result)'}
                    </pre>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedStep.toolUseResult !== undefined ? (
          <div>
            <p className="text-xs uppercase text-violet-600">Tool Use Result</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-violet-700">
              {toolUseResultSummary.map((item) => (
                <span key={item} className="rounded bg-violet-50 px-2 py-0.5">
                  {item}
                </span>
              ))}
            </div>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-violet-50/60 p-3 font-mono text-xs leading-5 text-violet-900 whitespace-pre-wrap break-words">
              {toPrettyJson(selectedStep.toolUseResult)}
            </pre>
          </div>
        ) : null}

        <div>
          <p className="text-xs uppercase text-slate-500">Raw Metadata</p>
          <div className="mt-1 grid grid-cols-1 gap-1 rounded bg-slate-50 p-3 text-[11px] text-slate-600 sm:grid-cols-2">
            <p>stepId: {selectedStep.id}</p>
            <p>parentUuid: {selectedStep.metadata?.parentUuid ?? 'N/A'}</p>
            <p>timestamp: {formatTimestamp(selectedStep.timestamp)}</p>
            <p>requestId: {selectedStep.metadata?.requestId ?? 'N/A'}</p>
            <p>model: {selectedStep.metadata?.model ?? 'N/A'}</p>
            <p>stopReason: {selectedStep.metadata?.stopReason ?? 'N/A'}</p>
            <p>inputTokens: {selectedStep.metadata?.inputTokens ?? 'N/A'}</p>
            <p>outputTokens: {selectedStep.metadata?.outputTokens ?? 'N/A'}</p>
          </div>
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
