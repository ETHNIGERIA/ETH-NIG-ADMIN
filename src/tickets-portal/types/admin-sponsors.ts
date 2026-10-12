import type { ApplicationStatus } from '@/tickets-portal/types/admin-partners';

export type AdminSponsor = {
  _id: string;
  name: string;
  logo: string;
  website: string;
  description?: string;
  tier?: string;
  order?: number;
  isActive?: boolean;
  eventId?: string | { _id?: unknown; slug?: string };
  eventSlug?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSponsorApplication = {
  _id: string;
  eventSlug: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  website: string;
  section: string;
  objective: string;
  budget: string;
  sponsorType: string;
  interest: string;
  notes?: string;
  status?: ApplicationStatus | string;
  eventId?: string | { _id?: unknown; slug?: string };
  createdAt?: string;
  updatedAt?: string;
};
