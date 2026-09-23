import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { EventOption } from '@/tickets-portal/components/ui/EventFilter';

/** Must match ticketsethng `PaginationDto` max (100). */
const PAGE_LIMIT = 100;

/**
 * Loads every event as a filter option (paginates until complete).
 * Returns null when loading fails so callers can say so instead of hiding the filter.
 * Use from server components only.
 */
export async function fetchEventOptions(): Promise<EventOption[] | null> {
  try {
    const out: EventOption[] = [];
    let page = 1;
    while (true) {
      const p = await ticketsApiGet<Paginated<AdminEvent>>(`/admin/events?page=${page}&limit=${PAGE_LIMIT}`);
      out.push(...p.data.map((ev) => ({ slug: ev.slug, name: ev.name })));
      const pages = p.pages ?? Math.max(1, Math.ceil((p.total ?? 0) / PAGE_LIMIT));
      if (p.data.length < PAGE_LIMIT || page >= pages) break;
      page++;
    }
    return out;
  } catch (e) {
    console.error('[fetchEventOptions] could not load events', e);
    return null;
  }
}
