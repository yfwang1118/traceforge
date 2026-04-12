import ccMockAnnotations from '@/sample-data/trajectory.cc.annotations.json';
import ccExampleEventsJson from '@/sample-data/trajectory.cc.example.json';
import type {
  Annotation,
  EvidenceSpan,
  Step,
  TargetRef,
  ToolCall,
  ToolInteraction,
  ToolResult,
  Trajectory,
} from '@/types';

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

type IndexedCcEvent = {
  eventIndex: number;
  eventId: string;
  event: CcEvent;
};

type BoundToolResultItem = {
  sourceEvent: IndexedCcEvent;
  item: CcToolResultContent;
};

const ccExampleEvents = ccExampleEventsJson as unknown as CcEvent[];

function toEventId(eventIndex: number): string {
  return `cc_e${eventIndex}`;
}

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

function buildIndexedEvents(events: CcEvent[]): IndexedCcEvent[] {
  return events.map((event, index) => ({
    eventIndex: index + 1,
    eventId: toEventId(index + 1),
    event,
  }));
}

function buildToolNameMap(events: IndexedCcEvent[]): Map<string, string> {
  const map = new Map<string, string>();

  events.forEach(({ event }) => {
    getToolUseItems(event).forEach((item) => {
      if (item.id && item.name) {
        map.set(item.id, item.name);
      }
    });
  });

  return map;
}

const indexedCcEvents = buildIndexedEvents(ccExampleEvents);
const toolNameByUseId = buildToolNameMap(indexedCcEvents);

function hasToolArtifacts(event: CcEvent): boolean {
  return getToolUseItems(event).length > 0 || getToolResultItems(event).length > 0 || event.toolUseResult !== undefined;
}

