export const COLLAB_APPLICATION_STATUSES = ['pending', 'contacted', 'approved', 'rejected'] as const;
export type CollabApplicationStatus = (typeof COLLAB_APPLICATION_STATUSES)[number];

export type CollabApplicationKind = 'sponsor' | 'speaker';

type BaseCollabApplication = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  eventSlug?: string;
  status: CollabApplicationStatus;
  createdAt?: string;
};

export type SponsorApplication = BaseCollabApplication & {
  companyName: string;
  website?: string;
  section?: string;
  objective?: string;
  budget?: string;
  sponsorType?: string;
  interest?: string;
  notes?: string;
};

export type SpeakerApplication = BaseCollabApplication & {
  company?: string;
  role?: string;
  linkedinUrl?: string;
  topicTitle?: string;
  topicTrack?: string;
  speakingFormat?: string;
  bio?: string;
  audienceTakeaway?: string;
  priorTalks?: string;
  availability?: string;
  avatarUrl?: string;
};

export type CollabApplicationPage<T> = { items: T[]; total: number; page: number; limit: number };
