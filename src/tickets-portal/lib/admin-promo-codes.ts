import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminPromoCode } from '@/tickets-portal/types/admin-promo-codes';

/** Empty, null and undefined all mean "no id" (global scope / no owner). */
function normalizeOptionalId(v: string | null | undefined): string | null {
  if (v == null || v === '') return null;
  return normalizeDocumentId(v);
}

export function normalizeAdminPromoCode(raw: AdminPromoCode): AdminPromoCode {
  return {
    ...raw,
    _id: normalizeDocumentId(raw._id),
    eventId: normalizeOptionalId(raw.eventId),
    influencerId: normalizeOptionalId(raw.influencerId),
    communityId: normalizeOptionalId(raw.communityId),
  };
}

/**
 * Accepts both GET /admin/promo-codes shapes: the paginated object and the
 * legacy bare array, so admin and API can be deployed in either order.
 */
export function toPromoCodePage(
  raw: { data: AdminPromoCode[]; total: number } | AdminPromoCode[],
): { codes: AdminPromoCode[]; total: number } {
  const page = Array.isArray(raw) ? { data: raw, total: raw.length } : raw;
  return { codes: page.data.map(normalizeAdminPromoCode), total: page.total };
}
