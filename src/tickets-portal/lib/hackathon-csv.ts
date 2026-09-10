import type { HackathonApplication } from '@/tickets-portal/types/admin-hackathon-application';
import { hackathonTrackLabel } from '@/tickets-portal/types/admin-hackathon-application';
import { buildCsv } from '@/tickets-portal/lib/csv';

const COLUMNS: { header: string; value: (a: HackathonApplication) => unknown }[] =
  [
    { header: 'Application ID', value: (a) => a.applicationId },
    { header: 'Status', value: (a) => a.status },
    { header: 'Score', value: (a) => a.score ?? '' },
    { header: 'Track', value: (a) => hackathonTrackLabel(a.track) },
    { header: 'Entry', value: (a) => a.participationType },
    { header: 'Team name', value: (a) => a.teamName ?? '' },
    { header: 'Team size', value: (a) => a.teammates.length + 1 },
    { header: 'Contact name', value: (a) => a.contactName },
    { header: 'Contact email', value: (a) => a.contactEmail },
    { header: 'Contact WhatsApp', value: (a) => a.contactWhatsapp ?? '' },
    { header: 'Ticket tier', value: (a) => a.ticketTierName },
    { header: 'Ticket code', value: (a) => a.ticketCode },
    { header: 'Project', value: (a) => a.projectName },
    { header: 'One-liner', value: (a) => a.oneLiner },
    { header: 'Build type', value: (a) => a.buildType },
    { header: 'Tech stack', value: (a) => a.techStack.join('; ') },
    { header: 'Chains / infra', value: (a) => a.chainInfra.join('; ') },
    { header: 'Repo URL', value: (a) => a.repoUrl },
    { header: 'Demo URL', value: (a) => a.demoUrl },
    { header: 'Attendance', value: (a) => a.attendanceMode },
    { header: 'Looking for teammates', value: (a) => (a.lookingForTeammates ? 'yes' : 'no') },
    { header: 'Needed roles', value: (a) => a.neededRoles.join('; ') },
    { header: 'Referral source', value: (a) => a.referralSource },
    { header: 'Photo/video consent', value: (a) => (a.photoVideoConsent ? 'yes' : 'no') },
    { header: 'Submitted', value: (a) => a.createdAt },
  ];

export function hackathonApplicationsToCsv(
  rows: HackathonApplication[],
): string {
  return buildCsv(COLUMNS, rows);
}
