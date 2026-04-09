import { useState, type ReactNode } from 'react';
import { aspectRegistry, aspectRegistryMap } from '@/lib/aspect-registry';
import type { Annotation, AnnotationStatus, TargetRef, Trajectory } from '@/types';

type AnnotationPanelProps = {
  trajectory: Trajectory;
  selectedStepId: string;
  annotations: Annotation[];
  editingAnnotationId: string | null;
  onCreate: (input: AnnotationFormInput) => void;
  onStartEdit: (annotationId: string) => void;
  onSaveEdit: (annotationId: string, input: AnnotationFormInput) => void;
  onDelete: (annotationId: string) => void;
  onCancelEdit: () => void;
  onJumpToStep: (stepId: string) => void;
};

export type AnnotationFormInput = {
  targetType: 'step' | 'span' | 'trajectory';
  stepId: string;
  spanStartStepId: string;
  spanEndStepId: string;
  aspect: string;
  value: string;
  confidence: string;
  evidenceMode: 'none' | 'step' | 'span';
  evidenceStepId: string;
  evidenceSpanStartStepId: string;
  evidenceSpanEndStepId: string;
  provenanceSource: 'human' | 'llm_judge' | 'heuristic' | 'imported';
  status: AnnotationStatus;
};

export function AnnotationPanel({
  trajectory,
  selectedStepId,
  annotations,
  editingAnnotationId,
  onCreate,
  onStartEdit,
  onSaveEdit,
  onDelete,
  onCancelEdit,
  onJumpToStep,
}: AnnotationPanelProps) {
  return (
    <aside className="h-full rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">Annotation Panel</h3>
      <p className="mt-1 text-xs text-slate-500">Target scope: step / span / trajectory</p>

      <div className="mt-3 space-y-2">
        {annotations.length === 0 ? (
          <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">暂无标注</p>
        ) : (
          annotations.map((annotation) => {
            const isEditing = editingAnnotationId === annotation.id;
            return (
              <article key={annotation.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                <p className="text-xs font-medium text-slate-800">{annotation.aspect}</p>
                <p className="text-xs text-slate-600">target: {formatTarget(annotation.target)}</p>
                <p className="text-xs text-slate-600">status: {annotation.status}</p>
                <p className="mt-1 text-xs text-slate-700">value: {String(annotation.value)}</p>

                {annotation.evidence?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {annotation.evidence.map((ev) => {
                      const stepId = ev.stepId ?? ev.startStepId;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => stepId && onJumpToStep(stepId)}
                          className="rounded bg-white px-2 py-0.5 text-[10px] text-blue-700 hover:underline"
                        >
                          evidence:{' '}
                          {ev.stepId
                            ? `step:${ev.stepId}`
                            : ev.startStepId && ev.endStepId
                              ? `span:${ev.startStepId}-${ev.endStepId}`
                              : 'n/a'}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div className="mt-2 flex gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onStartEdit(annotation.id)}
                    className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                  >
                    {isEditing ? 'Editing' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(annotation.id)}
                    className="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                {isEditing ? (
                  <div className="mt-2 rounded border border-blue-200 bg-white p-2">
                    <AnnotationForm
                      trajectory={trajectory}
                      selectedStepId={selectedStepId}
                      mode="edit"
                      initialValue={toFormInput(annotation)}
                      onSubmit={(input) => onSaveEdit(annotation.id, input)}
                      onCancel={onCancelEdit}
                    />
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      {editingAnnotationId === null ? (
        <div className="mt-4 rounded border border-slate-200 p-2">
          <p className="mb-2 text-xs font-medium text-slate-700">Create Annotation</p>
          <AnnotationForm
            trajectory={trajectory}
            selectedStepId={selectedStepId}
            mode="create"
            onSubmit={onCreate}
          />
        </div>
      ) : null}
    </aside>
  );
}

type AnnotationFormProps = {
  trajectory: Trajectory;
  selectedStepId: string;
  mode: 'create' | 'edit';
  initialValue?: AnnotationFormInput;
  onSubmit: (input: AnnotationFormInput) => void;
  onCancel?: () => void;
};

function AnnotationForm({ trajectory, selectedStepId, mode, initialValue, onSubmit, onCancel }: AnnotationFormProps) {
  const defaultValue: AnnotationFormInput =
    initialValue ?? {
      targetType: 'step',
      stepId: selectedStepId,
      spanStartStepId: trajectory.steps[0]?.id ?? '',
      spanEndStepId: trajectory.steps[0]?.id ?? '',
      aspect: aspectRegistry[0]?.key ?? 'tool_call_validity',
      value: '',
      confidence: '0.8',
      evidenceMode: 'step',
      evidenceStepId: selectedStepId,
      evidenceSpanStartStepId: trajectory.steps[0]?.id ?? '',
      evidenceSpanEndStepId: trajectory.steps[0]?.id ?? '',
      provenanceSource: 'human',
      status: 'draft',
    };

  const [aspectKey, setAspectKey] = useState(defaultValue.aspect);
  const aspect = aspectRegistryMap[aspectKey] ?? aspectRegistry[0];

  return (
    <form
      className="space-y-2 text-xs"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);

        const input: AnnotationFormInput = {
          targetType: data.get('targetType') as AnnotationFormInput['targetType'],
          stepId: String(data.get('stepId') ?? ''),
          spanStartStepId: String(data.get('spanStartStepId') ?? ''),
          spanEndStepId: String(data.get('spanEndStepId') ?? ''),
          aspect: String(data.get('aspect') ?? 'tool_call_validity'),
          value: String(data.get('value') ?? ''),
          confidence: String(data.get('confidence') ?? ''),
          evidenceMode: data.get('evidenceMode') as AnnotationFormInput['evidenceMode'],
          evidenceStepId: String(data.get('evidenceStepId') ?? ''),
          evidenceSpanStartStepId: String(data.get('evidenceSpanStartStepId') ?? ''),
          evidenceSpanEndStepId: String(data.get('evidenceSpanEndStepId') ?? ''),
          provenanceSource: data.get('provenanceSource') as AnnotationFormInput['provenanceSource'],
          status: data.get('status') as AnnotationFormInput['status'],
        };

        onSubmit(input);
      }}
    >
      <Field label="Target">
        <select name="targetType" defaultValue={defaultValue.targetType} className={inputCls}>
          <option value="step">step</option>
          <option value="span">span</option>
          <option value="trajectory">trajectory</option>
        </select>
      </Field>

      <Field label="Step Target">
        <select name="stepId" defaultValue={defaultValue.stepId} className={inputCls}>
          {trajectory.steps.map((step) => (
            <option key={step.id} value={step.id}>{`${step.index} · ${step.id}`}</option>
          ))}
        </select>
      </Field>

      <Field label="Span Target">
        <div className="grid grid-cols-2 gap-1">
          <select name="spanStartStepId" defaultValue={defaultValue.spanStartStepId} className={inputCls}>
            {trajectory.steps.map((step) => (
              <option key={`start-${step.id}`} value={step.id}>{`start:${step.id}`}</option>
            ))}
          </select>
          <select name="spanEndStepId" defaultValue={defaultValue.spanEndStepId} className={inputCls}>
            {trajectory.steps.map((step) => (
              <option key={`end-${step.id}`} value={step.id}>{`end:${step.id}`}</option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="Aspect">
        <select
          name="aspect"
          defaultValue={defaultValue.aspect}
          className={inputCls}
          onChange={(event) => setAspectKey(event.target.value)}
        >
          {aspectRegistry.map((item) => (
            <option key={item.key} value={item.key}>
              {item.key}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`Value (${aspect.valueType})`}>
        {aspect.valueType === 'categorical' ? (
          <select name="value" defaultValue={defaultValue.value} className={inputCls}>
            <option value="">select...</option>
            {(aspect.valueConstraints?.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : aspect.valueType === 'ordinal' ? (
          <select name="value" defaultValue={defaultValue.value} className={inputCls}>
            <option value="">select...</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <input name="value" defaultValue={defaultValue.value} className={inputCls} placeholder="text value" />
        )}
      </Field>

      <Field label="Confidence (0-1)">
        <input name="confidence" defaultValue={defaultValue.confidence} className={inputCls} />
      </Field>

      <Field label="Evidence Mode">
        <select name="evidenceMode" defaultValue={defaultValue.evidenceMode} className={inputCls}>
          <option value="none">none</option>
          <option value="step">step</option>
          <option value="span">span</option>
        </select>
      </Field>

      <Field label="Evidence Step">
        <select name="evidenceStepId" defaultValue={defaultValue.evidenceStepId} className={inputCls}>
          {trajectory.steps.map((step) => (
            <option key={`ev-${step.id}`} value={step.id}>{`step:${step.id}`}</option>
          ))}
        </select>
      </Field>

      <Field label="Evidence Span">
        <div className="grid grid-cols-2 gap-1">
          <select
            name="evidenceSpanStartStepId"
            defaultValue={defaultValue.evidenceSpanStartStepId}
            className={inputCls}
          >
            {trajectory.steps.map((step) => (
              <option key={`evs-${step.id}`} value={step.id}>{`start:${step.id}`}</option>
            ))}
          </select>
          <select name="evidenceSpanEndStepId" defaultValue={defaultValue.evidenceSpanEndStepId} className={inputCls}>
            {trajectory.steps.map((step) => (
              <option key={`eve-${step.id}`} value={step.id}>{`end:${step.id}`}</option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="Provenance Source">
        <select name="provenanceSource" defaultValue={defaultValue.provenanceSource} className={inputCls}>
          <option value="human">human</option>
          <option value="llm_judge">llm_judge</option>
          <option value="heuristic">heuristic</option>
          <option value="imported">imported</option>
        </select>
      </Field>

      <Field label="Status">
        <select name="status" defaultValue={defaultValue.status} className={inputCls}>
          <option value="draft">draft</option>
          <option value="confirmed">confirmed</option>
          <option value="disputed">disputed</option>
          <option value="deprecated">deprecated</option>
        </select>
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-white hover:bg-slate-700">
          {mode === 'create' ? 'Create' : 'Save'}
        </button>
        {mode === 'edit' && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded border border-slate-300 px-2 py-1 text-xs';

function formatTarget(target: TargetRef): string {
  if (target.type === 'step') return `step:${target.stepId}`;
  if (target.type === 'span') return `span:${target.startStepId}-${target.endStepId}`;
  if (target.type === 'trajectory') return 'trajectory';
  return target.type;
}

function toFormInput(annotation: Annotation): AnnotationFormInput {
  const targetType =
    annotation.target.type === 'step' || annotation.target.type === 'span' || annotation.target.type === 'trajectory'
      ? annotation.target.type
      : 'step';

  const evidence = annotation.evidence?.[0];

  return {
    targetType,
    stepId: annotation.target.type === 'step' ? annotation.target.stepId : '',
    spanStartStepId: annotation.target.type === 'span' ? annotation.target.startStepId : '',
    spanEndStepId: annotation.target.type === 'span' ? annotation.target.endStepId : '',
    aspect: annotation.aspect,
    value: String(annotation.value ?? ''),
    confidence: String(annotation.confidence ?? ''),
    evidenceMode: evidence?.stepId ? 'step' : evidence?.startStepId && evidence?.endStepId ? 'span' : 'none',
    evidenceStepId: evidence?.stepId ?? '',
    evidenceSpanStartStepId: evidence?.startStepId ?? '',
    evidenceSpanEndStepId: evidence?.endStepId ?? '',
    provenanceSource: annotation.provenance.source,
    status: annotation.status,
  };
}
