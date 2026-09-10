import type { HackathonApplicationStatus } from '@/tickets-portal/types/admin-hackathon-application';

export type PitchApplicationStatus = HackathonApplicationStatus;

export const PITCH_SECTORS: { key: string; label: string }[] = [
  { key: 'fintech', label: 'Fintech' },
  { key: 'payments', label: 'Payments' },
  { key: 'defi', label: 'DeFi' },
  { key: 'rwa', label: 'RWA / tokenization' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'identity', label: 'Identity / compliance' },
  { key: 'consumer', label: 'Consumer' },
  { key: 'creator_economy', label: 'Creator economy' },
  { key: 'ai', label: 'AI' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'devtools', label: 'Developer tools' },
  { key: 'public_goods', label: 'Public goods' },
  { key: 'other', label: 'Other' },
];

export const PITCH_STAGES: { key: string; label: string }[] = [
  { key: 'idea', label: 'Idea' },
  { key: 'pre_seed', label: 'Pre-seed' },
  { key: 'seed', label: 'Seed' },
  { key: 'series_a', label: 'Series A' },
  { key: 'series_b_plus', label: 'Series B+' },
  { key: 'bootstrapped', label: 'Bootstrapped' },
  { key: 'profitable', label: 'Profitable' },
];

export const CAC_STATUSES: { key: string; label: string }[] = [
  { key: 'registered', label: 'Registered' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'not_registered', label: 'Not registered' },
];

export const FUNDRAISING_STATUSES: { key: string; label: string }[] = [
  { key: 'not_raising', label: 'Not raising' },
  { key: 'raising', label: 'Raising' },
  { key: 'recently_closed', label: 'Recently closed' },
];

export const SLOT_PREFERENCES: { key: string; label: string }[] = [
  { key: 'three_min', label: '3-min pitch' },
  { key: 'five_min_qa', label: '5-min pitch + Q&A' },
  { key: 'demo_day_only', label: 'Demo Day only' },
];

const label = (list: { key: string; label: string }[], key: string) =>
  list.find((x) => x.key === key)?.label ?? key;
export const pitchSectorLabel = (k: string) => label(PITCH_SECTORS, k);
export const pitchStageLabel = (k: string) => label(PITCH_STAGES, k);
export const cacStatusLabel = (k: string) => label(CAC_STATUSES, k);
export const fundraisingLabel = (k: string) => label(FUNDRAISING_STATUSES, k);
export const slotLabel = (k: string) => label(SLOT_PREFERENCES, k);

export interface PitchReviewNote {
  text: string;
  authorEmail: string;
  at: string;
}

export interface PitchApplication {
  _id: string;
  applicationId: string;
  eventName: string;

  ticketCode: string;
  ticketEmail: string;
  ticketTierName: string;

  contactName: string;
  contactEmail: string;
  contactWhatsapp?: string;

  companyName: string;
  website: string;
  oneLiner: string;
  sector: string;
  stage: string;
  yearFounded: number;
  countryOfOperation: string;
  cacStatus: string;
  teamSize: number;

  problem: string;
  solution: string;
  productStatus: string;
  traction: string;
  targetCustomer: string;
  businessModel: string;
  whyNow: string;
  whyLbwAsk: string;

  fundraisingStatus: string;
  raiseAmount: string;
  openToIntros: string[];

  deckUrl: string;
  videoUrl: string;
  demoUrl: string;
  confidentialDeck: boolean;

  slotPreference: string;
  officeHoursOptIn: boolean;

  agreedCodeOfConduct: boolean;
  agreedDataProcessing: boolean;
  photoVideoConsent: boolean;

  status: PitchApplicationStatus;
  reviewNotes: PitchReviewNote[];
  score?: number;

  createdAt: string;
  updatedAt: string;
}
