import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type { AdminFormField } from '@/tickets-portal/types/admin-form-fields';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { EventDetailForms } from '@/tickets-portal/components/events/EventDetailForms';
import { fetchAllEventFormFields } from '@/tickets-portal/data/event-form-fields-read';

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

  let tiers: AdminTicketTier[] = [];
  try {
    const p = await ticketsApiGet<Paginated<AdminTicketTier>>(
      `/admin/events/${id}/tiers?page=1&limit=100`,
    );
    tiers = p.data.map((t) => ({ ...t, _id: normalizeDocumentId(t._id) }));
  } catch {
    tiers = [];
  }

  let formFields: AdminFormField[] = [];
  let formFieldsLoadError: string | null = null;
  try {
    const rawFields = await fetchAllEventFormFields(id);
    formFields = rawFields.map((f) => ({
      ...f,
      _id: normalizeDocumentId(f._id),
      eventId: normalizeDocumentId(f.eventId),
    }));
  } catch (e) {
    formFieldsLoadError = e instanceof Error ? e.message : 'Could not load registration fields.';
  }

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
      <EventDetailForms
        event={event}
        eventId={id}
        tiers={tiers}
        formFields={formFields}
        formFieldsLoadError={formFieldsLoadError}
      />
    </div>
  );
}
