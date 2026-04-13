import type { RoundAnnotationGroup } from '@/lib/annotation-presentation';
import type { ReactNode } from 'react';
import type { Step, ToolInteraction, ToolResult, Trajectory } from '@/types';

type StepDetailProps = {
  trajectory: Trajectory;
  selectedStep: Step;
  currentRoundGroup: RoundAnnotationGroup | null;
  onOpenAnnotation?: () => void;
};

type InteractionPresentation = {
  label: string;
  badgeClassName: string;
  cardClassName: string;
  resultClassName: string;
};

type StatusPresentation = {
  pill: string;
  dot: string;
  label: string;
};

const stepStatusClassMap: Record<Step['status'], StatusPresentation> = {
  ok: {
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'ok',
  },
  warn: {
    pill: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    label: 'warn',
  },
  error: {
    pill: 'border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    label: 'error',
  },
};

const stepTypeClassMap: Record<Step['type'], string> = {
  observe: 'bg-sky-100 text-sky-700',
  reason: 'bg-amber-100 text-amber-700',
  tool: 'bg-violet-100 text-violet-700',
  plan: 'bg-cyan-100 text-cyan-700',
  respond: 'bg-emerald-100 text-emerald-700',
};

const roleClassMap: Record<NonNullable<Step['role']>, string> = {
  system: 'border-amber-200 bg-amber-50 text-amber-700',
  user: 'border-slate-200 bg-slate-50 text-slate-700',
  assistant: 'border-sky-200 bg-sky-50 text-sky-700',
  tool: 'border-violet-200 bg-violet-50 text-violet-700',
  unknown: 'border-slate-200 bg-slate-50 text-slate-500',
};

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return 'N/A';
  }

  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

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

function formatStepIndex(index: number): string {
  return index.toString().padStart(2, '0');
}

function formatStepRange(start: number, end: number): string {
  return `${formatStepIndex(start)}-${formatStepIndex(end)}`;
}

function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function isPresentMetadataValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 && normalized !== 'N/A' && normalized !== 'null' && normalized !== 'undefined';
  }

  return true;
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
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'in_progress' || normalized === 'in progress' || normalized === 'running') {
    return 'border border-blue-200 bg-blue-50 text-blue-700';
  }

  if (normalized === 'pending' || normalized === 'todo') {
    return 'border border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border border-slate-200 bg-slate-100 text-slate-600';
}

function priorityBadgeClass(priority: string): string {
  const normalized = priority.toLowerCase();

  if (normalized === 'high' || normalized === 'p0' || normalized === 'p1') {
    return 'border border-rose-200 bg-rose-50 text-rose-700';
  }

  if (normalized === 'medium' || normalized === 'p2') {
    return 'border border-amber-200 bg-amber-50 text-amber-700';
  }

  if (normalized === 'low' || normalized === 'p3') {
    return 'border border-slate-200 bg-slate-100 text-slate-600';
  }

  return 'border border-slate-200 bg-slate-100 text-slate-600';
}

