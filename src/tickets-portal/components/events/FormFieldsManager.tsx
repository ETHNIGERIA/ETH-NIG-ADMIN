'use client';

import { useActionState, useCallback, useMemo, useState } from 'react';
import {
  commitRegistrationDraftAction,
  deleteFormFieldAction,
  updateFormFieldAction,
} from '@/tickets-portal/actions/form-fields';
import type { ActionState } from '@/tickets-portal/actions/events';
import type { AdminFormField, FormFieldType } from '@/tickets-portal/types/admin-form-fields';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import {
  getRegistrationFieldPreset,
  REGISTRATION_FIELD_PRESET_CATEGORIES,
  type RegistrationFieldPreset,
} from '@/tickets-portal/lib/registration-field-presets';
import {
  type ClientDraftRow,
  draftRowsToPayload,
  effectivePresetSelectOptions,
  previewKeysForDraft,
  resolveDraftRowLabel,
  resolveDraftRowMeta,
} from '@/tickets-portal/lib/form-fields-draft';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

const TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

function newRowId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fieldId(f: AdminFormField) {
  return normalizeDocumentId(f._id);
}

function parseOptionsText(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Same label as an already-saved field — avoid duplicate questions. */
function savedMatchesPresetLabel(savedFields: AdminFormField[], presetLabel: string): boolean {
  const t = presetLabel.trim().toLowerCase();
  return savedFields.some((f) => f.label.trim().toLowerCase() === t);
}

function PresetPicker({
  onPick,
  savedFields,
  draftPresetIds,
}: {
  onPick: (preset: RegistrationFieldPreset) => void;
  savedFields: AdminFormField[];
  draftPresetIds: Set<string>;
}) {
  return (
    <div className="border-b border-stone-200 pb-8">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Suggested fields</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-stone-600">
        Tap to add to your draft (nothing is saved until you confirm below). Fields already on this event or already in
        your draft are disabled.
      </p>

      <div className="mt-6 space-y-8">
        {REGISTRATION_FIELD_PRESET_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h3 className="text-[14px] font-semibold text-stone-900">{cat.title}</h3>
            {cat.description ? (
              <p className="mt-1 text-[13px] text-stone-500">{cat.description}</p>
            ) : null}
            <ul className="mt-3 flex flex-wrap gap-2">
              {cat.presets.map((preset) => {
                const inDraft = draftPresetIds.has(preset.id);
                const onEvent = savedMatchesPresetLabel(savedFields, preset.label);
                const disabled = inDraft || onEvent;
                let reason = '';
                if (inDraft) reason = 'Already in your draft — remove it there if you want to re-add.';
                else if (onEvent) reason = 'Already saved on this event — delete or edit it under “Saved” below.';

                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onPick(preset)}
                      title={
                        disabled
                          ? reason
                          : `Add “${preset.label}” to draft (${preset.type}${preset.required ? ', required' : ''})`
                      }
                      className={`max-w-[220px] rounded-lg border px-3 py-2 text-left text-[13px] leading-snug transition-colors ${
                        disabled
                          ? 'cursor-not-allowed border-stone-100 bg-stone-50 text-stone-400'
                          : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <span className="block font-medium">{preset.label}</span>
                      <span className="mt-0.5 block text-[11px] font-normal text-stone-500">
                        {inDraft ? 'In draft' : onEvent ? 'On event' : '+ Add to draft'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

type CustomDraftInput = Omit<Extract<ClientDraftRow, { kind: 'custom' }>, 'id'>;

function AddToDraftForm({ onAdd }: { onAdd: (row: CustomDraftInput) => void }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FormFieldType>('text');
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState('');

  const submit = useCallback(() => {
    const t = label.trim();
    if (!t) return;
    const options = type === 'select' ? parseOptionsText(optionsText) : [];
    onAdd({
      kind: 'custom',
      label: t,
      type,
      required,
      options,
    });
    setLabel('');
    setType('text');
    setRequired(false);
    setOptionsText('');
  }, [label, type, required, optionsText, onAdd]);

  return (
    <div className="border-b border-stone-200 pb-6">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Custom question</h2>
      <p className="mt-2 max-w-xl text-[14px] text-stone-600">
        Build a one-off field, then add it to the draft. Storage keys are generated from the label when you save.
      </p>
      <div className="mt-4 max-w-2xl space-y-4">
        <div>
          <label className={labelClass} htmlFor="draft-custom-label">
            Label
          </label>
          <input
            id="draft-custom-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={fieldClass}
            placeholder="e.g. Bring a guest?"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="draft-custom-type">
              Type
            </label>
            <select
              id="draft-custom-type"
              value={type}
              onChange={(e) => setType(e.target.value as FormFieldType)}
              className={fieldClass}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2 sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-stone-700">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="rounded border-stone-300"
              />
              Required
            </label>
          </div>
        </div>
        {type === 'select' ? (
          <div>
            <label className={labelClass} htmlFor="draft-custom-opt">
              Options (one per line)
            </label>
            <textarea
              id="draft-custom-opt"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={3}
              className={`${fieldClass} resize-y`}
              placeholder="Option A&#10;Option B"
            />
          </div>
        ) : null}
        <button
          type="button"
          onClick={submit}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-[14px] font-medium text-stone-800 hover:bg-stone-50"
        >
          Add to draft
        </button>
      </div>
    </div>
  );
}

function DraftPreview({
  eventId,
  draft,
  onRemove,
  onClear,
  keyByRowId,
  onUpdatePresetOptions,
  onUpdateCustomOptions,
}: {
  eventId: string;
  draft: ClientDraftRow[];
  onRemove: (id: string) => void;
  onClear: () => void;
  keyByRowId: Map<string, string>;
  onUpdatePresetOptions: (rowId: string, options: string[]) => void;
  onUpdateCustomOptions: (rowId: string, options: string[]) => void;
}) {
  const [state, action, pending] = useActionState(commitRegistrationDraftAction, undefined as ActionState);

  const payloadJson = useMemo(() => JSON.stringify(draftRowsToPayload(draft)), [draft]);

  if (draft.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-4 py-6 text-center">
        <p className="text-[14px] text-stone-600">Your draft is empty — pick suggested fields or add a custom question.</p>
        {state?.error ? (
          <p className="mt-3 text-[13px] text-red-700">{state.error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-4 py-3">
        <h2 className="text-[14px] font-semibold text-stone-900">Draft preview</h2>
        <p className="mt-1 text-[13px] text-stone-500">
          Order matches checkout. Expand <strong className="font-medium text-stone-700">Choices</strong> on selects to
          edit dropdown values.
        </p>
      </div>
      {state?.error ? (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-800">{state.error}</div>
      ) : null}
      <ul className="divide-y divide-stone-100">
        {draft.map((row, index) => {
          const meta = resolveDraftRowMeta(row);
          const estKey = keyByRowId.get(row.id) ?? '…';
          const displayLabel = resolveDraftRowLabel(row);
          const preset = row.kind === 'preset' ? getRegistrationFieldPreset(row.presetId) : null;

          return (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start gap-3">
                <span className="mt-0.5 w-6 shrink-0 text-[13px] tabular-nums text-stone-400">{index + 1}.</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-stone-900">{displayLabel}</p>
                    <p className="mt-0.5 text-[12px] text-stone-500">
                      {meta.type}
                      {meta.required ? ' · required' : ' · optional'}
                      {row.kind === 'preset' ? ' · preset' : ' · custom'}
                      {meta.type === 'select' && meta.optionsCount > 0
                        ? ` · ${meta.optionsCount} choices`
                        : null}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-stone-400">→ {estKey}</p>
                  </div>

                  {row.kind === 'preset' && preset?.type === 'select' ? (
                    <details className="rounded-md border border-stone-100 bg-stone-50/90 px-3 py-2">
                      <summary className="cursor-pointer text-[12px] font-medium text-stone-700">
                        Choices (one per line)
                      </summary>
                      <textarea
                        className={`${fieldClass} mt-2 resize-y font-mono text-[13px]`}
                        rows={Math.min(12, Math.max(4, effectivePresetSelectOptions(row).length + 2))}
                        value={effectivePresetSelectOptions(row).join('\n')}
                        onChange={(e) =>
                          onUpdatePresetOptions(
                            row.id,
                            parseOptionsText(e.target.value),
                          )
                        }
                      />
                    </details>
                  ) : null}

                  {row.kind === 'custom' && row.type === 'select' ? (
                    <details className="rounded-md border border-stone-100 bg-stone-50/90 px-3 py-2">
                      <summary className="cursor-pointer text-[12px] font-medium text-stone-700">
                        Choices (one per line)
                      </summary>
                      <textarea
                        className={`${fieldClass} mt-2 resize-y font-mono text-[13px]`}
                        rows={Math.min(12, Math.max(4, row.options.length + 2))}
                        value={row.options.join('\n')}
                        onChange={(e) => onUpdateCustomOptions(row.id, parseOptionsText(e.target.value))}
                      />
                    </details>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  className="shrink-0 rounded-md px-2 py-1 text-[13px] text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 px-4 py-4">
        <form action={action}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="draft" value={payloadJson} />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {pending ? 'Saving…' : `Save ${draft.length} field${draft.length === 1 ? '' : 's'} to event`}
          </button>
        </form>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-stone-200 px-4 py-2.5 text-[14px] text-stone-600 hover:bg-stone-50"
        >
          Clear draft
        </button>
      </div>
    </div>
  );
}

function FieldRow({ f, eventId }: { f: AdminFormField; eventId: string }) {
  const id = fieldId(f);
  const [upState, upAction, upPending] = useActionState(updateFormFieldAction, undefined as ActionState);
  const [delState, delAction, delPending] = useActionState(deleteFormFieldAction, undefined as ActionState);

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-900">{f.label}</p>
          <p className="mt-0.5 font-mono text-[12px] text-stone-500">{f.fieldKey}</p>
          <p className="mt-1 text-[12px] text-stone-500">
            {f.type}
            {f.required ? ' · required' : ' · optional'}
            {f.type === 'select' && f.options?.length ? ` · ${f.options.length} choices` : null}
          </p>
          {f.type === 'select' && (f.options?.length ?? 0) > 0 ? (
            <ul className="mt-2 list-inside list-disc text-[12px] text-stone-600">
              {(f.options ?? []).slice(0, 12).map((o) => (
                <li key={o}>{o}</li>
              ))}
              {(f.options ?? []).length > 12 ? (
                <li className="list-none text-stone-400">+ {(f.options ?? []).length - 12} more…</li>
              ) : null}
            </ul>
          ) : null}
        </div>
        <form action={delAction} className="shrink-0">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="fieldId" value={id} />
          <button
            type="submit"
            disabled={delPending}
            className="rounded-md px-2.5 py-1 text-[13px] text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
          >
            {delPending ? '…' : 'Delete'}
          </button>
        </form>
        {delState?.error ? <p className="w-full text-[12px] text-red-700">{delState.error}</p> : null}
      </div>
      <details className="mt-3 border-t border-stone-100 pt-3">
        <summary className="cursor-pointer text-[13px] font-medium text-stone-700 hover:text-stone-900 [&::-webkit-details-marker]:hidden">
          Edit
        </summary>
        <div className="mt-3 max-w-2xl space-y-3">
          {upState?.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {upState.error}
            </div>
          ) : null}
          <form action={upAction} className="space-y-3">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="fieldId" value={id} />
            <div>
              <label className={labelClass} htmlFor={`e-l-${id}`}>
                Label
              </label>
              <input id={`e-l-${id}`} name="label" required defaultValue={f.label} className={fieldClass} />
              <p className="mt-1 text-[12px] text-stone-500">
                Storage key stays <span className="font-mono">{f.fieldKey}</span> for existing registrations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`e-t-${id}`}>
                  Type
                </label>
                <select id={`e-t-${id}`} name="type" defaultValue={f.type} className={fieldClass}>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor={`e-s-${id}`}>
                  Sort order
                </label>
                <input
                  id={`e-s-${id}`}
                  name="sortOrder"
                  type="number"
                  min={0}
                  defaultValue={f.sortOrder}
                  className={fieldClass}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-stone-700">
              <input
                type="checkbox"
                name="required"
                value="on"
                defaultChecked={f.required}
                className="rounded border-stone-300"
              />
              Required
            </label>
            <div>
              <label className={labelClass} htmlFor={`e-o-${id}`}>
                Options <span className="font-normal text-stone-400">(select, one per line)</span>
              </label>
              <textarea
                id={`e-o-${id}`}
                name="options"
                rows={3}
                defaultValue={(f.options ?? []).join('\n')}
                className={`${fieldClass} resize-y`}
              />
            </div>
            <button
              type="submit"
              disabled={upPending}
              className="rounded-md bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {upPending ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      </details>
    </li>
  );
}

export function FormFieldsManager({
  eventId,
  fields,
  fieldsLoadError,
}: {
  eventId: string;
  fields: AdminFormField[];
  /** When set, the form-fields list failed to load (never silently assume empty). */
  fieldsLoadError?: string | null;
}) {
  const [draft, setDraft] = useState<ClientDraftRow[]>([]);

  const existingKeys = useMemo(() => fields.map((f) => f.fieldKey), [fields]);

  const draftPresetIds = useMemo(
    () => new Set(draft.filter((r): r is Extract<ClientDraftRow, { kind: 'preset' }> => r.kind === 'preset').map((r) => r.presetId)),
    [draft],
  );

  const keyByRowId = useMemo(
    () => previewKeysForDraft(existingKeys, draft),
    [existingKeys, draft],
  );

  const addPreset = useCallback((preset: RegistrationFieldPreset) => {
    setDraft((d) => [
      ...d,
      {
        id: newRowId(),
        kind: 'preset',
        presetId: preset.id,
        ...(preset.type === 'select' && preset.options?.length ? { optionsOverride: [...preset.options] } : {}),
      },
    ]);
  }, []);

  const addCustom = useCallback((row: CustomDraftInput) => {
    const next: ClientDraftRow = { ...row, id: newRowId() };
    setDraft((d) => [...d, next]);
  }, []);

  const updatePresetOptions = useCallback((rowId: string, options: string[]) => {
    setDraft((d) =>
      d.map((r) => (r.id === rowId && r.kind === 'preset' ? { ...r, optionsOverride: options } : r)),
    );
  }, []);

  const updateCustomOptions = useCallback((rowId: string, options: string[]) => {
    setDraft((d) =>
      d.map((r) =>
        r.id === rowId && r.kind === 'custom' && r.type === 'select' ? { ...r, options } : r,
      ),
    );
  }, []);

  const removeRow = useCallback((id: string) => {
    setDraft((d) => d.filter((r) => r.id !== id));
  }, []);

  const clearDraft = useCallback(() => setDraft([]), []);

  return (
    <div className="space-y-8">
      {fieldsLoadError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-950">
          <p className="font-medium">Could not load saved fields</p>
          <p className="mt-1 text-[13px] text-amber-900/90">{fieldsLoadError}</p>
          <p className="mt-2 text-[13px] text-amber-900/80">
            Refresh the page. Saving a draft without a successful load can duplicate keys — fix the error first.
          </p>
        </div>
      ) : null}

      <div>
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Saved on this event</h2>
        <p className="mt-2 max-w-2xl text-[14px] text-stone-600">
          These are live in the API. Delete or edit here; suggested presets that match the same label are disabled
          above.
        </p>
        {fields.length === 0 && !fieldsLoadError ? (
          <p className="mt-3 text-[14px] text-stone-500">
            No fields yet — build a draft below and save, or fix the error banner if loading failed.
          </p>
        ) : null}
        {fields.length > 0 ? (
          <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white px-4">
            {fields.map((f) => (
              <FieldRow key={fieldId(f)} f={f} eventId={eventId} />
            ))}
          </ul>
        ) : null}
      </div>
      <br/>
<hr />
<br/>


      <PresetPicker onPick={addPreset} savedFields={fields} draftPresetIds={draftPresetIds} />
      <AddToDraftForm onAdd={addCustom} />

      <br/>
<hr />
<br/>


      <div className="space-y-3">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Draft</h2>
        <DraftPreview
          eventId={eventId}
          draft={draft}
          onRemove={removeRow}
          onClear={clearDraft}
          keyByRowId={keyByRowId}
          onUpdatePresetOptions={updatePresetOptions}
          onUpdateCustomOptions={updateCustomOptions}
        />
      </div>
    </div>
  );
}
