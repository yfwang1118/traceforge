import type { ReactNode } from 'react';
import type { Step, ToolInteraction, ToolResult, Trajectory } from '@/types';

type StepDetailProps = {
  trajectory: Trajectory;
  selectedStep: Step;
  onOpenAnnotation?: () => void;
};

type InteractionPresentation = {
  label: string;
  badgeClassName: string;
  cardClassName: string;
  resultClassName: string;
};

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return 'N/A';
  }

  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

function toPrettyJson(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function looksLikeFailure(text: string): boolean {
  return /\berror\b|\bexception\b|\bfailed\b|\bnot found\b|\bdoes not exist\b|\bno such\b|\bpermission denied\b|traceback/.test(
    text.toLowerCase(),
  );
}

function isPathLikeString(value: string): boolean {
  if (!value || /\s/.test(value)) {
    return false;
  }

  return value.startsWith('/') || value.includes('\\') || value.includes('./') || value.includes('../');
}

function normalizeToken(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function isTodoItem(value: unknown): value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    return false;
  }

  return 'content' in value || 'status' in value || 'priority' in value || 'id' in value;
}

function isTodoItemsField(fieldKey: string, fieldValue: unknown): fieldValue is Record<string, unknown>[] {
  if (fieldKey !== 'todos' || !Array.isArray(fieldValue) || fieldValue.length === 0) {
    return false;
  }

  return fieldValue.every(isTodoItem);
}

function statusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === 'completed' || normalized === 'done') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (normalized === 'in_progress' || normalized === 'in progress' || normalized === 'running') {
    return 'bg-blue-100 text-blue-700';
  }

  if (normalized === 'pending' || normalized === 'todo') {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-slate-100 text-slate-600';
}

function priorityBadgeClass(priority: string): string {
  const normalized = priority.toLowerCase();

  if (normalized === 'high' || normalized === 'p0' || normalized === 'p1') {
    return 'bg-rose-100 text-rose-700';
  }

  if (normalized === 'medium' || normalized === 'p2') {
    return 'bg-amber-100 text-amber-700';
  }

  if (normalized === 'low' || normalized === 'p3') {
    return 'bg-slate-100 text-slate-600';
  }

  return 'bg-slate-100 text-slate-600';
}

