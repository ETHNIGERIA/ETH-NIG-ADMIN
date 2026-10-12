import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { ArrowRight, CalendarDays, Plus } from 'lucide-react';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { formatEventDate, EVENT_CONSOLE } from '@/tickets-portal/lib/event-console';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';

export const dynamic = 'force-dynamic';

export default async function EventConsoleIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: rawPage } = await searchParams;
  const n = Number.parseInt(rawPage ?? '', 10);
  const page = Number.isFinite(n) && n > 0 ? n : 1;
  let data: Paginated<AdminEvent>;
  try {
    data = await ticketsApiGet<Paginated<AdminEvent>>(`/admin/events?page=${page}&limit=20`);
  } catch (error) {
    unstable_rethrow(error);
    return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Could not load events. {error instanceof Error ? error.message : 'Try again.'}</div>;
  }
  const events = data.data.filter((event) => event.kind !== 'side');

  return (
    <div className="event-console-v2 space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Event operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Event Console V2</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">Open an event to manage its setup, tickets, attendees, promotions, side events and people in one workspace.</p>
        </div>
        <Link href="/tickets-command/events/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> New event</Link>
      </header>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-stone-900">Main events</h2>
          <span className="text-xs text-stone-500">{data.total} total records</span>
        </div>
        {events.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-stone-300" />
            <p className="mt-3 text-sm font-semibold text-stone-800">No main events on this page</p>
            <p className="mt-1 text-xs text-stone-500">Create an event or browse another page.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {events.map((event) => {
              const id = normalizeDocumentId(event._id);
              return (
                <Link key={id} href={`${EVENT_CONSOLE}/${id}`} prefetch={false} className="group grid grid-cols-[44px_minmax(0,1fr)_16px] items-center gap-4 px-5 py-5 transition-colors hover:bg-slate-50 sm:px-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><CalendarDays className="h-5 w-5" /></span>
                  <span className="min-w-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
                    <span className="block min-w-0 flex-1">
                      <span className="block truncate text-base font-bold text-slate-900 group-hover:text-blue-700">{event.name}</span>
                      <span className="mt-1 block truncate font-mono text-xs text-slate-500">{event.slug}</span>
                    </span>
                    <span className="mt-3 flex flex-wrap items-center gap-3 sm:mt-0 sm:w-[270px] sm:shrink-0 sm:flex-nowrap sm:justify-between">
                      <span className="text-xs text-slate-500 sm:w-[150px]">{formatEventDate(event.startsAt, event.timezone)}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">{event.status}</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-700" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <Pagination basePath={EVENT_CONSOLE} page={page} limit={20} total={data.total} />
    </div>
  );
}
