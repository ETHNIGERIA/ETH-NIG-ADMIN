export const APPLICATION_STATUSES = ['pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type VolunteerApplication = {
  _id: string;
  name: string;
  email: string;
  whatsapp?: string;
  socialMediaHandles: string[];
  selectedTracks: string[];
  coverLetter: string;
  status: ApplicationStatus;
  createdAt?: string;
};

export type InfluencerApplication = {
  _id: string;
  name: string;
  email: string;
  whatsapp?: string;
  socialMediaHandles: string[];
  message: string;
  influencerId?: string;
  status: ApplicationStatus;
  createdAt?: string;
};

export type ApplicationPage<T> = { items: T[]; total: number; page: number; limit: number };
