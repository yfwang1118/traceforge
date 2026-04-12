import ccMockAnnotations from '@/sample-data/trajectory.cc.annotations.json';
import ccExampleEventsJson from '@/sample-data/trajectory.cc.example.json';
import type { Annotation, Step, ToolCall, ToolInteraction, ToolResult, Trajectory } from '@/types';

type CcToolUseContent = {
  type: 'tool_use';
  id?: string;
  name?: string;
  input?: unknown;
};

type CcToolResultContent = {
  type: 'tool_result';
  tool_use_id?: string;
  content?: unknown;
  is_error?: boolean;
};

type CcTextContent = {
  type: 'text';
  text?: string;
};

type CcMessageContent = CcToolUseContent | CcToolResultContent | CcTextContent;

type CcMessage = {
  role?: 'user' | 'assistant';
  model?: string;
  content?: string | CcMessageContent[];
  stop_reason?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

type CcEvent = {
  parentUuid?: string | null;
  requestId?: string;
  timestamp?: string;
  toolUseResult?: unknown;
  type?: 'user' | 'assistant';
  uuid?: string;
  message?: CcMessage;
};

const ccExampleEvents = ccExampleEventsJson as unknown as CcEvent[];

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value;
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

function asContentList(content: CcMessage['content']): CcMessageContent[] {
  return Array.isArray(content) ? content : [];
}

function previewText(text: string, limit = 56): string {
  const compact = text.replace(/\s+/g, ' ').trim();

  if (!compact) {
    return '(empty)';
  }

  return compact.length > limit ? `${compact.slice(0, limit - 1)}…` : compact;
}

function getPrimaryText(event: CcEvent): string {
  const content = event.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  return asContentList(content)
    .filter((item): item is CcTextContent => item.type === 'text')
    .map((item) => item.text ?? '')
    .join('\n\n');
}

function getToolUseItems(event: CcEvent): CcToolUseContent[] {
  return asContentList(event.message?.content).filter((item): item is CcToolUseContent => item.type === 'tool_use');
}

function getToolResultItems(event: CcEvent): CcToolResultContent[] {
  return asContentList(event.message?.content).filter((item): item is CcToolResultContent => item.type === 'tool_result');
}

function buildToolNameMap(events: CcEvent[]): Map<string, string> {
  const map = new Map<string, string>();

  events.forEach((event) => {
    getToolUseItems(event).forEach((item) => {
      if (item.id && item.name) {
        map.set(item.id, item.name);
      }
    });
  });

  return map;
}

const toolNameByUseId = buildToolNameMap(ccExampleEvents);

function getEventRole(event: CcEvent): Step['role'] {
  if (getToolResultItems(event).length > 0 || event.toolUseResult !== undefined) {
    return 'tool';
  }

  if (event.message?.role === 'assistant') {
    return 'assistant';
  }

  if (event.message?.role === 'user') {
    return 'user';
  }

  return 'unknown';
}

function getEventType(event: CcEvent): Step['type'] {
  if (getToolUseItems(event).length > 0 || getToolResultItems(event).length > 0 || event.toolUseResult !== undefined) {
    return 'tool';
  }

  if (event.message?.role === 'assistant') {
    return 'reason';
  }

  return 'observe';
}

function textLooksLikeWarning(text: string): boolean {
  return /interrupted|no files found|no changes to make|please continue/i.test(text);
}

function textLooksLikeError(text: string): boolean {
  return /error|exception|failed|does not exist|not found|traceback/i.test(text);
}

function getEventStatus(event: CcEvent): Step['status'] {
  const text = `${getPrimaryText(event)}\n${getToolResultItems(event).map((item) => stringify(item.content)).join('\n')}`.trim();

  if (getToolResultItems(event).some((item) => item.is_error) || textLooksLikeError(text)) {
    return 'error';
  }

  if (textLooksLikeWarning(text)) {
    return 'warn';
  }

  return 'ok';
}

function getEventError(event: CcEvent): string | undefined {
  const results = getToolResultItems(event);
  const explicitError = results.find((item) => item.is_error);

  if (explicitError) {
    return stringify(explicitError.content ?? 'tool_result error');
  }

  const text = getPrimaryText(event);
  if (textLooksLikeError(text)) {
    return text;
  }

  const errorResult = results.find((item) => textLooksLikeError(stringify(item.content)));
  if (errorResult) {
    return stringify(errorResult.content);
  }

  return undefined;
}

function buildTitle(event: CcEvent, index: number): string {
  const text = getPrimaryText(event);
  const toolUses = getToolUseItems(event);
  const toolResults = getToolResultItems(event);
  const role = getEventRole(event);

  if (toolUses.length > 0) {
    const toolNames = toolUses.map((item) => item.name ?? 'Unknown Tool').join(' + ');
    return `${role}: ${toolNames}`;
  }

  if (toolResults.length > 0) {
    const firstResult = toolResults[0];
    const toolName = firstResult.tool_use_id ? toolNameByUseId.get(firstResult.tool_use_id) : undefined;
    return `${role}: ${toolName ? `${toolName} result` : `tool_result #${index}`}`;
  }

  if (event.toolUseResult !== undefined) {
    return `${role}: structured tool payload`;
  }

  return `${role}: ${previewText(text, 68)}`;
}

function buildOutputSummary(event: CcEvent, index: number): string {
  const text = getPrimaryText(event);
  const toolUses = getToolUseItems(event);
  const toolResults = getToolResultItems(event);

  if (toolUses.length > 0) {
    return `event #${index} 发起 ${toolUses.length} 个 tool_use：${toolUses.map((item) => item.name ?? 'Unknown Tool').join(', ')}`;
  }

  if (toolResults.length > 0) {
    return toolResults
      .map((item) => {
        const toolName = item.tool_use_id ? toolNameByUseId.get(item.tool_use_id) : undefined;
        const prefix = toolName ? `${toolName}: ` : '';
        return `${prefix}${previewText(stringify(item.content ?? ''), 120)}`;
      })
      .join('\n');
  }

  if (event.toolUseResult !== undefined) {
    return `event #${index} 包含结构化 toolUseResult payload`;
  }

  return previewText(text, 180);
}

function formatEventTranscript(event: CcEvent, index: number): string {
  const lines: string[] = [`event #${index}`, `type: ${event.type ?? 'unknown'}`, `timestamp: ${event.timestamp ?? 'unknown'}`];

  if (event.uuid) {
    lines.push(`uuid: ${event.uuid}`);
  }

  if (event.parentUuid !== undefined) {
    lines.push(`parentUuid: ${event.parentUuid ?? 'null'}`);
  }

  if (event.requestId) {
    lines.push(`requestId: ${event.requestId}`);
  }

  if (event.message?.role) {
    lines.push(`message.role: ${event.message.role}`);
  }

  if (typeof event.message?.content === 'string') {
    lines.push('');
    lines.push(event.message.content);
  } else {
    asContentList(event.message?.content).forEach((item, contentIndex) => {
      lines.push('');
      lines.push(`content[${contentIndex}].type: ${item.type}`);

      if (item.type === 'text') {
        lines.push(item.text ?? '');
      }

      if (item.type === 'tool_use') {
        if (item.id) {
          lines.push(`tool_use.id: ${item.id}`);
        }
        if (item.name) {
          lines.push(`tool_use.name: ${item.name}`);
        }
        lines.push(stringify(item.input ?? null));
      }

      if (item.type === 'tool_result') {
        if (item.tool_use_id) {
          lines.push(`tool_result.tool_use_id: ${item.tool_use_id}`);
        }
        if (item.is_error !== undefined) {
          lines.push(`tool_result.is_error: ${String(item.is_error)}`);
        }
        lines.push(stringify(item.content ?? ''));
      }
    });
  }

  if (event.toolUseResult !== undefined) {
    lines.push('');
    lines.push('toolUseResult:');
    lines.push(stringify(event.toolUseResult));
  }

  return lines.join('\n');
}

function buildToolCalls(event: CcEvent): ToolCall[] {
  return getToolUseItems(event).map((item) => ({
    callId: item.id,
    name: item.name ?? 'Unknown Tool',
    arguments: item.input ?? null,
    argumentsText: stringify(item.input ?? null),
  }));
}

function buildToolResults(event: CcEvent): ToolResult[] {
  return getToolResultItems(event).map((item) => ({
    toolUseId: item.tool_use_id,
    content: item.content ?? '',
    contentText: stringify(item.content ?? ''),
  }));
}

function buildToolInteractions(toolCalls: ToolCall[], toolResults: ToolResult[]): ToolInteraction[] {
  const interactions: ToolInteraction[] = [];

  toolCalls.forEach((call, index) => {
    interactions.push({
      order: index + 1,
      status: 'pending',
      call,
    });
  });

  toolResults.forEach((result, index) => {
    interactions.push({
      order: toolCalls.length + index + 1,
      status: 'unmatched',
      result,
    });
  });

  return interactions;
}

function buildStepFromEvent(event: CcEvent, index: number): Step {
  const toolCalls = buildToolCalls(event);
  const toolResults = buildToolResults(event);
  const role = getEventRole(event);
  const type = getEventType(event);
  const text = getPrimaryText(event);
  const output = buildOutputSummary(event, index);

  return {
    id: `cc_e${index}`,
    index,
    type,
    title: buildTitle(event, index),
    input: type === 'tool' ? formatEventTranscript(event, index) : text || formatEventTranscript(event, index),
    output,
    toolUseResult: event.toolUseResult,
    toolName: toolCalls.length === 1 ? toolCalls[0].name : undefined,
    status: getEventStatus(event),
    error: getEventError(event),
    role,
    timestamp: event.timestamp,
    toolCalls,
    toolResults,
    toolInteractions: buildToolInteractions(toolCalls, toolResults),
    metadata: {
      parentUuid: event.parentUuid ?? null,
      requestId: event.requestId,
      model: event.message?.model,
      stopReason: event.message?.stop_reason ?? null,
      inputTokens: event.message?.usage?.input_tokens,
      outputTokens: event.message?.usage?.output_tokens,
    },
  };
}

export function buildClaudeCodeExampleTrajectory(): Trajectory {
  return {
    id: 'traj_cc_prompt_real_llm_001',
    task: 'Claude Code 原始 event log：将 prompt 发送后的 title/content 从假数据切换为真实 LLM 调用',
    dataset: 'claude-code-event-log',
    createdAt: ccExampleEvents[0]?.timestamp ?? '2025-07-26T12:11:00.227Z',
    steps: ccExampleEvents.map((event, index) => buildStepFromEvent(event, index + 1)),
    annotations: ccMockAnnotations as Annotation[],
  };
}
