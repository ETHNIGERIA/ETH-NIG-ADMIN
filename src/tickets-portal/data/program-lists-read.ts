import { ticketsApiGet, ticketsPublicGet } from '@/tickets-portal/lib/tickets-api.server';
import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { normalizeAdminRegistration } from '@/tickets-portal/lib/admin-registrations';
import { normalizeOptionalEventId, unwrapList } from '@/tickets-portal/lib/event-relations';
import {
  adminPartnerApplicationsPath,
  adminSpeakerApplicationsPath,
  adminSponsorApplicationsPath,
  partnersForEventPath,
  speakersForEventPath,
  sponsorsForEventPath,
} from '@/tickets-portal/data/program-brands';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import type { AdminPartner, AdminPartnerApplication } from '@/tickets-portal/types/admin-partners';
import type { AdminSponsor, AdminSponsorApplication } from '@/tickets-portal/types/admin-sponsors';
import type { AdminSpeaker, AdminSpeakerApplication } from '@/tickets-portal/types/admin-speakers';

export type ProgramEventLists = {
  slug: string;
  baseUrl: string;
  event: AdminEvent | null;
  eventError?: string;
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

type PublicEvent = Pick<AdminEvent, '_id' | 'slug' | 'name' | 'status' | 'startsAt' | 'endsAt'> & {
  allowedOrigins?: string[];
  createdAt?: string;
  updatedAt?: string;
};

async function safe<T>(
  label: keyof ProgramEventLists['errors'],
  errors: ProgramEventLists['errors'],
  run: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await run();
  } catch (e) {
    errors[label] = e instanceof Error ? e.message : `Could not load ${label}.`;
    return fallback;
  }
}

async function fetchAllRegistrations(eventId: string): Promise<Paginated<AdminRegistration>> {
  const limit = 100;
  const first = await ticketsApiGet<Paginated<AdminRegistration>>(
    `/admin/events/${eventId}/registrations?page=1&limit=${limit}`,
  );
  const pages = first.pages ?? 1;
  if (pages <= 1) return first;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      ticketsApiGet<Paginated<AdminRegistration>>(
        `/admin/events/${eventId}/registrations?page=${i + 2}&limit=${limit}`,
      ),
    ),
  );
  return {
    ...first,
    data: first.data.concat(rest.flatMap((p) => p.data ?? [])),
  };
}

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return a.replace(/\/$/, '') === b.replace(/\/$/, '');
  }
}

export async function fetchProgramEventLists(slug: string, baseUrl: string): Promise<ProgramEventLists> {
  const errors: ProgramEventLists['errors'] = {};
  const empty: ProgramEventLists = {
    slug,
    baseUrl,
    event: null,
    members: [],
    membersTotal: 0,
    partners: [],
    partnerApplications: [],
    speakers: [],
    speakerApplications: [],
    sponsors: [],
    sponsorApplications: [],
    errors,
  };

  let eventRaw: PublicEvent;
  try {
    eventRaw = await ticketsPublicGet<PublicEvent>(`/events/${encodeURIComponent(slug)}`, baseUrl);
  } catch (e) {
    return {
      ...empty,
      eventError: e instanceof Error ? e.message : 'Event not found for this slug.',
    };
  }

  const event: AdminEvent = {
    ...eventRaw,
    _id: normalizeDocumentId(eventRaw._id),
    slug: eventRaw.slug,
    name: eventRaw.name,
    status: eventRaw.status,
    startsAt: eventRaw.startsAt,
    endsAt: eventRaw.endsAt,
    allowedOrigins: eventRaw.allowedOrigins ?? [],
  };
  const canUseAdminSession = sameHost(baseUrl, getTicketsApiBaseUrl());

  const [partnersRaw, partnerAppsRaw, speakersRaw, speakerAppsRaw, sponsorsRaw, sponsorAppsRaw, membersPage] =
    await Promise.all([
      safe('partners', errors, () => ticketsPublicGet<unknown>(partnersForEventPath(event.slug), baseUrl), []),
      canUseAdminSession
        ? safe(
            'partnerApplications',
            errors,
            () => ticketsApiGet<unknown>(adminPartnerApplicationsPath(event.slug)),
            [],
          )
        : Promise.resolve([]),
      safe('speakers', errors, () => ticketsPublicGet<unknown>(speakersForEventPath(event.slug), baseUrl), []),
      canUseAdminSession
        ? safe(
            'speakerApplications',
            errors,
            () => ticketsApiGet<unknown>(adminSpeakerApplicationsPath(event.slug)),
            [],
          )
        : Promise.resolve([]),
      safe('sponsors', errors, () => ticketsPublicGet<unknown>(sponsorsForEventPath(event.slug), baseUrl), []),
      canUseAdminSession
        ? safe(
            'sponsorApplications',
            errors,
            () => ticketsApiGet<unknown>(adminSponsorApplicationsPath(event.slug)),
            [],
          )
        : Promise.resolve([]),
      canUseAdminSession
        ? safe('members', errors, () => fetchAllRegistrations(event._id), {
            data: [],
            total: 0,
            page: 1,
            limit: 100,
            pages: 0,
          })
        : Promise.resolve({ data: [], total: 0, page: 1, limit: 100, pages: 0 }),
    ]);

  if (!canUseAdminSession) {
    errors.members = 'Registrations need admin login on this API host.';
    errors.partnerApplications = 'Applications need admin login on this API host.';
    errors.speakerApplications = 'Applications need admin login on this API host.';
    errors.sponsorApplications = 'Applications need admin login on this API host.';
  }

  return {
    slug,
    baseUrl,
    event,
    members: (membersPage.data ?? []).map(normalizeAdminRegistration),
    membersTotal: membersPage.total ?? membersPage.data?.length ?? 0,
    partners: unwrapList<AdminPartner>(partnersRaw).map(normalizeOptionalEventId),
    partnerApplications: unwrapList<AdminPartnerApplication>(partnerAppsRaw).map(normalizeOptionalEventId),
    speakers: unwrapList<AdminSpeaker>(speakersRaw).map(normalizeOptionalEventId),
    speakerApplications: unwrapList<AdminSpeakerApplication>(speakerAppsRaw).map(normalizeOptionalEventId),
    sponsors: unwrapList<AdminSponsor>(sponsorsRaw).map(normalizeOptionalEventId),
    sponsorApplications: unwrapList<AdminSponsorApplication>(sponsorAppsRaw).map((row) => ({
      ...normalizeOptionalEventId(row),
      eventSlug: String(row.eventSlug ?? ''),
    })),
    errors,
  };
}
