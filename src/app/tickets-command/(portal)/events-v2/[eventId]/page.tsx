import Link from 'next/link';
import { ArrowUpRight, CalendarDays, ClipboardList, CreditCard, Mic, Tag, Ticket, UsersRound, Workflow } from 'lucide-react';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { SectionHeader, consoleCard } from '@/tickets-portal/components/events-v2/SectionHeader';
import { eventConsoleHref, loadConsoleEvent } from '@/tickets-portal/lib/event-console';
import { toQuery } from '@/tickets-portal/lib/list-params';
import type { Paginated } from '@/tickets-portal/types/admin-events';

export const dynamic = 'force-dynamic';

async function count(path: string): Promise<number | null> {
  try {
    const result = await ticketsApiGet<Paginated<unknown>>(path);
    return typeof result.total === 'number' ? result.total : null;
  } catch {
    return null;
  }
}

export default async function EventConsoleOverview({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await loadConsoleEvent(eventId);
  const [tiersCount, regsCount, promoCount, sideCount, speakerCount, speakerAppCount, sponsorAppCount, paymentCount] = await Promise.all([
    count(`/admin/events/${eventId}/tiers?page=1&limit=1`),
    count(`/admin/events/${eventId}/registrations?page=1&limit=1`),
    count(`/admin/promo-codes${toQuery({ eventId, owner: 'none', page: 1, limit: 1 })}`),
    count(`/admin/side-events${toQuery({ eventSlug: event.slug, page: 1, limit: 1 })}`),
    count(`/admin/public-speakers${toQuery({ event: event.slug, page: 1, limit: 1 })}`),
    count(`/admin/speaker-applications${toQuery({ event: event.slug, page: 1, limit: 1 })}`),
    count(`/admin/sponsor-applications${toQuery({ event: event.slug, page: 1, limit: 1 })}`),
    count(`/admin/payments${toQuery({ eventId, page: 1, limit: 1 })}`),
  ]);
  const sections = [
    { section: 'tickets', label: 'Ticket tiers', count: tiersCount, icon: Ticket, note: 'Pricing, capacity and benefits', tone: 'bg-blue-100 text-blue-700' },
    { section: 'registrations', label: 'Registrations', count: regsCount, icon: UsersRound, note: 'Attendees and checkouts', tone: 'bg-emerald-100 text-emerald-700' },
    { section: 'payments', label: 'Payments', count: paymentCount, icon: CreditCard, note: 'Payment activity for this event', tone: 'bg-violet-100 text-violet-700' },
    { section: 'promotions', label: 'Promo codes', count: promoCount, icon: Tag, note: 'Event-owned offers', tone: 'bg-rose-100 text-rose-700' },
    { section: 'side-events', label: 'Side events', count: sideCount, icon: CalendarDays, note: 'Attached sessions and activities', tone: 'bg-amber-100 text-amber-700' },
    { section: 'speakers', label: 'Public speakers', count: speakerCount, icon: Mic, note: 'Visible and hidden profiles', tone: 'bg-cyan-100 text-cyan-700' },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Event workspace" title="Overview" description="A focused view of this event’s operational areas. Each section has its own page for details and actions." />

      {event.status === 'draft' || tiersCount === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <h3 className="text-sm font-semibold text-amber-950">Before registrations open</h3>
          <p className="mt-1 text-sm text-amber-900">{tiersCount === 0 ? 'Add at least one ticket tier. ' : ''}{event.status === 'draft' ? 'Publish the event when its setup is ready.' : ''}</p>
          <div className="mt-3 flex gap-4 text-sm font-medium text-amber-950">
            {tiersCount === 0 ? <Link href={eventConsoleHref(eventId, 'tickets')} className="underline underline-offset-2">Review tickets</Link> : null}
            {event.status === 'draft' ? <Link href={eventConsoleHref(eventId, 'settings')} className="underline underline-offset-2">Event settings</Link> : null}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="mb-4 text-sm font-semibold text-stone-900">Operations</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map(({ section, label, count: value, icon: Icon, note, tone }) => (
            <Link key={section} href={eventConsoleHref(eventId, section)} prefetch={false} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-700" />
              </div>
              <p className="mt-5 text-[30px] font-bold tabular-nums tracking-tight text-slate-950">{value ?? '—'}</p>
              <h4 className="mt-1 text-sm font-bold text-slate-900">{label}</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{value === null ? 'Count unavailable · open section to retry' : note}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${consoleCard} grid gap-4 sm:grid-cols-3`}>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-stone-900">Checkout form</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">Questions asked after a ticket is selected.</p>
          <Link href={eventConsoleHref(eventId, 'fields')} className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-blue-700 hover:underline">Manage form <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="flex flex-col border-t border-stone-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <h3 className="text-sm font-semibold text-stone-900">Program eligibility</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">Choose ticket tiers for hackathon and pitch access.</p>
          <Link href={eventConsoleHref(eventId, 'programs')} className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-blue-700 hover:underline">Manage access <Workflow className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="flex flex-col border-t border-stone-100 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <h3 className="text-sm font-semibold text-stone-900">People applications</h3>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">{speakerAppCount ?? '—'} speaker · {sponsorAppCount ?? '—'} sponsor</p>
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-4 text-sm font-medium text-blue-700">
            <Link href={eventConsoleHref(eventId, 'applications/speakers')} className="inline-flex items-center gap-1 hover:underline">Speakers <ClipboardList className="h-3.5 w-3.5" /></Link>
            <Link href={eventConsoleHref(eventId, 'applications/sponsors')} className="inline-flex items-center gap-1 hover:underline">Sponsors <ClipboardList className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
