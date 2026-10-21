import { unstable_rethrow } from 'next/navigation';
import { ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import { isObjectId } from '@/tickets-portal/lib/is-object-id';

/** Mirrors BULK_IDS_MAX in the API's BulkIdsDto. */
export const BULK_DELETE_MAX = 100;

export type BulkDeleteState = { error?: string; deleted?: number; notFound?: number } | undefined;

/** POSTs a selection to an API bulk-delete route. Server-only. */
export async function bulkDelete(path: string, ids: string[], noun: string): Promise<BulkDeleteState> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return { error: `Select at least one ${noun}.` };
  if (unique.length > BULK_DELETE_MAX) return { error: `Select at most ${BULK_DELETE_MAX} at a time.` };
  if (!unique.every(isObjectId)) return { error: 'Bad selection.' };

  try {
    const res = await ticketsApiPost<{ deleted: string[]; notFound: string[] }>(path, { ids: unique });
    return { deleted: res.deleted.length, notFound: res.notFound.length };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not delete the selection.' };
  }
}
