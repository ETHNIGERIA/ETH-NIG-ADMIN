import { redirect } from 'next/navigation';
import { toQuery } from '@/tickets-portal/lib/list-params';

/** Legacy route: this view now lives in the event page's "registrations" tab. */
export default async function LegacyRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { eventId } = await params;
  const { page } = await searchParams;
  redirect(`/tickets-command/events/${encodeURIComponent(eventId)}${toQuery({ tab: 'registrations', page })}`);
}
