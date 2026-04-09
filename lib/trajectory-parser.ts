import type { Step, StepStatus, Trajectory } from '@/types';

type CCMessageBlock = {
  type?: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: unknown;
};

type CCEvent = {
  uuid?: string;
  sessionId?: string;
  parentUuid?: string | null;
  timestamp?: string;
  type?: string;
  requestId?: string;
  message?: {
    role?: string;
    model?: string;
    stop_reason?: string | null;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
    };
    content?: string | CCMessageBlock[];
  } | null;
  toolUseResult?: unknown;
};

function isTrajectoryLike(input: unknown): input is Trajectory {
  return Boolean(input && typeof input === 'object' && 'steps' in input && 'id' in input);
}

function toText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function extractBlocks(content: string | CCMessageBlock[] | undefined): CCMessageBlock[] {
  if (Array.isArray(content)) {
    return content;
  }

  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }

  return [];
}

function normalizeRole(event: CCEvent): Step['role'] {
  const role = event.message?.role ?? event.type;

  switch (role) {
    case 'system':
    case 'user':
    case 'assistant':
    case 'tool':
      return role;
    default:
      return 'unknown';
  }
}

function deriveStatus(texts: string[], event: CCEvent): StepStatus {
  const haystack = texts.join(' ').toLowerCase();

  if (/\berror\b|\bexception\b|traceback|failed|keyerror|cannot/.test(haystack)) {
    return 'error';
  }

  if (/\bwarn\b|retry|deprecated|timeout/.test(haystack)) {
    return 'warn';
  }

  if (event.message?.stop_reason === 'max_tokens') {
    return 'warn';
  }

  return 'ok';
}

function formatBlock(block: CCMessageBlock): string {
  if (block.type === 'tool_use') {
    const toolName = block.name ?? 'unknown_tool';
    return `[tool_use] ${toolName}\n${toText(block.input)}`;
  }

  if (block.type === 'tool_result') {
    return `[tool_result#${block.tool_use_id ?? 'unknown'}]\n${toText(block.content)}`;
  }

  return toText(block.text ?? block.content);
}

function blockToToolCall(block: CCMessageBlock) {
  return {
    callId: block.id,
    name: block.name ?? 'unknown_tool',
    arguments: block.input,
    argumentsText: toText(block.input),
  };
}

function blockToToolResult(block: CCMessageBlock) {
  return {
    toolUseId: block.tool_use_id,
    content: block.content,
    contentText: toText(block.content),
  };
}

function buildToolInteractions(
  toolCalls: NonNullable<Step['toolCalls']>,
  toolResults: NonNullable<Step['toolResults']>,
): NonNullable<Step['toolInteractions']> {
  const unmatchedResults = [...toolResults];
  const interactions: NonNullable<Step['toolInteractions']> = [];

  toolCalls.forEach((call, index) => {
    let matchedResultIndex = -1;

    if (call.callId) {
      matchedResultIndex = unmatchedResults.findIndex((result) => result.toolUseId === call.callId);
    }

    if (matchedResultIndex < 0 && !call.callId) {
      matchedResultIndex = unmatchedResults.findIndex((result) => !result.toolUseId);
    }

    const result = matchedResultIndex >= 0 ? unmatchedResults.splice(matchedResultIndex, 1)[0] : undefined;

    interactions.push({
      order: index + 1,
      status: result ? 'matched' : 'pending',
      call,
      result,
    });
  });

  unmatchedResults.forEach((result, index) => {
    interactions.push({
      order: toolCalls.length + index + 1,
      status: 'unmatched',
      result,
    });
  });

  return interactions;
}

function hasToolUse(blocks: CCMessageBlock[]): boolean {
  return blocks.some((block) => block.type === 'tool_use');
}

function hasToolResult(blocks: CCMessageBlock[]): boolean {
  return blocks.some((block) => block.type === 'tool_result');
}

function summarizeTitle(role: Step['role'], blocks: CCMessageBlock[], fallback: string): string {
  const firstText = blocks
    .map((block) => block.text ?? (typeof block.content === 'string' ? block.content : ''))
    .find((text) => text && text.trim().length > 0);

  const toolUses = blocks.filter((block) => block.type === 'tool_use');
  const firstTool = toolUses[0];

  if (toolUses.length > 1) {
    return `${role}: ${toolUses.length} tool calls`;
  }

  if (firstTool) {
    return `${role}: ${firstTool.name ?? 'unknown_tool'}`;
  }

  if (firstText) {
    return `${role}: ${firstText.replace(/\s+/g, ' ').slice(0, 72)}`;
  }

  return `${role}: ${fallback}`;
}

function toStepType(role: Step['role'], blocks: CCMessageBlock[], index: number, total: number): Step['type'] {
  if (blocks.some((block) => block.type === 'tool_use' || block.type === 'tool_result')) {
    return 'tool';
  }

  if (role === 'system') {
    return 'plan';
  }

  if (role === 'user' || role === 'tool') {
    return 'observe';
  }

  if (role === 'assistant' && index === total) {
    return 'respond';
  }

  return 'reason';
}

