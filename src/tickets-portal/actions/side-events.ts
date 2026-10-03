'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  ticketsApiGet,
  ticketsApiPatch,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import type { EventOption } from '@/tickets-portal/actions/events';
import { zonedWallTimeToIso } from '@/tickets-portal/lib/zoned-time';

export type SideEventActionState = { error?: string; notice?: string } | undefined;

type SessionDraft = { key: string; date: string; label: string; startTime: string; endTime: string };

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

/** BenefitsListEditor submits one benefit per line. */
function benefitsFrom(formData: FormData): string[] {
  return text(formData, 'benefits')
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean);
}

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

/** Wall-clock sessions from the form → API days with explicit offsets. */
function parseDays(formData: FormData, timezone: string): { days?: unknown[]; error?: string } {
  let sessions: SessionDraft[];
  try {
    const parsed: unknown = JSON.parse(text(formData, 'sessionsJson') || '[]');
    if (!Array.isArray(parsed)) return { error: 'Sessions are invalid.' };
    sessions = parsed as SessionDraft[];
  } catch {
    return { error: 'Sessions are invalid.' };
  }
  if (sessions.length === 0) return { error: 'Add at least one day.' };
  const days = [];
  for (const [i, s] of sessions.entries()) {
    const startsAt = zonedWallTimeToIso(s.date, s.startTime, timezone);
    const endsAt = zonedWallTimeToIso(s.date, s.endTime, timezone);
    if (!startsAt || !endsAt) {
      return { error: `Day ${i + 1}: enter a valid date, start and end time in ${timezone}.` };
    }
    days.push({ key: s.key, date: s.date, label: s.label.trim(), startsAt, endsAt });
  }
  return { days };
}

/** Display units → minor units. Paid prices must be positive. */
function parseAdmission(formData: FormData): { admission?: Record<string, unknown>; error?: string } {
  const isFree = formData.get('isFree') === 'on';
  const capacityRaw = text(formData, 'capacity');
  let capacity: number | undefined;
  if (capacityRaw) {
    capacity = Number(capacityRaw);
    if (!Number.isInteger(capacity) || capacity < 1) {
      return { error: 'Capacity must be a whole number of at least 1, or empty for unlimited.' };
    }
  }
  if (isFree) return { admission: { isFree: true, priceMinor: 0, ...(capacity ? { capacity } : {}) } };

  const price = Number(text(formData, 'price').replace(/,/g, ''));
  const priceMinor = Math.round(price * 100);
  if (!Number.isFinite(price) || priceMinor <= 0) return { error: 'Enter a price above zero.' };
  const currency = text(formData, 'currency').toUpperCase();
  if (!currency) return { error: 'Choose a currency.' };
  return { admission: { isFree: false, priceMinor, currency, ...(capacity ? { capacity } : {}) } };
}

export async function createSideEventAction(
  _prev: SideEventActionState,
  formData: FormData,
): Promise<SideEventActionState> {
  const name = text(formData, 'name');
  const slug = text(formData, 'slug').toLowerCase();
  const timezone = text(formData, 'timezone') || 'Africa/Lagos';
  if (!name || !slug) return { error: 'Name and slug are required.' };
  const { days, error: daysError } = parseDays(formData, timezone);
  if (daysError) return { error: daysError };
  const { admission, error: admissionError } = parseAdmission(formData);
  if (admissionError) return { error: admissionError };
  const eventSlug = text(formData, 'eventSlug');

  let created: AdminSideEvent;
  try {
    created = await ticketsApiPost<AdminSideEvent, Record<string, unknown>>('/admin/side-events', {
      name,
      slug,
      ...(eventSlug ? { eventSlug } : {}),
      description: text(formData, 'description'),
      venue: text(formData, 'venue'),
      flyerUrl: text(formData, 'flyerUrl'),
      benefits: benefitsFrom(formData),
      timezone,
      days,
      admission,
    });
  } catch (e) {
    unstable_rethrow(e);
    return { error: message(e, 'Could not create the side event.') };
  }
  redirect(`/tickets-command/side-events/${created._id}`);
}

