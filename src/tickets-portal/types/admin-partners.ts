export type ApplicationStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export type AdminPartner = {
  _id: string;
  name: string;
  logo: string;
  website: string;
  description?: string;
  category?: string;
  order?: number;
  isActive?: boolean;
  eventId?: string | { _id?: unknown; slug?: string };
  eventSlug?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminPartnerApplication = {
  _id: string;
  companyName: string;
  email: string;
  phone: string;
  telegram?: string;
  website: string;
  country: string;
  linkedin: string;
  partnershipType: string;
  partnerType?: string;
  objectives: string;
  objective?: string;
  whatCanOffer: string;
  benefitsSeek: string;
  communicationMethod: string;
  logoUrl?: string;
  status?: ApplicationStatus | string;
  eventSlug?: string;
  eventId?: string | { _id?: unknown; slug?: string };
  createdAt?: string;
  updatedAt?: string;
};