function SurfaceChip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-600 ${className}`}>
      {children}
    </span>
  );
}

function MetadataChip({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-full border border-slate-200/80 bg-white/92 px-3 py-1.5 text-[11px] text-slate-600 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.28)]">
      <span className="font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="ml-2 font-medium text-slate-800">{value}</span>
    </div>
  );
}

function StepOrdinalBadge({ index }: { index: number }) {
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[22px] border border-slate-900 bg-slate-900 text-white shadow-[0_30px_55px_-34px_rgba(15,23,42,0.9)]">
      <span className="text-[8px] font-semibold uppercase tracking-[0.3em] opacity-70">step</span>
      <span className="mt-1 text-lg font-semibold tracking-[0.08em]">{formatStepIndex(index)}</span>
    </div>
  );
}

function DetailBlock({
  eyebrow,
  title,
  meta,
  children,
  className = '',
}: {
  eyebrow: string;
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.9))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)] ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
          {title ? <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p> : null}
        </div>
        {meta}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
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
        <SurfaceChip>items {items.length}</SurfaceChip>
        {Array.from(statusCounts.entries()).map(([status, count]) => (
          <span key={status} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass(status)}`}>
            {status} {count}
          </span>
        ))}
      </div>

      <div className="space-y-2.5">
        {visibleItems.map((item, index) => {
          const id = normalizeToken(item.id);
          const content = normalizeToken(item.content);
          const status = normalizeToken(item.status);
          const priority = normalizeToken(item.priority);

          return (
            <div key={`${id || 'todo'}-${index}`} className="rounded-[22px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.35)]">
              <div className="flex flex-wrap items-center gap-1.5">
                <SurfaceChip>item {formatStepIndex(index + 1)}</SurfaceChip>
                {id ? <SurfaceChip>id {id}</SurfaceChip> : null}
                {status ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass(status)}`}>{status}</span> : null}
                {priority ? <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priorityBadgeClass(priority)}`}>{priority}</span> : null}
              </div>
              {content ? <p className="mt-2 text-[13px] leading-6 text-slate-700 whitespace-pre-wrap break-words">{content}</p> : null}
            </div>
          );
        })}
      </div>

      {items.length > visibleItems.length ? (
        <p className="text-[11px] text-slate-500">
          Showing {visibleItems.length} of {items.length} todos. Expand Raw Arguments for the full payload.
        </p>
      ) : null}
    </div>
  );
}

function renderStructuredValue(value: unknown): ReactNode {
  if (typeof value === 'string') {
    if (isPathLikeString(value)) {
      return (
        <div className="overflow-x-auto rounded-[22px] border border-slate-800 bg-slate-950 px-3 py-2 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.75)]">
          <code className="block min-w-max font-mono text-[12px] text-slate-100 whitespace-nowrap">{value}</code>
        </div>
      );
    }

    if (value.includes('\n') || value.length > 80) {
      return (
        <pre className="max-h-44 overflow-auto rounded-[22px] border border-white/80 bg-white/95 p-3 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
          {value}
        </pre>
      );
    }

    return (
      <div className="rounded-[22px] border border-slate-200/80 bg-white/95 px-3 py-2 font-mono text-[12px] text-slate-700 break-words">
        {value}
      </div>
    );
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <code className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[12px] text-slate-700">{String(value)}</code>;
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
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, index) => (
            <code key={`${String(item)}-${index}`} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[12px] text-slate-700">
              {String(item)}
            </code>
          ))}
        </div>
      );
    }

    return (
      <pre className="max-h-44 overflow-auto rounded-[22px] border border-white/80 bg-white/95 p-3 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
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
      <pre className="max-h-44 overflow-auto rounded-[22px] border border-white/80 bg-white/95 p-3 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
        {toPrettyJson(value)}
      </pre>
    );
  }

  return <code className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[12px] text-slate-700">{String(value)}</code>;
}

