import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';

/** Resolve Mongo event id from overview payloads (populated `{ _id }` or plain ObjectId string). */
export function overviewEventId(ref: unknown): string | null {
  if (ref == null) return null;
  if (typeof ref === 'string') return normalizeDocumentId(ref) || null;
  if (typeof ref === 'object' && '_id' in (ref as object)) {
    const id = (ref as { _id: unknown })._id;
    if (id != null) return normalizeDocumentId(id) || null;
  }
  return null;
}

export function overviewEventHref(ref: unknown): string | null {
  const eventId = overviewEventId(ref);
  return eventId ? `/tickets-command/events/${eventId}` : null;
}

export function overviewPaymentHref(paymentId: unknown): string | null {
  if (paymentId == null) return null;
  const id = normalizeDocumentId(paymentId);
  return id ? `/tickets-command/payments/${id}` : null;
}

export function overviewRegistrationHref(eventRef: unknown, registrationRef: unknown): string | null {
  const eventId = overviewEventId(eventRef);
  if (!eventId || registrationRef == null || typeof registrationRef !== 'object') return null;
  const rid = '_id' in registrationRef ? normalizeDocumentId((registrationRef as { _id: unknown })._id) : '';
  return rid ? `/tickets-command/events/${eventId}/registrations/${rid}` : null;
}
