import type { FormFieldType } from '@/tickets-portal/types/admin-form-fields';

export type RegistrationFieldPreset = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  /** For `select` only */
  options?: string[];
};

export type PresetCategory = {
  title: string;
  description?: string;
  presets: RegistrationFieldPreset[];
};

export const REGISTRATION_FIELD_PRESET_CATEGORIES: PresetCategory[] = [
  {
    title: 'Contact',
    description: 'Names, email, and phone — the usual checkout basics.',
    presets: [
      { id: 'full_name', label: 'Full name', type: 'text', required: true },
      { id: 'first_name', label: 'First name', type: 'text', required: true },
      { id: 'last_name', label: 'Last name', type: 'text', required: true },
      { id: 'email', label: 'Email address', type: 'text', required: true },
      { id: 'phone', label: 'Phone number', type: 'text', required: false },
      { id: 'whatsapp', label: 'WhatsApp number', type: 'text', required: false },
    ],
  },
  {
    title: 'Professional',
    description: 'Work context for B2B and career events.',
    presets: [
      { id: 'job_title', label: 'Job title', type: 'text', required: false },
      { id: 'company', label: 'Company / organization', type: 'text', required: false },
      {
        id: 'industry',
        label: 'Industry',
        type: 'select',
        required: false,
        options: [
          'Technology',
          'Finance',
          'Healthcare',
          'Education',
          'Government',
          'Non-profit',
          'Retail',
          'Media & creative',
          'Other',
        ],
      },
      { id: 'linkedin', label: 'LinkedIn profile URL', type: 'text', required: false },
    ],
  },
  {
    title: 'Location',
    presets: [
      { id: 'country', label: 'Country', type: 'text', required: false },
      { id: 'city', label: 'City', type: 'text', required: false },
      { id: 'timezone', label: 'Timezone', type: 'text', required: false },
    ],
  },
  {
    title: 'Demographics',
    presets: [
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        required: false,
        options: ['Prefer not to say', 'Woman', 'Man', 'Non-binary', 'Self-describe'],
      },
      {
        id: 'age_range',
        label: 'Age range',
        type: 'select',
        required: false,
        options: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+', 'Prefer not to say'],
      },
    ],
  },
  {
    title: 'Marketing & feedback',
    presets: [
      {
        id: 'how_heard',
        label: 'How did you hear about us?',
        type: 'select',
        required: false,
        options: [
          'Social media',
          'Friend or colleague',
          'Email newsletter',
          'Search engine',
          'Press or podcast',
          'Speaker or sponsor',
          'Other',
        ],
      },
      {
        id: 'what_to_see',
        label: 'What would you like to see at this event?',
        type: 'textarea',
        required: false,
      },
      {
        id: 'topics_interest',
        label: 'Topics you care about',
        type: 'textarea',
        required: false,
      },
      {
        id: 'feedback_expectations',
        label: 'What are you hoping to get out of this event?',
        type: 'textarea',
        required: false,
      },
    ],
  },
  {
    title: 'Logistics & accessibility',
    presets: [
      {
        id: 'dietary',
        label: 'Dietary requirements',
        type: 'select',
        required: false,
        options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Allergies — I’ll share details'],
      },
      {
        id: 'accessibility',
        label: 'Accessibility needs',
        type: 'textarea',
        required: false,
      },
      {
        id: 'tshirt_size',
        label: 'T-shirt size',
        type: 'select',
        required: false,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
      },
      { id: 'emergency_name', label: 'Emergency contact name', type: 'text', required: false },
      { id: 'emergency_phone', label: 'Emergency contact phone', type: 'text', required: false },
    ],
  },
];

const byId = new Map<string, RegistrationFieldPreset>();
for (const cat of REGISTRATION_FIELD_PRESET_CATEGORIES) {
  for (const p of cat.presets) {
    byId.set(p.id, p);
  }
}

export function getRegistrationFieldPreset(id: string): RegistrationFieldPreset | undefined {
  return byId.get(id);
}