function getSingleEventRole(event: CcEvent): Step['role'] {
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

function getSingleEventType(event: CcEvent): Step['type'] {
  if (hasToolArtifacts(event)) {
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

function getSingleEventStatus(event: CcEvent): Step['status'] {
  const text = `${getPrimaryText(event)}\n${getToolResultItems(event).map((item) => stringify(item.content)).join('\n')}`.trim();

  if (getToolResultItems(event).some((item) => item.is_error) || textLooksLikeError(text)) {
    return 'error';
  }

  if (textLooksLikeWarning(text)) {
    return 'warn';
  }

  return 'ok';
}

function getSingleEventError(event: CcEvent): string | undefined {
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

function buildSingleEventTitle(indexedEvent: IndexedCcEvent): string {
  const { event, eventIndex } = indexedEvent;
  const text = getPrimaryText(event);
  const toolUses = getToolUseItems(event);
  const toolResults = getToolResultItems(event);
  const role = getSingleEventRole(event);

  if (toolUses.length > 0) {
    const toolNames = toolUses.map((item) => item.name ?? 'Unknown Tool').join(' + ');
    return `${role}: ${toolNames}`;
  }

  if (toolResults.length > 0) {
    const firstResult = toolResults[0];
    const toolName = firstResult.tool_use_id ? toolNameByUseId.get(firstResult.tool_use_id) : undefined;
    return `${role}: ${toolName ? `${toolName} result` : `tool_result #${eventIndex}`}`;
  }

  if (event.toolUseResult !== undefined) {
    return `${role}: structured tool payload`;
  }

  return `${role}: ${previewText(text, 68)}`;
}

function buildSingleEventOutputSummary(indexedEvent: IndexedCcEvent): string {
  const { event, eventIndex } = indexedEvent;
  const text = getPrimaryText(event);
  const toolUses = getToolUseItems(event);
  const toolResults = getToolResultItems(event);

  if (toolUses.length > 0) {
    return `event #${eventIndex} 发起 ${toolUses.length} 个 tool_use：${toolUses.map((item) => item.name ?? 'Unknown Tool').join(', ')}`;
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
    return `event #${eventIndex} 包含结构化 toolUseResult payload`;
  }

  return previewText(text, 180);
}

function formatEventTranscript(event: CcEvent, eventIndex: number): string {
  const lines: string[] = [`event #${eventIndex}`, `type: ${event.type ?? 'unknown'}`, `timestamp: ${event.timestamp ?? 'unknown'}`];

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

function formatResultEventTranscripts(resultEvents: IndexedCcEvent[]): string {
  if (resultEvents.length === 0) {
    return '(waiting for tool_result events)';
  }

  return resultEvents
    .map((resultEvent) => formatEventTranscript(resultEvent.event, resultEvent.eventIndex))
    .join('\n\n-----\n\n');
}

function buildToolCalls(event: CcEvent): ToolCall[] {
  return getToolUseItems(event).map((item) => ({
    callId: item.id,
    name: item.name ?? 'Unknown Tool',
    arguments: item.input ?? null,
    argumentsText: stringify(item.input ?? null),
  }));
}

function buildToolResultsFromEvents(events: IndexedCcEvent[]): ToolResult[] {
  return events.flatMap(({ event }) =>
    getToolResultItems(event).map((item) => ({
      toolUseId: item.tool_use_id,
      content: item.content ?? '',
      contentText: stringify(item.content ?? ''),
    })),
  );
}

function buildToolInteractions(toolCalls: ToolCall[], toolResults: ToolResult[]): ToolInteraction[] {
  const interactions: ToolInteraction[] = toolCalls.map((call, index) => ({
    order: index + 1,
    status: 'pending',
    call,
  }));

  const interactionIndexByCallId = new Map<string, number>();
  interactions.forEach((interaction, index) => {
    const callId = interaction.call?.callId;
    if (callId && !interactionIndexByCallId.has(callId)) {
      interactionIndexByCallId.set(callId, index);
    }
  });

  const unmatchedResults: ToolResult[] = [];

  toolResults.forEach((result) => {
    const toolUseId = result.toolUseId;
    if (toolUseId) {
      const interactionIndex = interactionIndexByCallId.get(toolUseId);
      if (interactionIndex !== undefined) {
        const interaction = interactions[interactionIndex];
        if (!interaction.result) {
          interaction.result = result;
          interaction.status = 'matched';
          return;
        }
      }
    } else {
      const pendingWithoutCallId = interactions.find((interaction) => interaction.status === 'pending' && !interaction.call?.callId);
      if (pendingWithoutCallId && !pendingWithoutCallId.result) {
        pendingWithoutCallId.result = result;
        pendingWithoutCallId.status = 'matched';
        return;
      }
    }

    unmatchedResults.push(result);
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

function collectBoundToolResultItems(resultEvents: IndexedCcEvent[]): BoundToolResultItem[] {
  return resultEvents.flatMap((resultEvent) =>
    getToolResultItems(resultEvent.event).map((item) => ({
      sourceEvent: resultEvent,
      item,
    })),
  );
}

function getBoundToolStepStatus(callEvent: IndexedCcEvent, resultEvents: IndexedCcEvent[]): Step['status'] {
  const boundResults = collectBoundToolResultItems(resultEvents);
  const callText = getPrimaryText(callEvent.event);
  const resultText = boundResults.map(({ item }) => stringify(item.content ?? '')).join('\n');
  const combinedText = `${callText}\n${resultText}`.trim();

  if (boundResults.length === 0) {
    return 'warn';
  }

  if (boundResults.some(({ item }) => item.is_error) || textLooksLikeError(combinedText)) {
    return 'error';
  }

  if (textLooksLikeWarning(combinedText)) {
    return 'warn';
  }

  return 'ok';
}

function getBoundToolStepError(callEvent: IndexedCcEvent, resultEvents: IndexedCcEvent[]): string | undefined {
  const boundResults = collectBoundToolResultItems(resultEvents);

  const explicitError = boundResults.find(({ item }) => item.is_error);
  if (explicitError) {
    return stringify(explicitError.item.content ?? 'tool_result error');
  }

  const errorResult = boundResults.find(({ item }) => textLooksLikeError(stringify(item.content ?? '')));
  if (errorResult) {
    return stringify(errorResult.item.content ?? '');
  }

  const callText = getPrimaryText(callEvent.event);
  if (textLooksLikeError(callText)) {
    return callText;
  }

  return undefined;
}

function buildBoundToolUseResult(resultEvents: IndexedCcEvent[]): unknown {
  const payloads = resultEvents
    .filter((resultEvent) => resultEvent.event.toolUseResult !== undefined)
    .map((resultEvent) => ({
      eventId: resultEvent.eventId,
      eventIndex: resultEvent.eventIndex,
      payload: resultEvent.event.toolUseResult,
    }));

  if (payloads.length === 0) {
    return undefined;
  }

  if (payloads.length === 1) {
    return payloads[0].payload;
  }

  return payloads;
}

function buildBoundToolStepTitle(toolCalls: ToolCall[], resultCount: number): string {
  const toolNames = toolCalls.map((call) => call.name).join(' + ');

  if (!toolNames) {
    return resultCount > 0 ? 'assistant: tool interaction' : 'assistant: tool interaction (waiting result)';
  }

  if (resultCount === 0) {
    return `assistant: ${toolNames} (waiting result)`;
  }

  return `assistant: ${toolNames}`;
}

function buildSingleStepFromEvent(indexedEvent: IndexedCcEvent, stepIndex: number): Step {
  const { event, eventId, eventIndex } = indexedEvent;
  const toolCalls = buildToolCalls(event);
  const toolResults = buildToolResultsFromEvents([indexedEvent]);
  const role = getSingleEventRole(event);
  const type = getSingleEventType(event);
  const text = getPrimaryText(event);

  return {
    id: eventId,
    index: stepIndex,
    type,
    title: buildSingleEventTitle(indexedEvent),
    input: type === 'tool' ? formatEventTranscript(event, eventIndex) : text || formatEventTranscript(event, eventIndex),
    output: buildSingleEventOutputSummary(indexedEvent),
    toolUseResult: event.toolUseResult,
    toolName: toolCalls.length === 1 ? toolCalls[0].name : undefined,
    status: getSingleEventStatus(event),
    error: getSingleEventError(event),
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
      sourceEventIds: [eventId],
      sourceEventIndexes: [eventIndex],
    },
  };
}

function buildBoundToolStep(callEvent: IndexedCcEvent, resultEvents: IndexedCcEvent[], stepIndex: number): Step {
  const toolCalls = buildToolCalls(callEvent.event);
  const toolResults = buildToolResultsFromEvents(resultEvents);
  const sourceEvents = [callEvent, ...resultEvents];

  return {
    id: callEvent.eventId,
    index: stepIndex,
    type: 'tool',
    title: buildBoundToolStepTitle(toolCalls, toolResults.length),
    input: formatEventTranscript(callEvent.event, callEvent.eventIndex),
    output: formatResultEventTranscripts(resultEvents),
    toolUseResult: buildBoundToolUseResult(resultEvents),
    toolName: toolCalls.length === 1 ? toolCalls[0].name : undefined,
    status: getBoundToolStepStatus(callEvent, resultEvents),
    error: getBoundToolStepError(callEvent, resultEvents),
    role: 'assistant',
    timestamp: callEvent.event.timestamp,
    toolCalls,
    toolResults,
    toolInteractions: buildToolInteractions(toolCalls, toolResults),
    metadata: {
      parentUuid: callEvent.event.parentUuid ?? null,
      requestId: callEvent.event.requestId,
      model: callEvent.event.message?.model,
      stopReason: callEvent.event.message?.stop_reason ?? null,
      inputTokens: callEvent.event.message?.usage?.input_tokens,
      outputTokens: callEvent.event.message?.usage?.output_tokens,
      sourceEventIds: sourceEvents.map((event) => event.eventId),
      sourceEventIndexes: sourceEvents.map((event) => event.eventIndex),
    },
  };
}

function shouldBindResultEvent(
  resultEvent: IndexedCcEvent,
  toolUseIdSet: Set<string>,
  allowImplicitSingleCallResult: boolean,
): boolean {
  const resultItems = getToolResultItems(resultEvent.event);
  if (resultItems.length === 0) {
    return false;
  }

  return resultItems.some((item) => {
    if (item.tool_use_id) {
      return toolUseIdSet.has(item.tool_use_id);
    }
    return allowImplicitSingleCallResult;
  });
}

function buildMergedSteps(events: IndexedCcEvent[]): { steps: Step[]; eventToStepId: Record<string, string> } {
  const steps: Step[] = [];
  const eventToStepId: Record<string, string> = {};
  let nextStepIndex = 1;

  for (let cursor = 0; cursor < events.length; cursor += 1) {
    const currentEvent = events[cursor];
    const toolUseItems = getToolUseItems(currentEvent.event);

    if (toolUseItems.length > 0) {
      const toolCalls = buildToolCalls(currentEvent.event);
      const toolUseIdSet = new Set(toolCalls.map((call) => call.callId).filter((callId): callId is string => Boolean(callId)));
      const allowImplicitSingleCallResult = toolCalls.length === 1 && !toolCalls[0]?.callId;

      const boundResultEvents: IndexedCcEvent[] = [];
      let scanCursor = cursor + 1;

      while (scanCursor < events.length) {
        const candidateEvent = events[scanCursor];

        if (getToolUseItems(candidateEvent.event).length > 0) {
          break;
        }

        if (getToolResultItems(candidateEvent.event).length === 0) {
          break;
        }

        if (!shouldBindResultEvent(candidateEvent, toolUseIdSet, allowImplicitSingleCallResult)) {
          break;
        }

        boundResultEvents.push(candidateEvent);
        scanCursor += 1;
      }

      const step = buildBoundToolStep(currentEvent, boundResultEvents, nextStepIndex);
      steps.push(step);

      [currentEvent, ...boundResultEvents].forEach((sourceEvent) => {
        eventToStepId[sourceEvent.eventId] = step.id;
      });

      nextStepIndex += 1;
      cursor = scanCursor - 1;
      continue;
    }

    const step = buildSingleStepFromEvent(currentEvent, nextStepIndex);
    steps.push(step);
    eventToStepId[currentEvent.eventId] = step.id;
    nextStepIndex += 1;
  }

  return { steps, eventToStepId };
}

function remapStepRef(stepId: string, eventToStepId: Record<string, string>): string {
  return eventToStepId[stepId] ?? stepId;
}

function remapTargetRef(target: TargetRef, eventToStepId: Record<string, string>): TargetRef {
  switch (target.type) {
    case 'step':
      return {
        ...target,
        stepId: remapStepRef(target.stepId, eventToStepId),
      };
    case 'span':
      return {
        ...target,
        startStepId: remapStepRef(target.startStepId, eventToStepId),
        endStepId: remapStepRef(target.endStepId, eventToStepId),
      };
    case 'transition':
      return {
        ...target,
        fromStepId: remapStepRef(target.fromStepId, eventToStepId),
        toStepId: remapStepRef(target.toStepId, eventToStepId),
      };
    case 'comparison':
      return {
        ...target,
        left: remapTargetRef(target.left, eventToStepId),
        right: remapTargetRef(target.right, eventToStepId),
      };
    default:
      return target;
  }
}

function remapEvidenceSpans(evidence: EvidenceSpan[] | undefined, eventToStepId: Record<string, string>): EvidenceSpan[] | undefined {
  if (!evidence) {
    return evidence;
  }

  return evidence.map((item) => ({
    ...item,
    stepId: item.stepId ? remapStepRef(item.stepId, eventToStepId) : item.stepId,
    startStepId: item.startStepId ? remapStepRef(item.startStepId, eventToStepId) : item.startStepId,
    endStepId: item.endStepId ? remapStepRef(item.endStepId, eventToStepId) : item.endStepId,
  }));
}

function remapAnnotations(annotations: Annotation[], eventToStepId: Record<string, string>): Annotation[] {
  return annotations.map((annotation) => ({
    ...annotation,
    target: remapTargetRef(annotation.target, eventToStepId),
    evidence: remapEvidenceSpans(annotation.evidence, eventToStepId),
  }));
}

export function buildClaudeCodeExampleTrajectory(): Trajectory {
  const { steps, eventToStepId } = buildMergedSteps(indexedCcEvents);
  const annotations = remapAnnotations(ccMockAnnotations as Annotation[], eventToStepId);

  return {
    id: 'traj_cc_prompt_real_llm_001',
    task: 'Claude Code 原始 event log：将 prompt 发送后的 title/content 从假数据切换为真实 LLM 调用',
    dataset: 'claude-code-event-log',
    createdAt: ccExampleEvents[0]?.timestamp ?? '2025-07-26T12:11:00.227Z',
    steps,
    annotations,
  };
}
