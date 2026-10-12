import Link from 'next/link';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { EventConsoleNav } from '@/tickets-portal/components/events-v2/EventConsoleNav';
import { EVENT_CONSOLE, formatEventDate, loadConsoleEvent } from '@/tickets-portal/lib/event-console';

export default async function EventConsoleLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await loadConsoleEvent(eventId);
  const statusStyle = event.status === 'published'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : event.status === 'archived'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-stone-200 bg-stone-100 text-stone-700';

  return (
    <div className="event-console-v2 space-y-6">
      <header className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        <div className="px-5 py-6 sm:px-8 sm:py-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
          <Link href={EVENT_CONSOLE} prefetch={false} className="font-semibold text-blue-700 hover:text-blue-900">Event Console V2</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-600">{event.name}</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[32px]">{event.name}</h1>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle}`}>{event.status}</span>
            </div>
            <p className="mt-2 break-all font-mono text-xs text-slate-500">{event.slug}</p>
            <p className="mt-3 text-sm text-slate-600">{formatEventDate(event.startsAt, event.timezone)} <span className="mx-1 text-slate-400">→</span> {formatEventDate(event.endsAt, event.timezone)} <span className="text-slate-500">· {event.timezone ?? 'Africa/Lagos'}</span></p>
          </div>
          <Link href={`/tickets-command/events/${event._id}`} prefetch={false} className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Current view <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        </div>
        <EventConsoleNav eventId={event._id} />
      </header>
      <main className="min-w-0 pb-12">{children}</main>
    </div>
  );
}
