import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';

export const EVENT_CONSOLE = '/tickets-command/events-v2';

export async function loadConsoleEvent(eventId: string): Promise<AdminEvent> {
  if (!/^[a-f0-9]{24}$/i.test(eventId)) notFound();
  try {
    const raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
    if (raw.kind === 'side') notFound();
    return { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof Error && /not found/i.test(error.message)) notFound();
    throw error;
  }
}

export function eventConsoleHref(eventId: string, section = '') {
  return `${EVENT_CONSOLE}/${eventId}${section ? `/${section}` : ''}`;
}

export function formatEventDate(value?: string, timezone = 'Africa/Lagos') {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not set';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(date);
}
