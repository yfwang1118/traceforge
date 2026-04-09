import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { TrajectoryWorkbench } from '@/features/trajectory/components/trajectory-workbench';
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
        <h2 className="text-lg font-semibold text-slate-900">Trajectory Detail · Research Workbench</h2>
        <p className="mt-1 text-sm text-slate-600">{trajectory.task}</p>
        <p className="mt-1 text-xs text-slate-500">
          {trajectory.id} · {trajectory.steps.length} steps · {trajectory.annotations.length} annotations
        </p>
        {trajectory.source ? (
          <p className="mt-1 text-xs text-slate-500">
            source: {trajectory.source.name} ·{' '}
            <a className="text-blue-700 hover:underline" href={trajectory.source.url} target="_blank" rel="noreferrer">
              {trajectory.source.url}
            </a>
          </p>
        ) : null}
        <p className="mt-2 rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          Tip: Click step to inspect details. Keyboard ↑/↓ also switches current step.
        </p>
      </section>

      <TrajectoryWorkbench trajectory={trajectory} />
    </AppShell>
  );
}
