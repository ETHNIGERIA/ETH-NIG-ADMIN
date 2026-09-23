import { redirect } from 'next/navigation';

/** Legacy route: this view now lives in the event page's "discounts" tab. */
export default async function LegacyDiscountsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/tickets-command/events/${encodeURIComponent(eventId)}?tab=discounts`);
}
