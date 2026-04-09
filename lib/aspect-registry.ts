import type { AspectSpec } from '@/types';

export const aspectRegistry: AspectSpec[] = [
  {
    key: 'tool_call_validity',
    name: 'Tool Call Validity',
    description: 'Whether tool selection/arguments/result handling are valid for the current objective.',
    allowedTargetTypes: ['step', 'span', 'trajectory'],
    valueType: 'categorical',
    valueConstraints: { options: ['valid', 'invalid', 'not_applicable'] },
    guideline: 'Use for tool-call quality judgement and obvious misuse.',
    version: '1.0.0',
    active: true,
  },
  {
    key: 'decision_criticality',
    name: 'Decision Criticality',
    description: 'How critical this decision is to final trajectory outcome.',
    allowedTargetTypes: ['step', 'span', 'trajectory'],
    valueType: 'ordinal',
    valueConstraints: { min: 1, max: 5 },
    guideline: '1 = minor, 5 = outcome-critical decision.',
    version: '1.0.0',
    active: true,
  },
  {
    key: 'failure_mode',
    name: 'Failure Mode',
    description: 'Text label describing dominant failure mode observed on target.',
    allowedTargetTypes: ['step', 'span', 'trajectory'],
    valueType: 'text',
    guideline: 'Use concise snake_case label, e.g. unsupported_claim, tool_misuse.',
    version: '1.0.0',
    active: true,
  },
];

export const aspectRegistryMap = Object.fromEntries(aspectRegistry.map((aspect) => [aspect.key, aspect]));
