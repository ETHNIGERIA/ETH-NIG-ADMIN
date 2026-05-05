import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';
import type { AdminDiscount } from '@/tickets-portal/types/admin-discounts';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { EventDiscountsManager } from '@/tickets-portal/components/discounts/EventDiscountsManager';

export default async function EventDiscountsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const id = normalizeDocumentId(eventId);

  let event: AdminEvent;
  try {
    const raw = await ticketsApiGet<AdminEvent>(`/admin/events/${id}`);
    event = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  let discounts: AdminDiscount[] = [];
  let loadError: string | null = null;

  try {
    const raw = await ticketsApiGet<AdminDiscount[]>(
      `/admin/discounts?eventId=${encodeURIComponent(id)}`,
    );
    discounts = raw.map((d) => ({
      ...d,
      _id: normalizeDocumentId(d._id),
      eventId: d.eventId != null ? normalizeDocumentId(String(d.eventId)) : d.eventId,
      validFrom: typeof d.validFrom === 'string' ? d.validFrom : new Date(d.validFrom).toISOString(),
      validUntil: typeof d.validUntil === 'string' ? d.validUntil : new Date(d.validUntil).toISOString(),
    }));
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Could not load discounts.';
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-3 text-[13px] text-stone-600">
          <Link href={`/tickets-command/events/${id}`} className="hover:text-stone-900 hover:underline">
            ← {event.name}
          </Link>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Event discounts</h1>
        <p className="text-[15px] text-stone-600">{event.name}</p>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <EventDiscountsManager eventId={id} eventName={event.name} discounts={discounts} />
      )}
    </div>
  );
}