function renderTodoItemsField(items: Record<string, unknown>[]): ReactNode {
  const statusCounts = new Map<string, number>();

  items.forEach((item) => {
    const status = normalizeToken(item.status) || 'unknown';
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  });

  const visibleItems = items.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">items: {items.length}</span>
        {Array.from(statusCounts.entries()).map(([status, count]) => (
          <span key={status} className={`rounded px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(status)}`}>
            {status}: {count}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {visibleItems.map((item, index) => {
          const id = normalizeToken(item.id);
          const content = normalizeToken(item.content);
          const status = normalizeToken(item.status);
          const priority = normalizeToken(item.priority);

          return (
            <div key={`${id || 'todo'}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">#{index + 1}</span>
                {id ? <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">id: {id}</span> : null}
                {status ? <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(status)}`}>{status}</span> : null}
                {priority ? (
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${priorityBadgeClass(priority)}`}>{priority}</span>
                ) : null}
              </div>
              {content ? <p className="mt-2 text-[13px] leading-5 text-slate-700 whitespace-pre-wrap break-words">{content}</p> : null}
            </div>
          );
        })}
      </div>

      {items.length > visibleItems.length ? (
        <p className="text-[11px] text-slate-500">
          Showing {visibleItems.length} of {items.length} todos. Expand Raw Arguments for full payload.
        </p>
      ) : null}
    </div>
  );
}

function renderStructuredValue(value: unknown): ReactNode {
  if (typeof value === 'string') {
    if (isPathLikeString(value)) {
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 px-3 py-2">
          <code className="block min-w-max font-mono text-[12px] text-slate-100 whitespace-nowrap">{value}</code>
        </div>
      );
    }

    if (value.includes('\n') || value.length > 80) {
      return (
        <pre className="max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
          {value}
        </pre>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-[12px] text-slate-700 break-words">
        {value}
      </div>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <code className="rounded bg-slate-100 px-2 py-1 font-mono text-[12px] text-slate-700">{String(value)}</code>;
  }

  if (value === null) {
    return <span className="text-[12px] text-slate-400">null</span>;
  }

  if (value === undefined) {
    return <span className="text-[12px] text-slate-400">undefined</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-[12px] text-slate-400">empty array</span>;
    }

    if (value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item)) && value.length <= 6) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <code key={`${String(item)}-${index}`} className="rounded bg-slate-100 px-2 py-1 font-mono text-[12px] text-slate-700">
              {String(item)}
            </code>
          ))}
        </div>
      );
    }

    return (
      <pre className="max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
        {toPrettyJson(value)}
      </pre>
    );
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);

    if (keys.length === 0) {
      return <span className="text-[12px] text-slate-400">empty object</span>;
    }

    return (
      <pre className="max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
        {toPrettyJson(value)}
      </pre>
    );
  }

  return <code className="rounded bg-slate-100 px-2 py-1 font-mono text-[12px] text-slate-700">{String(value)}</code>;
}

function renderFieldList(value: unknown): ReactNode {
  if (!isPlainObject(value)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {renderStructuredValue(value)}
      </div>
    );
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">No fields</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, fieldValue]) => (
        <div key={key} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{humanizeKey(key)}</div>
          <div>{isTodoItemsField(key, fieldValue) ? renderTodoItemsField(fieldValue) : renderStructuredValue(fieldValue)}</div>
        </div>
      ))}
    </div>
  );
}

function getInteractionPresentation(interaction: ToolInteraction): InteractionPresentation {
  if (interaction.status === 'unmatched') {
    return {
      label: 'orphan result',
      badgeClassName: 'bg-violet-100 text-violet-700',
      cardClassName: 'border-violet-200 bg-violet-50/50',
      resultClassName: 'border-violet-200 bg-white text-violet-950',
    };
  }

  if (!interaction.result) {
    return {
      label: 'waiting',
      badgeClassName: 'bg-amber-100 text-amber-700',
      cardClassName: 'border-amber-200 bg-amber-50/50',
      resultClassName: 'border-amber-200 bg-white text-amber-900',
    };
  }

  if (looksLikeFailure(interaction.result.contentText)) {
    return {
      label: 'failed',
      badgeClassName: 'bg-rose-100 text-rose-700',
      cardClassName: 'border-rose-200 bg-rose-50/50',
      resultClassName: 'border-rose-200 bg-white text-rose-950',
    };
  }

  return {
    label: 'completed',
    badgeClassName: 'bg-emerald-100 text-emerald-700',
    cardClassName: 'border-slate-200 bg-white',
    resultClassName: 'border-slate-200 bg-slate-50 text-slate-800',
  };
}

function renderResultBody(result: ToolResult, presentation: InteractionPresentation): ReactNode {
  const content = result.content;

  if (typeof content === 'string') {
    if (content.includes('\n') || content.length > 160) {
      return (
        <pre
          className={`max-h-52 overflow-auto rounded-2xl border p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap break-words ${presentation.resultClassName}`}
        >
          {content}
        </pre>
      );
    }

    return <div className={`rounded-2xl border px-3 py-2 text-sm leading-6 ${presentation.resultClassName}`}>{content}</div>;
  }

  return renderFieldList(content);
}

function ToolInteractionCard({ interaction }: { interaction: ToolInteraction }) {
  const presentation = getInteractionPresentation(interaction);
  const toolName = interaction.call?.name ?? 'Unmatched Result';

  return (
    <article className={`rounded-3xl border p-4 shadow-sm ${presentation.cardClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {interaction.order}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tool</p>
            <h4 className="mt-1 text-base font-semibold text-slate-900">{toolName}</h4>
          </div>
        </div>

        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${presentation.badgeClassName}`}>{presentation.label}</span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Arguments</p>
          {interaction.call ? (
            <>
              {renderFieldList(interaction.call.arguments)}
              <details className="rounded-2xl border border-slate-200 bg-white p-3">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Raw Arguments</summary>
                <pre className="mt-3 max-h-48 overflow-auto rounded-2xl bg-slate-50 p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
                  {interaction.call.argumentsText || '(empty arguments)'}
                </pre>
              </details>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              No tool call was matched to this result payload.
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Result</p>
          {interaction.result ? (
            <>
              {renderResultBody(interaction.result, presentation)}
              <details className="rounded-2xl border border-slate-200 bg-white p-3">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Raw Result</summary>
                <pre className="mt-3 max-h-48 overflow-auto rounded-2xl bg-slate-50 p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
                  {interaction.result.contentText || '(empty result)'}
                </pre>
              </details>
            </>
          ) : (
            <div className={`rounded-2xl border px-3 py-2 text-sm ${presentation.resultClassName}`}>
              Waiting for the tool result to arrive.
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
        {interaction.call?.callId ? <span className="rounded bg-white/70 px-2 py-1">callId: {interaction.call.callId}</span> : null}
        {interaction.result?.toolUseId ? <span className="rounded bg-white/70 px-2 py-1">toolUseId: {interaction.result.toolUseId}</span> : null}
      </div>
    </article>
  );
}

export function StepDetail({ trajectory, selectedStep, onOpenAnnotation }: StepDetailProps) {
  const inputText = selectedStep.input ?? 'N/A';
  const outputText = selectedStep.output ?? 'N/A';
  const toolCalls = selectedStep.toolCalls ?? [];
  const toolResults = selectedStep.toolResults ?? [];
  const toolInteractions = selectedStep.toolInteractions ?? [];
  const isToolStep =
    selectedStep.type === 'tool' || toolCalls.length > 0 || toolResults.length > 0 || toolInteractions.length > 0;
  const hasRawInput = Boolean(inputText && inputText !== 'N/A' && inputText !== '(empty message)');
  const hasRawOutput = Boolean(outputText && outputText !== 'N/A' && outputText !== '(no output)');

  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">Step Detail</h3>
      <p className="mt-1 text-xs text-slate-500">Trajectory: {trajectory.id}</p>

      <div className="mt-4 space-y-4 text-sm">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase text-slate-500">Step</p>
              <p className="font-medium text-slate-900">
                #{selectedStep.index} · {selectedStep.type}
              </p>
            </div>
            {onOpenAnnotation ? (
              <button
                type="button"
                onClick={onOpenAnnotation}
                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-slate-400"
              >
                标注此步骤
              </button>
            ) : null}
          </div>
          <p className="text-slate-700">{selectedStep.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">status: {selectedStep.status}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">role: {selectedStep.role ?? 'unknown'}</span>
            {selectedStep.durationMs ? (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{selectedStep.durationMs}ms</span>
            ) : null}
            {toolCalls.length === 1 && selectedStep.toolName ? (
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">tool: {selectedStep.toolName}</span>
            ) : null}
          </div>
        </div>

        {isToolStep ? (
          <>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase text-slate-500">Tool Calls</p>
                <p className="mt-1 text-sm text-slate-600">Each card represents one tool invocation, so parallel calls can be scanned independently.</p>
              </div>

              <div className="space-y-3">
                {toolInteractions.map((interaction) => (
                  <ToolInteractionCard
                    key={`${interaction.call?.callId ?? interaction.result?.toolUseId ?? 'interaction'}-${interaction.order}`}
                    interaction={interaction}
                  />
                ))}
              </div>
            </div>

            {selectedStep.toolUseResult !== undefined ? (
              <details className="rounded-2xl border border-violet-200 bg-violet-50/40 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                  Structured Tool Payload
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-white/80 p-3 font-mono text-[12px] leading-5 text-violet-950 whitespace-pre-wrap break-words">
                  {toPrettyJson(selectedStep.toolUseResult)}
                </pre>
              </details>
            ) : null}

            {(hasRawInput || hasRawOutput) ? (
              <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Raw Transcript</summary>
                <div className="mt-3 space-y-3">
                  {hasRawInput ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Input</p>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-2xl bg-white p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
                        {inputText}
                      </pre>
                    </div>
                  ) : null}

                  {hasRawOutput ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Output</p>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-2xl bg-white p-3 font-mono text-[12px] leading-5 text-slate-700 whitespace-pre-wrap break-words">
                        {outputText}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </>
        ) : (
          <>
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
          </>
        )}

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
