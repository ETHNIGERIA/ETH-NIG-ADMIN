import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { EventDetailForms } from '@/tickets-portal/components/events/EventDetailForms';

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let raw: AdminEvent;
  try {
    raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
  } catch {
    notFound();
  }

  const id = normalizeDocumentId(raw._id);
  const event: AdminEvent = { ...raw, _id: id };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/tickets-command/events"
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Events
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">{event.name}</h1>
      </div>
      <EventDetailForms event={event} eventId={id} />
    </div>
  );
}
