import type { PitchApplication } from '@/tickets-portal/types/admin-pitch-application';
import { buildCsv } from '@/tickets-portal/lib/csv';
import {
  cacStatusLabel,
  fundraisingLabel,
  pitchSectorLabel,
  pitchStageLabel,
  slotLabel,
} from '@/tickets-portal/types/admin-pitch-application';

const COLUMNS: { header: string; value: (a: PitchApplication) => unknown }[] = [
  { header: 'Application ID', value: (a) => a.applicationId },
  { header: 'Status', value: (a) => a.status },
  { header: 'Score', value: (a) => a.score ?? '' },
  { header: 'Company', value: (a) => a.companyName },
  { header: 'Website', value: (a) => a.website },
  { header: 'One-liner', value: (a) => a.oneLiner },
  { header: 'Sector', value: (a) => pitchSectorLabel(a.sector) },
  { header: 'Stage', value: (a) => pitchStageLabel(a.stage) },
  { header: 'Year founded', value: (a) => a.yearFounded },
  { header: 'Country', value: (a) => a.countryOfOperation },
  { header: 'CAC status', value: (a) => cacStatusLabel(a.cacStatus) },
  { header: 'Team size', value: (a) => a.teamSize },
  { header: 'Contact name', value: (a) => a.contactName },
  { header: 'Contact email', value: (a) => a.contactEmail },
  { header: 'Contact WhatsApp', value: (a) => a.contactWhatsapp ?? '' },
  { header: 'Ticket tier', value: (a) => a.ticketTierName },
  { header: 'Fundraising', value: (a) => fundraisingLabel(a.fundraisingStatus) },
  { header: 'Raise amount', value: (a) => a.raiseAmount },
  { header: 'Open to intros', value: (a) => a.openToIntros.join('; ') },
  { header: 'Slot preference', value: (a) => slotLabel(a.slotPreference) },
  { header: 'Office hours', value: (a) => (a.officeHoursOptIn ? 'yes' : 'no') },
  { header: 'Deck URL', value: (a) => a.deckUrl },
  { header: 'Confidential deck', value: (a) => (a.confidentialDeck ? 'yes' : 'no') },
  { header: 'Video URL', value: (a) => a.videoUrl },
  { header: 'Demo URL', value: (a) => a.demoUrl },
  { header: 'Photo/video consent', value: (a) => (a.photoVideoConsent ? 'yes' : 'no') },
  { header: 'Submitted', value: (a) => a.createdAt },
];

export function pitchApplicationsToCsv(rows: PitchApplication[]): string {
  return buildCsv(COLUMNS, rows);
}
