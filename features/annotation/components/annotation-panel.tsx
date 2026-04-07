import type { Annotation, Trajectory } from '@/types';

type AnnotationPanelProps = {
  trajectory: Trajectory;
  annotations: Annotation[];
};

export function AnnotationPanel({ trajectory, annotations }: AnnotationPanelProps) {
  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">Annotation Panel</h3>
      <p className="mt-1 text-xs text-slate-500">Target scope: step / span / trajectory (MVP)</p>

      <div className="mt-3 space-y-2">
        {annotations.length === 0 ? (
          <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">暂无标注（占位）</p>
        ) : (
          annotations.map((annotation) => (
            <article key={annotation.id} className="rounded border border-slate-100 bg-slate-50 p-2">
              <p className="text-xs font-medium text-slate-800">{annotation.aspect}</p>
              <p className="text-xs text-slate-600">status: {annotation.status}</p>
              <p className="mt-1 text-xs text-slate-700">value: {String(annotation.value)}</p>
            </article>
          ))
        )}
      </div>

      <p className="mt-4 text-[11px] text-slate-500">
        Trajectory {trajectory.id} · UI skeleton only
      </p>
    </aside>
  );
}
