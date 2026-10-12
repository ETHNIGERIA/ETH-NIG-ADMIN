import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { loadConsoleEvent, eventConsoleHref } from '@/tickets-portal/lib/event-console';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import RegistrationDetailPage from '@/tickets-portal/components/events/RegistrationDetailPage';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';

export default async function SideEventRegistration({ params }: { params: Promise<{ eventId: string; itemId: string; registrationId: string }> }) {
  const { eventId, itemId, registrationId } = await params;
  const event = await loadConsoleEvent(eventId);
  if (!/^[a-f0-9]{24}$/i.test(itemId) || !/^[a-f0-9]{24}$/i.test(registrationId)) notFound();
  let sideEvent: AdminSideEvent;
  try { sideEvent = await ticketsApiGet<AdminSideEvent>(`/admin/side-events/${itemId}`); }
  catch (error) { unstable_rethrow(error); notFound(); }
  if (sideEvent.parent?.slug !== event.slug || normalizeDocumentId(sideEvent.parent._id) !== eventId) notFound();
  return <RegistrationDetailPage params={Promise.resolve({ eventId: itemId, registrationId })} sideEvent consoleEventPath={eventConsoleHref(eventId, `side-events/${itemId}`)} />;
}
