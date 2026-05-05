import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminFormField } from '@/tickets-portal/types/admin-form-fields';
import type { Paginated } from '@/tickets-portal/types/admin-events';

/** Must match ticketsethng `PaginationDto` max (100). */
const PAGE_LIMIT = 100;

/**
 * Loads every registration field for an event (paginates until complete).
 * Use from server components and server actions only.
 */
export async function fetchAllEventFormFields(eventId: string): Promise<AdminFormField[]> {
  const out: AdminFormField[] = [];
  let page = 1;
  while (true) {
    const p = await ticketsApiGet<Paginated<AdminFormField>>(
      `/admin/events/${eventId}/form-fields?page=${page}&limit=${PAGE_LIMIT}`,
    );
    out.push(...p.data);
    const pages = p.pages ?? Math.max(1, Math.ceil((p.total ?? 0) / PAGE_LIMIT));
    if (p.data.length < PAGE_LIMIT || page >= pages) break;
    page++;
  }
  return out;
}

export async function loadExistingKeysAndNextSort(eventId: string): Promise<{
  keys: Set<string>;
  nextSort: number;
}> {
  const fields = await fetchAllEventFormFields(eventId);
  const keys = new Set(fields.map((f) => f.fieldKey));
  const nextSort = fields.length === 0 ? 0 : Math.max(...fields.map((f) => f.sortOrder ?? 0)) + 1;
  return { keys, nextSort };
}
