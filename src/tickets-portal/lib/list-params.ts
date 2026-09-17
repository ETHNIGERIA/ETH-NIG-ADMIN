import { redirect } from 'next/navigation';

export const ADMIN_PAGE_SIZE = 20;

export type ListSearchParams = { page?: string; status?: string };

/** Parses `?page=&status=` from the URL. Unknown statuses are dropped, not sent to the API. */
export function parseListParams<S extends string>(
  sp: ListSearchParams,
  statuses: readonly S[],
): { page: number; status?: S } {
  const page = Number.parseInt(sp.page ?? '', 10);
  const status = statuses.includes(sp.status as S) ? (sp.status as S) : undefined;
  return { page: Number.isFinite(page) && page > 0 ? page : 1, status };
}

/** Builds `?a=1&b=2`, skipping empty values. */
export function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * Redirects to the last page when `page` is past the end, e.g. after deleting the
 * only row on the last page. `redirect()` throws: callers inside try/catch must
 * rethrow it (`unstable_rethrow`).
 */
export function redirectIfPastLastPage(
  basePath: string,
  page: number,
  limit: number,
  total: number,
  params: Record<string, string | undefined> = {},
): void {
  const last = Math.max(1, Math.ceil(total / limit));
  if (page > last) {
    redirect(`${basePath}${toQuery({ ...params, page: last > 1 ? last : undefined })}`);
  }
}
