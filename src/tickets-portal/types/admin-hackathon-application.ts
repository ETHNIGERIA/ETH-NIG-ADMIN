export const HACKATHON_APPLICATION_STATUSES = [
  'received',
  'reviewed',
  'shortlisted',
  'accepted',
  'waitlist',
  'rejected',
] as const;
export type HackathonApplicationStatus =
  (typeof HACKATHON_APPLICATION_STATUSES)[number];

export const HACKATHON_TRACKS: { key: string; label: string }[] = [
  { key: 'payments_onofframps', label: 'Payments & on/off-ramps' },
  { key: 'stablecoins_rwa', label: 'Stablecoins & RWA' },
  { key: 'identity_compliance', label: 'Identity / compliance' },
  { key: 'ai_agentic', label: 'AI + blockchain / agentic tools' },
  { key: 'creative_economy', label: 'Creative economy' },
  { key: 'public_goods_lagos', label: 'Public goods / Lagos utility' },
  { key: 'open', label: 'Open track' },
];

export function hackathonTrackLabel(key: string): string {
  return HACKATHON_TRACKS.find((t) => t.key === key)?.label ?? key;
}

export interface HackathonTeammate {
  name: string;
  email: string;
  role: string;
  hasTicket: boolean;
}

export interface HackathonReviewNote {
  text: string;
  authorEmail: string;
  at: string;
}

export interface HackathonApplication {
  _id: string;
  applicationId: string;
  eventName: string;

  ticketCode: string;
  ticketEmail: string;
  ticketTierName: string;

  contactName: string;
  contactEmail: string;
  contactWhatsapp?: string;

  participationType: 'solo' | 'team';
  teamName?: string;
  teammates: HackathonTeammate[];
  lookingForTeammates: boolean;
  neededRoles: string[];

  track: string;

  projectName: string;
  oneLiner: string;
  problem: string;
  solution: string;
  techStack: string[];
  chainInfra: string[];
  repoUrl: string;
  demoUrl: string;
  buildType: 'new' | 'existing';
  demoDayDeliverable: string;

  attendanceMode: 'onsite' | 'hybrid';
  powerInternetNeeds: string;
  accessibilityNeeds: string;
  referralSource: string;

  agreedCodeOfConduct: boolean;
  agreedDataProcessing: boolean;
  photoVideoConsent: boolean;

  status: HackathonApplicationStatus;
  reviewNotes: HackathonReviewNote[];
  score?: number;

  createdAt: string;
  updatedAt: string;
}
