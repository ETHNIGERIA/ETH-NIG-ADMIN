import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';
import type { AdminFormField } from '@/tickets-portal/types/admin-form-fields';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { FormFieldsManager } from '@/tickets-portal/components/events/FormFieldsManager';
import { fetchAllEventFormFields } from '@/tickets-portal/data/event-form-fields-read';

function sortFormFields(fields: AdminFormField[]): AdminFormField[] {
  return [...fields].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );
}

export default async function EventFormFieldsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let event: AdminEvent;
  try {
    const raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
    event = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  const id = normalizeDocumentId(event._id);

  let fields: AdminFormField[] = [];
  let fieldsLoadError: string | null = null;
  try {
    const raw = await fetchAllEventFormFields(id);
    fields = sortFormFields(
      raw.map((f) => ({
        ...f,
        _id: normalizeDocumentId(f._id),
        eventId: normalizeDocumentId(f.eventId),
      })),
    );
  } catch (e) {
    fieldsLoadError = e instanceof Error ? e.message : 'Could not load registration fields.';
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/tickets-command/events/${id}`}
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Back to event
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">Registration fields</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">
          Questions collected during checkout for <span className="font-medium text-stone-800">{event.name}</span>.
          Order follows sort order; keys must stay stable once you start receiving answers.
        </p>
      </div>

      <FormFieldsManager eventId={id} fields={fields} fieldsLoadError={fieldsLoadError} />
    </div>
  );
}
