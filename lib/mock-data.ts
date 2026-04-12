import { buildClaudeCodeExampleTrajectory } from '@/lib/cc-trajectory-adapter';
import sampleTrajectory from '@/sample-data/trajectory.sample.json';
import type { Trajectory } from '@/types';

export function loadAllMockTrajectories(): Trajectory[] {
  return [buildClaudeCodeExampleTrajectory(), sampleTrajectory as Trajectory];
}

export function loadSampleTrajectory(): Trajectory {
  return loadAllMockTrajectories()[0];
}

export function loadTrajectoryById(id: string): Trajectory | null {
  return loadAllMockTrajectories().find((trajectory) => trajectory.id === id) ?? null;
}
