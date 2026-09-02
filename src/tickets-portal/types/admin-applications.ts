export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn';

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
