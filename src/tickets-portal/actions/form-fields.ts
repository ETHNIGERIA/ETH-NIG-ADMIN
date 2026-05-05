'use server';

import { redirect } from 'next/navigation';
import { ticketsApiDelete, ticketsApiPatch, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import { fieldKeyFromLabel } from '@/tickets-portal/lib/field-key';
import { getRegistrationFieldPreset } from '@/tickets-portal/lib/registration-field-presets';
import { loadExistingKeysAndNextSort } from '@/tickets-portal/data/event-form-fields-read';
import type { AdminFormField, FormFieldType } from '@/tickets-portal/types/admin-form-fields';
import type { RegistrationDraftRowPayload } from '@/tickets-portal/types/registration-draft';
import type { ActionState } from '@/tickets-portal/actions/events';

const TYPES: FormFieldType[] = ['text', 'textarea', 'select', 'checkbox', 'number', 'date'];

function parseType(raw: string): FormFieldType {
  return TYPES.includes(raw as FormFieldType) ? (raw as FormFieldType) : 'text';
}

function uniqueFieldKey(existing: Set<string>, baseKey: string): string {
  let k = baseKey;
  let n = 2;
  while (existing.has(k)) {
    k = `${baseKey}_${n}`;
    n++;
  }
  return k;
}

function validateDraftPayload(raw: unknown): RegistrationDraftRowPayload[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: RegistrationDraftRowPayload[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null;
    const kind = (row as { kind?: string }).kind;
    if (kind === 'preset') {
      const presetId = String((row as { presetId?: unknown }).presetId ?? '').trim();
      if (!presetId) return null;
      const optRaw = (row as { options?: unknown }).options;
      let options: string[] | undefined;
      if (Array.isArray(optRaw)) {
        options = optRaw.map((s) => String(s).trim()).filter(Boolean);
      }
      if (options?.length) {
        out.push({ kind: 'preset', presetId, options });
      } else {
        out.push({ kind: 'preset', presetId });
      }
      continue;
    }
    if (kind === 'custom') {
      const label = String((row as { label?: unknown }).label ?? '').trim();
      const type = parseType(String((row as { type?: unknown }).type ?? 'text'));
      const required = Boolean((row as { required?: unknown }).required);
      const optRaw = (row as { options?: unknown }).options;
      let options: string[] | undefined;
      if (Array.isArray(optRaw)) {
        options = optRaw.map((s) => String(s).trim()).filter(Boolean);
      }
      if (!label) return null;
      out.push({ kind: 'custom', label, type, required, options });
      continue;
    }
    return null;
  }
  return out;
}

/**
 * Creates every row from the admin’s draft in order (single confirmation).
 */
export async function commitRegistrationDraftAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const draftRaw = String(formData.get('draft') ?? '').trim();

  if (!eventId) {
    return { error: 'Missing event.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(draftRaw);
  } catch {
    return { error: 'Invalid draft.' };
  }

  const draft = validateDraftPayload(parsed);
  if (!draft) {
    return { error: 'Add at least one field to your draft, then save.' };
  }

  let keys: Set<string>;
  let sortCursor: number;
  try {
    const loaded = await loadExistingKeysAndNextSort(eventId);
    keys = loaded.keys;
    sortCursor = loaded.nextSort;
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : 'Could not load existing fields (check session or API). Try refreshing.',
    };
  }

  try {
    for (const row of draft) {
      if (row.kind === 'preset') {
        const preset = getRegistrationFieldPreset(row.presetId);
        if (!preset) {
          return { error: `Unknown preset: ${row.presetId}` };
        }
        const baseKey = fieldKeyFromLabel(preset.label);
        const fieldKey = uniqueFieldKey(keys, baseKey);
        keys.add(fieldKey);

        const body: Record<string, unknown> = {
          fieldKey,
          label: preset.label,
          type: preset.type,
          required: preset.required,
          sortOrder: sortCursor++,
        };

        if (preset.type === 'select') {
          const opts = row.options?.length ? row.options : preset.options;
          if (opts?.length) {
            body.options = opts;
          }
        }

        await ticketsApiPost<AdminFormField, Record<string, unknown>>(
          `/admin/events/${eventId}/form-fields`,
          body,
        );
      } else {
        const baseKey = fieldKeyFromLabel(row.label);
        const fieldKey = uniqueFieldKey(keys, baseKey);
        keys.add(fieldKey);

        const body: Record<string, unknown> = {
          fieldKey,
          label: row.label,
          type: row.type,
          required: row.required,
          sortOrder: sortCursor++,
        };
        if (row.type === 'select' && row.options?.length) {
          body.options = row.options;
        }

        await ticketsApiPost<AdminFormField, Record<string, unknown>>(
          `/admin/events/${eventId}/form-fields`,
          body,
        );
      }
    }
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : 'Could not save draft. Some fields may have been created — refresh and review.',
    };
  }

  redirect(`/tickets-command/events/${eventId}/fields`);
}

export async function updateFormFieldAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const fieldId = String(formData.get('fieldId') ?? '').trim();
  const label = String(formData.get('label') ?? '').trim();
  const type = parseType(String(formData.get('type') ?? 'text'));
  const optionsText = String(formData.get('options') ?? '');
  const options = optionsText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const required = formData.get('required') === 'on' || formData.get('required') === 'true';
  const sortRaw = String(formData.get('sortOrder') ?? '').trim();

  if (!eventId || !fieldId || !label) {
    return { error: 'Missing field or label.' };
  }

  const patch: Record<string, unknown> = {
    label,
    type,
    required,
  };
  if (type === 'select') {
    patch.options = options;
  }

  if (sortRaw !== '') {
    const n = parseInt(sortRaw, 10);
    if (!Number.isNaN(n) && n >= 0) patch.sortOrder = n;
  }

  try {
    await ticketsApiPatch<AdminFormField, Record<string, unknown>>(
      `/admin/events/${eventId}/form-fields/${fieldId}`,
      patch,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update field.' };
  }

  redirect(`/tickets-command/events/${eventId}/fields`);
}

export async function deleteFormFieldAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const fieldId = String(formData.get('fieldId') ?? '').trim();
  if (!eventId || !fieldId) {
    return { error: 'Missing field.' };
  }

  try {
    await ticketsApiDelete(`/admin/events/${eventId}/form-fields/${fieldId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete field.' };
  }

  redirect(`/tickets-command/events/${eventId}/fields`);
}
