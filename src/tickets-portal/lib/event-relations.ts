import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { Paginated } from '@/tickets-portal/types/admin-events';

export type EventRef = { _id: string; slug: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const rec = asRecord(raw);
  if (rec && Array.isArray(rec.data)) return rec.data as T[];
  return [];
}

export function paginationMeta(raw: unknown): Pick<Paginated<unknown>, 'total' | 'pages'> {
  const rec = asRecord(raw);
  const total = typeof rec?.total === 'number' ? rec.total : unwrapList(raw).length;
  const pages = typeof rec?.pages === 'number' ? rec.pages : 1;
  return { total, pages };
}

function extractEventTokens(value: unknown): string[] {
  if (value == null || value === '') return [];
  if (typeof value === 'string' || typeof value === 'number') {
    return [String(value).trim().toLowerCase()].filter(Boolean);
  }
  const rec = asRecord(value);
  if (!rec) return [];
  const tokens: string[] = [];
  if (rec._id != null) tokens.push(normalizeDocumentId(rec._id).toLowerCase());
  if (typeof rec.slug === 'string') tokens.push(rec.slug.trim().toLowerCase());
  if (typeof rec.eventSlug === 'string') tokens.push(rec.eventSlug.trim().toLowerCase());
  return tokens.filter(Boolean);
}

function eventBindingValues(item: Record<string, unknown>): unknown[] {
  return [item.eventSlug, item.event_slug, item.eventId, item.event_id, item.event];
}

export function hasEventBinding(item: Record<string, unknown>): boolean {
  return eventBindingValues(item).some((value) => {
    if (value == null || value === '') return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  });
}

export function isTiedToEvent(item: Record<string, unknown>, event: EventRef): boolean {
  const wanted = new Set([event._id.toLowerCase(), event.slug.trim().toLowerCase()]);
  for (const value of eventBindingValues(item)) {
    for (const token of extractEventTokens(value)) {
      if (wanted.has(token)) return true;
    }
  }
  return false;
}

export function filterForEvent<T extends object>(items: T[], event: EventRef): T[] {
  const records = items.map((item) => item as T & Record<string, unknown>);
  const anyBound = records.some((item) => hasEventBinding(item));
  if (!anyBound) return items;
  return records.filter((item) => isTiedToEvent(item, event));
}

export function normalizeOptionalEventId<T extends { _id: unknown; eventId?: unknown }>(item: T): T & { _id: string } {
  const eventId =
    item.eventId == null || item.eventId === ''
      ? item.eventId
      : typeof item.eventId === 'string' || typeof item.eventId === 'number'
        ? normalizeDocumentId(item.eventId)
        : item.eventId;

  return {
    ...item,
    _id: normalizeDocumentId(item._id),
    ...(eventId !== undefined ? { eventId } : {}),
  };
}
