export const CONTACT_MESSAGE_STATUSES = [
  'new',
  'read',
  'replied',
  'archived',
] as const;
export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number];

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessagePage {
  items: ContactMessage[];
  total: number;
  page: number;
  limit: number;
}
