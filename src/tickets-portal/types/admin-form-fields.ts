export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

export type AdminFormField = {
  _id: string;
  eventId: string;
  fieldKey: string;
  label: string;
  type: FormFieldType;
  options: string[];
  required: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};
