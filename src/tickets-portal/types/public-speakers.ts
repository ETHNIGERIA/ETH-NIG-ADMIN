export type PublicSpeaker = {
  _id: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  avatarUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  eventSlug?: string;
  order: number;
  isActive: boolean;
};

export type PublicSpeakerPage = {
  items: PublicSpeaker[];
  total: number;
  page: number;
  limit: number;
};
