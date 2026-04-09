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

function summarizeTitle(role: Step['role'], blocks: CCMessageBlock[], fallback: string): string {
  const firstText = blocks
    .map((block) => block.text ?? (typeof block.content === 'string' ? block.content : ''))
    .find((text) => text && text.trim().length > 0);

  const firstTool = blocks.find((block) => block.type === 'tool_use');

  if (firstTool) {
    return `${role}: tool_use ${firstTool.name ?? 'unknown_tool'}`;
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

  const steps: Step[] = sortedEvents.map((event, idx) => {
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
    const toolName = blocks
      .filter((block) => block.type === 'tool_use')
      .map((block) => block.name)
      .filter(Boolean)
      .join(', ');

    const status = deriveStatus([title, input, output], event);

    return {
      id: event.uuid ?? `s${idx + 1}`,
      index: idx + 1,
      type: toStepType(role, blocks, idx + 1, sortedEvents.length),
      title,
      input: input || '(empty message)',
      output: output || '(no output)',
      toolName: toolName || undefined,
      status,
      error: status === 'error' ? output || input : undefined,
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
    };
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