function parseCCTrajectory(events: CCEvent[]): Trajectory {
  const sortedEvents = [...events].sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));
  const firstUserEvent = sortedEvents.find((event) => normalizeRole(event) === 'user');

  const task =
    (typeof firstUserEvent?.message?.content === 'string' ? firstUserEvent.message.content : '') ||
    'Imported Claude Code trajectory';

  const trajectoryId = `traj_cc_${sortedEvents[0]?.sessionId ?? sortedEvents[0]?.uuid ?? 'sample'}`;

  const consumedEventIndexes = new Set<number>();
  const steps: Step[] = [];

  sortedEvents.forEach((event, idx) => {
    if (consumedEventIndexes.has(idx)) {
      return;
    }

    const blocks = extractBlocks(event.message?.content);
    const role = normalizeRole(event);

    const input = blocks
      .filter((block) => block.type !== 'tool_result')
      .map(formatBlock)
      .filter(Boolean)
      .join('\n\n');

    const output = blocks
      .filter((block) => block.type === 'tool_result' || block.type === 'text')
      .map(formatBlock)
      .filter(Boolean)
      .join('\n\n');

    const title = summarizeTitle(role, blocks, event.type ?? 'message');
    const toolCalls = blocks.filter((block) => block.type === 'tool_use').map(blockToToolCall);
    const inMessageToolResults = blocks.filter((block) => block.type === 'tool_result').map(blockToToolResult);
    const toolName = toolCalls.length === 1 ? toolCalls[0]?.name : undefined;
    const currentStepIndex = steps.length + 1;

    const canBindResultEvent = role === 'assistant' && hasToolUse(blocks) && idx < sortedEvents.length - 1;
    let mergedToolResults = [...inMessageToolResults];
    let mergedToolUseResult: unknown = event.toolUseResult;
    let mergedOutput = output || '(no output)';
    let mergedStatus = deriveStatus([title, input, output], event);

    if (canBindResultEvent) {
      const nextEvent = sortedEvents[idx + 1];
      const nextBlocks = extractBlocks(nextEvent.message?.content);
      const nextRole = normalizeRole(nextEvent);
      const isLikelyToolResultEvent =
        nextRole === 'user' &&
        (hasToolResult(nextBlocks) || nextEvent.toolUseResult !== undefined || (nextEvent.parentUuid && nextEvent.parentUuid === event.uuid));

      if (isLikelyToolResultEvent) {
        mergedToolResults = [...mergedToolResults, ...nextBlocks.filter((block) => block.type === 'tool_result').map(blockToToolResult)];
        mergedToolUseResult = nextEvent.toolUseResult ?? mergedToolUseResult;

        const nextOutput = nextBlocks
          .filter((block) => block.type === 'tool_result' || block.type === 'text')
          .map(formatBlock)
          .filter(Boolean)
          .join('\n\n');

        if (nextOutput) {
          mergedOutput = mergedOutput === '(no output)' ? nextOutput : `${mergedOutput}\n\n${nextOutput}`;
        }

        mergedStatus = deriveStatus([title, input, mergedOutput, toText(mergedToolUseResult)], nextEvent);
        consumedEventIndexes.add(idx + 1);
      }
    }

    const toolInteractions = buildToolInteractions(toolCalls, mergedToolResults);

    steps.push({
      id: event.uuid ?? `s${idx + 1}`,
      index: currentStepIndex,
      type: toStepType(role, blocks, currentStepIndex, sortedEvents.length),
      title,
      input: input || '(empty message)',
      output: mergedOutput,
      toolUseResult: mergedToolUseResult,
      toolName,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      toolResults: mergedToolResults.length > 0 ? mergedToolResults : undefined,
      toolInteractions: toolInteractions.length > 0 ? toolInteractions : undefined,
      status: mergedStatus,
      error: mergedStatus === 'error' ? mergedOutput || input : undefined,
      role,
      timestamp: event.timestamp,
      metadata: {
        parentUuid: event.parentUuid,
        requestId: event.requestId,
        model: event.message?.model,
        stopReason: event.message?.stop_reason,
        inputTokens: event.message?.usage?.input_tokens,
        outputTokens: event.message?.usage?.output_tokens,
      },
    });
  });

  return {
    id: trajectoryId,
    task: task.slice(0, 180),
    dataset: 'claude-code-events',
    createdAt: sortedEvents[0]?.timestamp ?? new Date().toISOString(),
    steps,
    annotations: [],
  };
}

export function parseTrajectory(input: unknown): Trajectory {
  if (isTrajectoryLike(input)) {
    return input;
  }

  if (Array.isArray(input)) {
    return parseCCTrajectory(input as CCEvent[]);
  }

  throw new Error('Unsupported trajectory format');
}
