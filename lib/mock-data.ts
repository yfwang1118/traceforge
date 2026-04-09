import sampleTrajectory from '@/sample-data/trajectory.real.example.json';
import type { Trajectory } from '@/types';

export function loadSampleTrajectory(): Trajectory {
  return sampleTrajectory as Trajectory;
}

export function loadTrajectoryById(id: string): Trajectory | null {
  const trajectory = loadSampleTrajectory();
  return trajectory.id === id ? trajectory : null;
}
