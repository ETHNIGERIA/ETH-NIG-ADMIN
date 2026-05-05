import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminPromoCode } from '@/tickets-portal/types/admin-promo-codes';

function normalizeOptionalId(v: string | null | undefined): string | null | undefined {
  if (v === '' || v === undefined) return null;
  return normalizeDocumentId(v);
}

export function normalizeAdminPromoCode(raw: AdminPromoCode): AdminPromoCode {
  let eventId: string | null | undefined = raw.eventId;
  if (eventId === '' || eventId === undefined) eventId = null;
  else eventId = normalizeDocumentId(eventId);

  return {
    ...raw,
    _id: normalizeDocumentId(raw._id),
    eventId,
    influencerId: normalizeOptionalId(raw.influencerId ?? undefined),
    communityId: normalizeOptionalId(raw.communityId ?? undefined),
  };
}
