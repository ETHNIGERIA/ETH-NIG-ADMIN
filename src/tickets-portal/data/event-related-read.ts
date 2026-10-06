import { ticketsApiGet, ticketsPublicGet } from '@/tickets-portal/lib/tickets-api.server';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { normalizeAdminRegistration } from '@/tickets-portal/lib/admin-registrations';
import { normalizeOptionalEventId, unwrapList, type EventRef } from '@/tickets-portal/lib/event-relations';
import {
  adminPartnerApplicationsPath,
  adminSpeakerApplicationsPath,
  adminSponsorApplicationsPath,
  partnersForEventPath,
  speakersForEventPath,
  sponsorsForEventPath,
} from '@/tickets-portal/data/program-brands';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import type { AdminPartner, AdminPartnerApplication } from '@/tickets-portal/types/admin-partners';
import type { AdminSponsor, AdminSponsorApplication } from '@/tickets-portal/types/admin-sponsors';
import type { AdminSpeaker, AdminSpeakerApplication } from '@/tickets-portal/types/admin-speakers';
import type { EventRelatedRecordsData } from '@/tickets-portal/types/event-related';

const PREVIEW_LIMIT = 8;

type RelatedKind = 'members' | 'partners' | 'speakers' | 'sponsors';

async function safe<T>(
  label: keyof EventRelatedRecordsData['errors'],
  run: () => Promise<T>,
  fallback: T,
  errors: EventRelatedRecordsData['errors'],
): Promise<T> {
  try {
    return await run();
  } catch (e) {
    errors[label] = e instanceof Error ? e.message : `Could not load ${label}.`;
    return fallback;
  }
}

function emptyMembersPage(): Paginated<AdminRegistration> {
  return { data: [], total: 0, page: 1, limit: PREVIEW_LIMIT, pages: 0 };
}

export async function fetchEventRelatedRecords(
  event: EventRef,
  opts?: { limit?: number; kinds?: RelatedKind[] },
): Promise<EventRelatedRecordsData> {
  const limit = opts?.limit ?? PREVIEW_LIMIT;
  const kinds = new Set(opts?.kinds ?? ['members', 'partners', 'speakers', 'sponsors']);
  const errors: EventRelatedRecordsData['errors'] = {};

  const [membersPage, partnersRaw, partnerAppsRaw, speakersRaw, speakerAppsRaw, sponsorsRaw, sponsorAppsRaw] =
    await Promise.all([
      kinds.has('members')
        ? safe(
            'members',
            () =>
              ticketsApiGet<Paginated<AdminRegistration>>(
                `/admin/events/${event._id}/registrations?page=1&limit=${limit}`,
              ),
            emptyMembersPage(),
            errors,
          )
        : Promise.resolve(emptyMembersPage()),
      kinds.has('partners')
        ? safe('partners', () => ticketsPublicGet<unknown>(partnersForEventPath(event.slug)), [], errors)
        : Promise.resolve([]),
      kinds.has('partners')
        ? safe(
            'partnerApplications',
            () => ticketsApiGet<unknown>(adminPartnerApplicationsPath(event.slug)),
            [],
            errors,
          )
        : Promise.resolve([]),
      kinds.has('speakers')
        ? safe('speakers', () => ticketsPublicGet<unknown>(speakersForEventPath(event.slug)), [], errors)
        : Promise.resolve([]),
      kinds.has('speakers')
        ? safe(
            'speakerApplications',
            () => ticketsApiGet<unknown>(adminSpeakerApplicationsPath(event.slug)),
            [],
            errors,
          )
        : Promise.resolve([]),
      kinds.has('sponsors')
        ? safe('sponsors', () => ticketsPublicGet<unknown>(sponsorsForEventPath(event.slug)), [], errors)
        : Promise.resolve([]),
      kinds.has('sponsors')
        ? safe(
            'sponsorApplications',
            () => ticketsApiGet<unknown>(adminSponsorApplicationsPath(event.slug)),
            [],
            errors,
          )
        : Promise.resolve([]),
    ]);

  const members = (membersPage.data ?? []).map(normalizeAdminRegistration);
  const partners = unwrapList<AdminPartner>(partnersRaw).map(normalizeOptionalEventId);
  const partnerApplications = unwrapList<AdminPartnerApplication>(partnerAppsRaw).map(normalizeOptionalEventId);
  const speakers = unwrapList<AdminSpeaker>(speakersRaw).map(normalizeOptionalEventId);
  const speakerApplications = unwrapList<AdminSpeakerApplication>(speakerAppsRaw).map(normalizeOptionalEventId);
  const sponsors = unwrapList<AdminSponsor>(sponsorsRaw).map(normalizeOptionalEventId);
  const sponsorApplications = unwrapList<AdminSponsorApplication>(sponsorAppsRaw).map((row) => ({
    ...normalizeOptionalEventId(row),
    eventSlug: String(row.eventSlug ?? ''),
  }));

  return {
    members,
    membersTotal: membersPage.total ?? members.length,
    partners,
    partnerApplications,
    speakers,
    speakerApplications,
    sponsors,
    sponsorApplications,
    errors,
  };
}

export function eventRefFrom(event: { _id: unknown; slug: string }): EventRef {
  return { _id: normalizeDocumentId(event._id), slug: event.slug };
}
