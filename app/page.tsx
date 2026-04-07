import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { loadSampleTrajectory } from '@/lib/mock-data';

export default function HomePage() {
  const trajectory = loadSampleTrajectory();

  return (
    <AppShell>
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Traceforge MVP Skeleton</h2>
        <p className="mt-2 text-sm text-slate-600">
          当前为文档驱动的最小技术骨架：仅使用 mock data，不接数据库。
        </p>

        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Sample Trajectory:</span> {trajectory.id}
          </p>
          <p>
            <span className="font-medium">Task:</span> {trajectory.task}
          </p>
          <p>
            <span className="font-medium">Steps:</span> {trajectory.steps.length}
          </p>
        </div>

        <Link
          href={`/trajectory/${trajectory.id}`}
          className="mt-6 inline-flex rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          打开 Trajectory Detail 骨架
        </Link>
      </section>
    </AppShell>
  );
}
