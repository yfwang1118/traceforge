import type { Step } from '@/types';

export type ConversationRound = {
  id: string;
  kind: 'preamble' | 'user_turn';
  roundIndex: number;
  label: string;
  promptPreview: string;
  promptText: string;
  leadStepId: string;
  userStepId?: string;
  startStepId: string;
  endStepId: string;
  startStepIndex: number;
  endStepIndex: number;
  stepIds: string[];
  stepCount: number;
  actionStepCount: number;
  containsSelectedStep: boolean;
};

const ROLE_PREFIX_PATTERN = /^(assistant|user|tool|system)\s*:\s*/i;

function compactText(text: string, limit = 96): string {
  const compact = text.replace(/\s+/g, ' ').trim();

  if (!compact) {
    return '(empty)';
  }

  return compact.length > limit ? `${compact.slice(0, limit - 1)}…` : compact;
}

export function stripRolePrefix(text: string): string {
  return text.replace(ROLE_PREFIX_PATTERN, '').trim();
}

export function getStepDisplayTitle(step: Step): string {
  const toolNames = (step.toolCalls ?? [])
    .map((call) => call.name)
    .filter((name, index, names) => Boolean(name) && names.indexOf(name) === index);

  if (toolNames.length > 0) {
    return toolNames.join(' · ');
  }

  if (step.role === 'user') {
    return compactText(step.input || stripRolePrefix(step.title), 110);
  }

  return stripRolePrefix(step.title);
}

export function getStepDisplayKind(step: Step): string {
  if (step.role === 'user') {
    return 'prompt';
  }

  if (step.toolCalls?.length || step.toolResults?.length || step.toolInteractions?.length || step.type === 'tool') {
    return 'action';
  }

  if (step.type === 'reason') {
    return 'analysis';
  }

  if (step.type === 'plan') {
    return 'plan';
  }

  if (step.type === 'respond') {
    return 'response';
  }

  return 'context';
}

export function shouldShowStepRole(step: Step): boolean {
  return step.role === 'user' || step.role === 'system' || step.role === 'unknown';
}

export function buildConversationRounds(steps: Step[], selectedStepId: string): ConversationRound[] {
  if (steps.length === 0) {
    return [];
  }

  const rounds: ConversationRound[] = [];
  const userStepIndexes = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.role === 'user');

  const pushRound = (
    roundSteps: Step[],
    roundIndex: number,
    kind: ConversationRound['kind'],
    leadStep: Step,
    userStep?: Step,
  ) => {
    if (roundSteps.length === 0) {
      return;
    }

    const promptText = userStep?.input || userStep?.output || userStep?.title || leadStep.title;
    const promptPreview = compactText(stripRolePrefix(promptText), 120);
    const startStep = roundSteps[0];
    const endStep = roundSteps[roundSteps.length - 1];

    rounds.push({
      id: kind === 'user_turn' ? `round-${String(roundIndex).padStart(2, '0')}` : 'round-preamble',
      kind,
      roundIndex,
      label: kind === 'user_turn' ? `Round ${String(roundIndex).padStart(2, '0')}` : 'Setup',
      promptPreview,
      promptText,
      leadStepId: leadStep.id,
      userStepId: userStep?.id,
      startStepId: startStep.id,
      endStepId: endStep.id,
      startStepIndex: startStep.index,
      endStepIndex: endStep.index,
      stepIds: roundSteps.map((step) => step.id),
      stepCount: roundSteps.length,
      actionStepCount: roundSteps.filter((step) => step.id !== userStep?.id).length,
      containsSelectedStep: roundSteps.some((step) => step.id === selectedStepId),
    });
  };

  const firstUserStepIndex = userStepIndexes[0]?.index ?? -1;

  if (firstUserStepIndex > 0) {
    const preambleSteps = steps.slice(0, firstUserStepIndex);
    pushRound(preambleSteps, 0, 'preamble', preambleSteps[0]);
  }

  userStepIndexes.forEach(({ step: userStep, index }, userIndex) => {
    const nextUserIndex = userStepIndexes[userIndex + 1]?.index ?? steps.length;
    const roundSteps = steps.slice(index, nextUserIndex);
    pushRound(roundSteps, userIndex + 1, 'user_turn', userStep, userStep);
  });

  if (rounds.length === 0) {
    pushRound(steps, 0, 'preamble', steps[0]);
  }

  return rounds;
}

export function countConversationJumps(rounds: ConversationRound[]): number {
  return Math.max(rounds.length - 1, 0);
}

export function findCurrentConversationRound(
  rounds: ConversationRound[],
  selectedStepId: string,
): ConversationRound | null {
  return rounds.find((round) => round.stepIds.includes(selectedStepId)) ?? null;
}
