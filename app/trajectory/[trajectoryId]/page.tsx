import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { AnnotationPanel } from '@/features/annotation/components/annotation-panel';
import { StepDetail } from '@/features/trajectory/components/step-detail';
import { StepTimeline } from '@/features/trajectory/components/step-timeline';
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

  const selectedStep = trajectory.steps[0];

  return (
    <AppShell>
      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Trajectory Detail (Skeleton)</h2>
        <p className="mt-1 text-sm text-slate-600">{trajectory.task}</p>
      </section>

      <section className="grid min-h-[560px] grid-cols-12 gap-4">
        <div className="col-span-3">
          <StepTimeline steps={trajectory.steps} />
        </div>
        <div className="col-span-6">
          <StepDetail trajectory={trajectory} selectedStep={selectedStep} />
        </div>
        <div className="col-span-3">
          <AnnotationPanel trajectory={trajectory} annotations={trajectory.annotations} />
        </div>
      </section>
    </AppShell>
  );
}
