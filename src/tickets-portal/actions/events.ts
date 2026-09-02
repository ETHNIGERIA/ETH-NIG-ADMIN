'use server';

import { redirect } from 'next/navigation';
import {
  ticketsApiDelete,
  ticketsApiPatch,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, EventStatus } from '@/tickets-portal/types/admin-events';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';

export type ActionState = { error?: string } | undefined;

function parseJsonArray(formData: FormData, key: string): unknown[] | undefined {
  const raw = String(formData.get(key) ?? '').trim();
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const startsRaw = String(formData.get('startsAt') ?? '');
  const endsRaw = String(formData.get('endsAt') ?? '');
  const originsRaw = String(formData.get('allowedOrigins') ?? '').trim();
  const daysRaw = String(formData.get('daysJson') ?? '').trim();

  if (!slug || !name || !startsRaw || !endsRaw) {
    return { error: 'Slug, name, start, and end are required.' };
  }

  const startsAt = new Date(startsRaw);
  const endsAt = new Date(endsRaw);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: 'Invalid dates.' };
  }
  if (endsAt <= startsAt) {
    return { error: 'End must be after start.' };
  }
  const days = parseJsonArray(formData, 'daysJson');
  if (daysRaw && !days) return { error: 'Days must be valid JSON array.' };

  const allowedOrigins = originsRaw
    ? originsRaw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  let created: AdminEvent;
  try {
    created = await ticketsApiPost<AdminEvent, Record<string, unknown>>('/admin/events', {
      slug,
      name,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      ...(days ? { days } : {}),
      timezone: String(formData.get('timezone') ?? 'Africa/Lagos').trim() || 'Africa/Lagos',
      ...(allowedOrigins?.length ? { allowedOrigins } : {}),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create event.' };
  }

  redirect(`/tickets-command/events/${normalizeDocumentId(created._id)}`);
}

export async function updateEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const startsRaw = String(formData.get('startsAt') ?? '');
  const endsRaw = String(formData.get('endsAt') ?? '');
  const originsRaw = String(formData.get('allowedOrigins') ?? '').trim();
  const daysRaw = String(formData.get('daysJson') ?? '').trim();

  if (!eventId || !name || !startsRaw || !endsRaw) {
    return { error: 'Name, start, and end are required.' };
  }

  const startsAt = new Date(startsRaw);
  const endsAt = new Date(endsRaw);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: 'Invalid dates.' };
  }
  if (endsAt <= startsAt) {
    return { error: 'End must be after start.' };
  }
  const days = parseJsonArray(formData, 'daysJson');
  if (daysRaw && !days) return { error: 'Days must be valid JSON array.' };
  // Clearing configured days changes registration/check-in behaviour, so it is
  // an explicit opt-in (checkbox), not an inferred consequence of a blank field.
  const clearDays = formData.get('clearDays') === 'on';

  const allowedOrigins = originsRaw
    ? originsRaw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    await ticketsApiPatch<AdminEvent, Record<string, unknown>>(`/admin/events/${eventId}`, {
      name,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      ...(clearDays ? { days: [] } : days ? { days } : {}),
      timezone: String(formData.get('timezone') ?? 'Africa/Lagos').trim() || 'Africa/Lagos',
      allowedOrigins,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update event.' };
  }

  redirect(`/tickets-command/events/${eventId}`);
}

export async function setEventStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim() as EventStatus;
  if (!eventId || !status) {
    return { error: 'Missing event or status.' };
  }
  if (!['draft', 'published', 'archived'].includes(status)) {
    return { error: 'Invalid status.' };
  }

  try {
    await ticketsApiPatch<AdminEvent, { status: EventStatus }>(`/admin/events/${eventId}/status`, {
      status,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update status.' };
  }

  redirect(`/tickets-command/events/${eventId}`);
}

export async function deleteEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  if (!eventId) {
    return { error: 'Missing event.' };
  }

  try {
    await ticketsApiDelete(`/admin/events/${eventId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete event.' };
  }

  redirect('/tickets-command/events');
}
