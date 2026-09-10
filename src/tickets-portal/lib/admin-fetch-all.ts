import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';

const PAGE_SIZE = 100;
const MAX_PAGES = 100; // hard ceiling — 10k rows

/**
 * Pages through an admin `{ items, total }` list endpoint and returns every row.
 * For server-side use only (CSV export routes) — takes the bearer token directly.
 */
export async function fetchAllAdminPages<T>(
  token: string,
  path: string,
  filters: Record<string, string>,
): Promise<{ ok: true; rows: T[] } | { ok: false; status: number }> {
  const base = getTicketsApiBaseUrl();
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });
  for (const [k, v] of Object.entries(filters)) if (v) query.set(k, v);

  const rows: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    query.set('page', String(page));
    const res = await fetch(`${base}${path}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, status: res.status };

    const json = (await res.json()) as {
      data?: { items?: T[]; total?: number };
      items?: T[];
      total?: number;
    };
    const payload = json.data ?? json;
    const items = payload.items ?? [];
    rows.push(...items);
    const total = payload.total ?? rows.length;
    if (items.length < PAGE_SIZE || rows.length >= total) break;
  }
  return { ok: true, rows };
}
