import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminRegistration, AdminTicket } from '@/tickets-portal/types/admin-registrations';

export function normalizeAdminRegistration(raw: AdminRegistration): AdminRegistration {
  return {
    ...raw,
    _id: normalizeDocumentId(raw._id),
    eventId: normalizeDocumentId(raw.eventId),
    tierId: normalizeDocumentId(raw.tierId),
    ...(raw.promoCodeId != null && raw.promoCodeId !== ''
      ? { promoCodeId: normalizeDocumentId(raw.promoCodeId) }
      : {}),
    ...(raw.userId != null && raw.userId !== ''
      ? { userId: normalizeDocumentId(raw.userId) }
      : {}),
  };
}

export function normalizeAdminTicket(raw: AdminTicket): AdminTicket {
  return {
    ...raw,
    _id: normalizeDocumentId(raw._id),
    registrationId: normalizeDocumentId(raw.registrationId),
    eventId: normalizeDocumentId(raw.eventId),
    tierId: normalizeDocumentId(raw.tierId),
  };
}
