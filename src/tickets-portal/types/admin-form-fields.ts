export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

export type AdminFormField = {
  _id: string;
  eventId: string;
  tierId?: string | null;   // null = global (all tiers), set = tier-specific
  fieldKey: string;
  label: string;
  type: FormFieldType;
  options: string[];
  required: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};
