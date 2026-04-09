import ccTrajectory from '@/sample-data/trajectory.cc.example.json';
import type { Trajectory } from '@/types';
import { parseTrajectory } from '@/lib/trajectory-parser';

export function loadSampleTrajectory(): Trajectory {
  return parseTrajectory(ccTrajectory);
}

export function loadTrajectoryById(id: string): Trajectory | null {
  const trajectory = loadSampleTrajectory();
  return trajectory.id === id ? trajectory : null;
}
