import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { TrajectoryReviewWorkspace } from '@/features/trajectory/components/trajectory-review-workspace';
import { loadTrajectoryById } from '@/lib/mock-data';

type TrajectoryDetailPageProps = {
  params: Promise<{ trajectoryId: string }>;
};

export default async function TrajectoryDetailPage({ params }: TrajectoryDetailPageProps) {
  const { trajectoryId } = await params;
  const trajectory = loadTrajectoryById(trajectoryId);

  if (!trajectory) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Trajectory Detail</h2>
        <p className="mt-1 text-sm text-slate-600">{trajectory.task}</p>
      </section>
      <TrajectoryReviewWorkspace trajectory={trajectory} />
    </AppShell>
  );
}
