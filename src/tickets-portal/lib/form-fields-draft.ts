import { fieldKeyFromLabel } from '@/tickets-portal/lib/field-key';
import { getRegistrationFieldPreset } from '@/tickets-portal/lib/registration-field-presets';
import type { FormFieldType } from '@/tickets-portal/types/admin-form-fields';
import type { RegistrationDraftRowPayload } from '@/tickets-portal/types/registration-draft';

export type ClientDraftRow =
  | {
      id: string;
      kind: 'preset';
      presetId: string;
      /** When set, replaces catalog options for select-type presets (editable in draft). */
      optionsOverride?: string[];
    }
  | {
      id: string;
      kind: 'custom';
      label: string;
      type: FormFieldType;
      required: boolean;
      options: string[];
    };

function uniqueAgainst(keys: Set<string>, baseKey: string): string {
  let k = baseKey;
  let n = 2;
  while (keys.has(k)) {
    k = `${baseKey}_${n}`;
    n++;
  }
  return k;
}

/** Effective select options for a preset row (editable override ?? catalog). */
export function effectivePresetSelectOptions(row: Extract<ClientDraftRow, { kind: 'preset' }>): string[] {
  const p = getRegistrationFieldPreset(row.presetId);
  if (p?.type !== 'select') return [];
  if (row.optionsOverride !== undefined) {
    return row.optionsOverride;
  }
  return p.options ?? [];
}

/** Estimated storage keys for preview (matches server uniquify order). */
export function previewKeysForDraft(
  existingKeys: readonly string[],
  draft: ClientDraftRow[],
): Map<string, string> {
  const keys = new Set(existingKeys);
  const map = new Map<string, string>();
  for (const row of draft) {
    let label: string;
    if (row.kind === 'preset') {
      const p = getRegistrationFieldPreset(row.presetId);
      label = p?.label ?? row.presetId;
    } else {
      label = row.label;
    }
    const base = fieldKeyFromLabel(label);
    const k = uniqueAgainst(keys, base);
    keys.add(k);
    map.set(row.id, k);
  }
  return map;
}

export function draftRowsToPayload(rows: ClientDraftRow[]): RegistrationDraftRowPayload[] {
  return rows.map((r) => {
    if (r.kind === 'preset') {
      const p = getRegistrationFieldPreset(r.presetId);
      const opts = effectivePresetSelectOptions(r);
      const payload: RegistrationDraftRowPayload = { kind: 'preset', presetId: r.presetId };
      if (p?.type === 'select' && opts.length > 0) {
        payload.options = opts;
      }
      return payload;
    }
    const payload: RegistrationDraftRowPayload = {
      kind: 'custom',
      label: r.label,
      type: r.type,
      required: r.required,
    };
    if (r.type === 'select' && r.options.length > 0) {
      payload.options = r.options;
    }
    return payload;
  });
}

export function resolveDraftRowLabel(row: ClientDraftRow): string {
  if (row.kind === 'preset') {
    return getRegistrationFieldPreset(row.presetId)?.label ?? row.presetId;
  }
  return row.label;
}

export function resolveDraftRowMeta(row: ClientDraftRow): {
  type: FormFieldType;
  required: boolean;
  optionsCount: number;
} {
  if (row.kind === 'preset') {
    const p = getRegistrationFieldPreset(row.presetId);
    const n = p?.type === 'select' ? effectivePresetSelectOptions(row).length : 0;
    return {
      type: p?.type ?? 'text',
      required: p?.required ?? false,
      optionsCount: n,
    };
  }
  return {
    type: row.type,
    required: row.required,
    optionsCount: row.options.length,
  };
}