function renderFieldList(value: unknown): ReactNode {
  if (!isPlainObject(value)) {
    return <div className="rounded-[22px] border border-slate-200/80 bg-white/75 p-3">{renderStructuredValue(value)}</div>;
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return <p className="rounded-[22px] border border-dashed border-slate-200 bg-white/70 p-3 text-sm text-slate-500">No fields</p>;
  }

  return (
    <div className="space-y-2.5">
      {entries.map(([key, fieldValue]) => (
        <div key={key} className="space-y-2 rounded-[22px] border border-slate-200/80 bg-white/75 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{humanizeKey(key)}</div>
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
      badgeClassName: 'border border-violet-200 bg-violet-50 text-violet-700',
      cardClassName: 'border-violet-200 bg-violet-50/60',
      resultClassName: 'border-violet-200 bg-white text-violet-950',
    };
  }

  if (!interaction.result) {
    return {
      label: 'waiting',
      badgeClassName: 'border border-amber-200 bg-amber-50 text-amber-700',
      cardClassName: 'border-amber-200 bg-amber-50/60',
      resultClassName: 'border-amber-200 bg-white text-amber-900',
    };
  }

  if (looksLikeFailure(interaction.result.contentText)) {
    return {
      label: 'failed',
      badgeClassName: 'border border-rose-200 bg-rose-50 text-rose-700',
      cardClassName: 'border-rose-200 bg-rose-50/60',
      resultClassName: 'border-rose-200 bg-white text-rose-950',
    };
  }

  return {
    label: 'completed',
    badgeClassName: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    cardClassName: 'border-slate-200 bg-white/90',
    resultClassName: 'border-slate-200 bg-slate-50 text-slate-800',
  };
}

function renderResultBody(result: ToolResult, presentation: InteractionPresentation): ReactNode {
  const content = result.content;

  if (typeof content === 'string') {
    if (content.includes('\n') || content.length > 160) {
      return (
        <pre
          className={`max-h-56 overflow-auto rounded-[22px] border p-3 font-mono text-[12px] leading-6 whitespace-pre-wrap break-words ${presentation.resultClassName}`}
        >
          {content}
        </pre>
      );
    }

    return <div className={`rounded-[22px] border px-3 py-2 text-sm leading-6 ${presentation.resultClassName}`}>{content}</div>;
  }

  return renderFieldList(content);
}

function ToolInteractionCard({ interaction }: { interaction: ToolInteraction }) {
  const presentation = getInteractionPresentation(interaction);
  const toolName = interaction.call?.name ?? 'Unmatched Result';

  return (
    <article className={`rounded-[26px] border p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.42)] ${presentation.cardClassName}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[18px] border border-slate-900 bg-slate-900 text-white">
            <span className="text-[8px] font-semibold uppercase tracking-[0.24em] opacity-70">call</span>
            <span className="mt-1 text-sm font-semibold">{formatStepIndex(interaction.order)}</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tool Interaction</p>
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
              <details className="rounded-[22px] border border-slate-200/80 bg-white/80 p-3">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Raw Arguments</summary>
                <pre className="mt-3 max-h-48 overflow-auto rounded-[20px] border border-white/80 bg-white/90 p-3 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
                  {interaction.call.argumentsText || '(empty arguments)'}
                </pre>
              </details>
            </>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
              No tool call was matched to this result payload.
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Result</p>
          {interaction.result ? (
            <>
              {renderResultBody(interaction.result, presentation)}
              <details className="rounded-[22px] border border-slate-200/80 bg-white/80 p-3">
                <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Raw Result</summary>
                <pre className="mt-3 max-h-48 overflow-auto rounded-[20px] border border-white/80 bg-white/90 p-3 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
                  {interaction.result.contentText || '(empty result)'}
                </pre>
              </details>
            </>
          ) : (
            <div className={`rounded-[22px] border px-3 py-2 text-sm ${presentation.resultClassName}`}>
              Waiting for the tool result to arrive.
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {interaction.call?.callId ? <SurfaceChip>callId {interaction.call.callId}</SurfaceChip> : null}
        {interaction.result?.toolUseId ? <SurfaceChip>toolUseId {interaction.result.toolUseId}</SurfaceChip> : null}
      </div>
    </article>
  );
}

export function StepDetail({ trajectory, selectedStep, currentRoundGroup, onOpenAnnotation }: StepDetailProps) {
  const inputText = selectedStep.input ?? 'N/A';
  const outputText = selectedStep.output ?? 'N/A';
  const toolCalls = selectedStep.toolCalls ?? [];
  const toolResults = selectedStep.toolResults ?? [];
  const toolInteractions = selectedStep.toolInteractions ?? [];
  const isToolStep =
    selectedStep.type === 'tool' || toolCalls.length > 0 || toolResults.length > 0 || toolInteractions.length > 0;
  const hasRawInput = Boolean(inputText && inputText !== 'N/A' && inputText !== '(empty message)');
  const hasRawOutput = Boolean(outputText && outputText !== 'N/A' && outputText !== '(no output)');
  const hasDistinctOutput = hasRawOutput && outputText.trim() !== inputText.trim();
  const isUserStep = selectedStep.role === 'user';
  const isAssistantLikeStep = selectedStep.role === 'assistant' || selectedStep.type === 'respond' || selectedStep.type === 'reason';
  const statusTone = stepStatusClassMap[selectedStep.status];
  const roleTone = roleClassMap[selectedStep.role ?? 'unknown'];
  const currentRoundTaskLabel = currentRoundGroup?.taskTypeLabel ?? null;
  const currentRoundIntentLabels = currentRoundGroup?.intentTypeLabels ?? [];
  const metadataItems = [
    { label: 'step', value: selectedStep.id },
    { label: 'time', value: formatTimestamp(selectedStep.timestamp) },
    { label: 'request', value: selectedStep.metadata?.requestId },
    { label: 'model', value: selectedStep.metadata?.model },
    { label: 'stop', value: selectedStep.metadata?.stopReason },
    { label: 'input', value: selectedStep.metadata?.inputTokens !== undefined ? `${selectedStep.metadata.inputTokens} tok` : undefined },
    { label: 'output', value: selectedStep.metadata?.outputTokens !== undefined ? `${selectedStep.metadata.outputTokens} tok` : undefined },
    {
      label: 'source',
      value: selectedStep.metadata?.sourceEventIndexes?.length ? `${selectedStep.metadata.sourceEventIndexes.length} events` : undefined,
    },
  ].filter((item) => isPresentMetadataValue(item.value));

  return (
    <section className="h-full overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Step Detail</p>
          <p className="mt-2 text-sm text-slate-500">Trajectory / {trajectory.id}</p>
        </div>
        {onOpenAnnotation ? (
          <button
            type="button"
            onClick={onOpenAnnotation}
            className="rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.8)] hover:bg-slate-800"
          >
            标注此步骤
          </button>
        ) : null}
      </div>

      {currentRoundGroup ? (
        <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.82),rgba(255,255,255,0.9))] p-4 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.38)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current Round</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{currentRoundGroup.round.promptPreview}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {currentRoundGroup.round.label} · steps{' '}
                {formatStepRange(currentRoundGroup.round.startStepIndex, currentRoundGroup.round.endStepIndex)} ·{' '}
                {currentRoundGroup.round.actionStepCount} actions
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentRoundTaskLabel ? (
                <SurfaceChip className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  task {formatEnumLabel(currentRoundTaskLabel)}
                </SurfaceChip>
              ) : null}
              {currentRoundIntentLabels.map((label) => (
                <SurfaceChip key={label} className="border-amber-200 bg-amber-50 text-amber-700">
                  intent {formatEnumLabel(label)}
                </SurfaceChip>
              ))}
              <SurfaceChip>round ann {currentRoundGroup.annotationCount}</SurfaceChip>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.86))] p-4 shadow-[0_28px_55px_-40px_rgba(15,23,42,0.42)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <StepOrdinalBadge index={selectedStep.index} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${stepTypeClassMap[selectedStep.type]}`}>
                  {selectedStep.type}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusTone.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusTone.dot}`} />
                  {statusTone.label}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{selectedStep.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                当前步骤为 {selectedStep.type} 事件，保留原始 input / output / tool payload，方便快速回放判断依据。
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[280px]">
            <div className="rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Role</p>
              <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${roleTone}`}>
                {selectedStep.role ?? 'unknown'}
              </span>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Clock</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatTime(selectedStep.timestamp)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SurfaceChip className={roleTone}>role {selectedStep.role ?? 'unknown'}</SurfaceChip>
          {selectedStep.durationMs ? <SurfaceChip>duration {selectedStep.durationMs} ms</SurfaceChip> : null}
          {toolCalls.length === 1 && selectedStep.toolName ? (
            <SurfaceChip className="border-violet-200 bg-violet-50 text-violet-700">tool {selectedStep.toolName}</SurfaceChip>
          ) : null}
          {toolCalls.length > 1 ? <SurfaceChip className="border-indigo-200 bg-indigo-50 text-indigo-700">parallel calls {toolCalls.length}</SurfaceChip> : null}
          {toolResults.length ? <SurfaceChip className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700">results {toolResults.length}</SurfaceChip> : null}
        </div>
      </div>

      <div className="mt-5 space-y-4 text-sm">
        {isToolStep ? (
          <>
            <DetailBlock
              eyebrow="Tool Calls"
              title="Each card represents one tool invocation so parallel work stays easy to scan."
            >
              <div className="space-y-3">
                {toolInteractions.map((interaction) => (
                  <ToolInteractionCard
                    key={`${interaction.call?.callId ?? interaction.result?.toolUseId ?? 'interaction'}-${interaction.order}`}
                    interaction={interaction}
                  />
                ))}
              </div>
            </DetailBlock>

            {selectedStep.toolUseResult !== undefined ? (
              <DetailBlock eyebrow="Structured Tool Payload" meta={<SurfaceChip className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700">raw object</SurfaceChip>}>
                <pre className="max-h-72 overflow-auto rounded-[22px] border border-violet-200/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-violet-950 whitespace-pre-wrap break-words">
                  {toPrettyJson(selectedStep.toolUseResult)}
                </pre>
              </DetailBlock>
            ) : null}

            {hasRawInput || hasRawOutput ? (
              <DetailBlock eyebrow="Raw Transcript" title="Preserve the original text trail alongside structured tool cards.">
                <div className="space-y-3">
                  {hasRawInput ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Input</p>
                      <pre className="mt-2 max-h-52 overflow-auto rounded-[22px] border border-white/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
                        {inputText}
                      </pre>
                    </div>
                  ) : null}

                  {hasRawOutput ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Output</p>
                      <pre className="mt-2 max-h-52 overflow-auto rounded-[22px] border border-white/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
                        {outputText}
                      </pre>
                    </div>
                  ) : null}
                </div>
              </DetailBlock>
            ) : null}
          </>
        ) : (
          <>
            {isUserStep ? (
              <DetailBlock
                eyebrow="User Prompt"
                title="这一卡只保留用户原始输入，避免和系统派生的 output 摘要重复。"
                meta={<SurfaceChip>{inputText.length} chars</SurfaceChip>}
                className="border-sky-200 bg-[linear-gradient(180deg,rgba(239,246,255,0.84),rgba(255,255,255,0.94))]"
              >
                <pre className="max-h-80 overflow-auto rounded-[22px] border border-sky-200/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-slate-800 whitespace-pre-wrap break-words">
                  {inputText}
                </pre>
              </DetailBlock>
            ) : (
              <>
                {hasRawInput ? (
                  <DetailBlock
                    eyebrow={isAssistantLikeStep ? 'Input Context' : 'Input'}
                    meta={<SurfaceChip>{inputText.length} chars</SurfaceChip>}
                  >
                    <pre className="max-h-64 overflow-auto rounded-[22px] border border-white/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-slate-700 whitespace-pre-wrap break-words">
                      {inputText}
                    </pre>
                  </DetailBlock>
                ) : null}

                {hasDistinctOutput ? (
                  <DetailBlock
                    eyebrow={isAssistantLikeStep ? 'Assistant Output' : 'Output'}
                    title={isAssistantLikeStep ? '将真正产出的回复或观察结果单独拉出来，避免与输入上下文混在一起。' : undefined}
                    meta={<SurfaceChip>{outputText.length} chars</SurfaceChip>}
                    className="border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.8),rgba(255,255,255,0.94))]"
                  >
                    <pre className="max-h-72 overflow-auto rounded-[22px] border border-emerald-200/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-slate-800 whitespace-pre-wrap break-words">
                      {outputText}
                    </pre>
                  </DetailBlock>
                ) : null}
              </>
            )}
          </>
        )}

        {metadataItems.length > 0 ? (
          <section className="rounded-[20px] border border-slate-200/70 bg-white/70 px-4 py-3 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.22)]">
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Metadata</p>
              {metadataItems.map((item) => (
                <MetadataChip key={item.label} label={item.label} value={String(item.value)} />
              ))}
            </div>
          </section>
        ) : null}

        {selectedStep.error ? (
          <DetailBlock
            eyebrow="Error"
            title="Failure text stays verbatim so the investigator can compare UI judgement with raw evidence."
            className="border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.82),rgba(255,255,255,0.94))]"
          >
            <pre className="max-h-56 overflow-auto rounded-[22px] border border-rose-200/80 bg-white/95 p-4 font-mono text-[12px] leading-6 text-rose-700 whitespace-pre-wrap break-words">
              {selectedStep.error}
            </pre>
          </DetailBlock>
        ) : null}
      </div>
    </section>
  );
}
