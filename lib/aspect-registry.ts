import type { AspectSpec } from '@/types';

export const aspectRegistry: AspectSpec[] = [
  {
    key: 'correctness.task_understanding',
    name: 'Task Understanding',
    description: 'Whether the step/trajectory correctly captures user intent and constraints.',
    allowedTargetTypes: ['step', 'span', 'trajectory'],
    valueType: 'categorical',
    valueConstraints: { options: ['strong', 'adequate', 'weak'] },
    version: '1.0.0',
    active: true,
  },
  {
    key: 'planning.decomposition_quality',
    name: 'Decomposition Quality',
    description: 'Quality of plan decomposition into executable subtasks.',
    allowedTargetTypes: ['step', 'span', 'trajectory'],
    valueType: 'categorical',
    valueConstraints: { options: ['good', 'ok', 'bad'] },
    version: '1.0.0',
    active: true,
  },
  {
    key: 'factuality.grounding',
    name: 'Factual Grounding',
    description: 'Whether claims are grounded in evidence from context or tools.',
    allowedTargetTypes: ['step', 'span', 'trajectory'],
    valueType: 'categorical',
    valueConstraints: { options: ['strong', 'partial', 'weak'] },
    version: '1.0.0',
    active: true,
  },
];