export async function updateSideEventAction(
  _prev: SideEventActionState,
  formData: FormData,
): Promise<SideEventActionState> {
  const id = text(formData, 'id');
  const version = Number(text(formData, 'version'));
  const locked = text(formData, 'locked') === 'true';
  const name = text(formData, 'name');
  if (!id || !Number.isInteger(version) || !name) return { error: 'Name is required.' };

  const body: Record<string, unknown> = {
    version,
    name,
    description: text(formData, 'description'),
    venue: text(formData, 'venue'),
    flyerUrl: text(formData, 'flyerUrl'),
    benefits: benefitsFrom(formData),
  };
  // Frozen fields are only sent while the side event is still a draft.
  if (!locked) {
    const timezone = text(formData, 'timezone') || 'Africa/Lagos';
    const { days, error: daysError } = parseDays(formData, timezone);
    if (daysError) return { error: daysError };
    const { admission, error: admissionError } = parseAdmission(formData);
    if (admissionError) return { error: admissionError };
    Object.assign(body, {
      slug: text(formData, 'slug').toLowerCase(),
      eventSlug: text(formData, 'eventSlug') || null,
      timezone,
      days,
      admission,
    });
  }

  try {
    await ticketsApiPatch<AdminSideEvent, Record<string, unknown>>(`/admin/side-events/${id}`, body);
  } catch (e) {
    unstable_rethrow(e);
    return { error: message(e, 'Could not save the side event.') };
  }
  revalidatePath(`/tickets-command/side-events/${id}`);
  return { notice: 'Saved.' };
}

export async function setSideEventStatusAction(
  _prev: SideEventActionState,
  formData: FormData,
): Promise<SideEventActionState> {
  const id = text(formData, 'id');
  const version = Number(text(formData, 'version'));
  const status = text(formData, 'status');
  if (!id || !Number.isInteger(version) || !['published', 'archived'].includes(status)) {
    return { error: 'Invalid status change.' };
  }
  try {
    await ticketsApiPatch<AdminSideEvent, { version: number; status: string }>(
      `/admin/side-events/${id}/status`,
      { version, status },
    );
  } catch (e) {
    unstable_rethrow(e);
    return { error: message(e, 'Could not change the status.') };
  }
  revalidatePath(`/tickets-command/side-events/${id}`);
  return { notice: status === 'published' ? 'Published.' : 'Archived.' };
}

/** Uses the existing per-day check-in endpoint scoped to this side event. */
export async function checkInSideEventAction(
  _prev: SideEventActionState,
  formData: FormData,
): Promise<SideEventActionState> {
  const id = text(formData, 'id');
  const code = text(formData, 'code').toUpperCase();
  const dayKey = text(formData, 'dayKey');
  if (!id || !code || !dayKey) return { error: 'Enter a ticket code and choose a day.' };
  try {
    await ticketsApiPost<unknown, { dayKey: string }>(
      `/admin/events/${id}/tickets/${encodeURIComponent(code)}/check-in`,
      { dayKey },
    );
  } catch (e) {
    unstable_rethrow(e);
    return { error: message(e, 'Check-in failed.') };
  }
  return { notice: `${code} checked in.` };
}

/** Main events for the parent picker; the option id is the event slug. */
export async function searchMainEventsAction(
  search: string,
): Promise<{ options: EventOption[]; total: number } | { error: string }> {
  const q = new URLSearchParams({ page: '1', limit: '20' });
  const term = search.trim().slice(0, 100);
  if (term) q.set('search', term);
  try {
    // /admin/events lists only this admin's main events.
    const res = await ticketsApiGet<Paginated<AdminEvent>>(`/admin/events?${q.toString()}`);
    return {
      options: res.data.map((e) => ({ id: e.slug, name: `${e.name} (${e.slug})` })),
      total: res.total,
    };
  } catch (e) {
    unstable_rethrow(e);
    return { error: message(e, 'Could not search events.') };
  }
}
