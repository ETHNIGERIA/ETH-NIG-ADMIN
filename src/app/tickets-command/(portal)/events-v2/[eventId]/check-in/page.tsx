import { ticketsApiGet } from "@/tickets-portal/lib/tickets-api.server";
import type { AdminEvent } from "@/tickets-portal/types/admin-events";
import { EventCheckIn } from "@/tickets-portal/components/events-v2/EventCheckIn";
export const dynamic = "force-dynamic";
export default async function CheckInPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await ticketsApiGet<AdminEvent>(
    `/admin/events/${encodeURIComponent(eventId)}`,
  );
  const timezone = event.timezone ?? "Africa/Lagos";
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(event.startsAt));
  const days = event.days?.length
    ? event.days
    : [{ key: dateKey, date: event.startsAt, label: "Event day" }];
  return <EventCheckIn eventId={eventId} days={days} timezone={timezone} />;
}
