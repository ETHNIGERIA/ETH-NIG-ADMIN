import type { ApplicationStatus } from '@/tickets-portal/types/admin-partners';

export type AdminSpeaker = {
  _id: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  avatarUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  order?: number;
  isActive?: boolean;
  eventId?: string | { _id?: unknown; slug?: string };
  eventSlug?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSpeakerApplication = {
  _id: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  linkedinUrl?: string;
  linkedin?: string;
  topicTitle?: string;
  topicTrack?: string;
  speakingFormat?: string;
  bio?: string;
  audienceTakeaway?: string;
  priorTalks?: string;
  availability?: string;
  avatarUrl?: string;
  consent?: boolean;
  status?: ApplicationStatus | string;
  eventSlug?: string;
  eventId?: string | { _id?: unknown; slug?: string };
  createdAt?: string;
  updatedAt?: string;
};
