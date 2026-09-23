import { redirect } from 'next/navigation';

/** Legacy route: this view now lives in the event page's "fields" tab. */
export default async function LegacyFieldsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/tickets-command/events/${encodeURIComponent(eventId)}?tab=fields`);
}
