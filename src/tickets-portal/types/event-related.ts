import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import type { AdminPartner, AdminPartnerApplication } from '@/tickets-portal/types/admin-partners';
import type { AdminSponsor, AdminSponsorApplication } from '@/tickets-portal/types/admin-sponsors';
import type { AdminSpeaker, AdminSpeakerApplication } from '@/tickets-portal/types/admin-speakers';

export type EventRelatedRecordsData = {
  members: AdminRegistration[];
  membersTotal: number;
  partners: AdminPartner[];
  partnerApplications: AdminPartnerApplication[];
  speakers: AdminSpeaker[];
  speakerApplications: AdminSpeakerApplication[];
  sponsors: AdminSponsor[];
  sponsorApplications: AdminSponsorApplication[];
  errors: {
    members?: string;
    partners?: string;
    partnerApplications?: string;
    speakers?: string;
    speakerApplications?: string;
    sponsors?: string;
    sponsorApplications?: string;
  };
};
