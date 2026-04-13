import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { TrajectoryReviewWorkspace } from '@/features/trajectory/components/trajectory-review-workspace';
import { loadTrajectoryById } from '@/lib/mock-data';
import { buildConversationRounds, countConversationJumps } from '@/lib/trajectory-presentation';

type TrajectoryDetailPageProps = {
  params: Promise<{ trajectoryId: string }>;
};

export default async function TrajectoryDetailPage({ params }: TrajectoryDetailPageProps) {
  const { trajectoryId } = await params;
  const trajectory = loadTrajectoryById(trajectoryId);

  if (!trajectory) {
    notFound();
  }

  const rounds = buildConversationRounds(trajectory.steps, trajectory.steps[0]?.id ?? '');
  const conversationJumpCount = countConversationJumps(rounds);

  return (
    <AppShell>
      <section className="mb-5 overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.84))] p-5 shadow-[0_28px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Trajectory Detail</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{trajectory.task}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              当前以研究可读优先的 step 视图回放轨迹：普通消息按 event 展示，工具调用与返回结果绑定展示。
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Trajectory</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{trajectory.id}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Steps</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{trajectory.steps.length}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Annotations</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{trajectory.annotations.length}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Rounds</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{rounds.length}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Jumps</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{conversationJumpCount}</p>
            </div>
          </div>
        </div>
      </section>
      <TrajectoryReviewWorkspace trajectory={trajectory} />
    </AppShell>
  );
}
