import type { FormFieldType } from '@/tickets-portal/types/admin-form-fields';

/** Rows posted from the draft preview as JSON (server validates again). */
export type RegistrationDraftRowPayload =
  | {
      kind: 'preset';
      presetId: string;
      /** Overrides catalog options for `select` presets */
      options?: string[];
    }
  | {
      kind: 'custom';
      label: string;
      type: FormFieldType;
      required: boolean;
      options?: string[];
    };
