import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import { ADMIN_PAGE_SIZE, redirectIfPastLastPage, toQuery } from '@/tickets-portal/lib/list-params';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { formatInZone } from '@/tickets-portal/lib/zoned-time';
import { admissionLabel } from '@/tickets-portal/lib/side-events';

const STATUSES = ['draft', 'published', 'archived'] as const;
const tableWrap = 'overflow-x-auto rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const input = 'rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-400';

export default async function SideEventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; event?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const status = STATUSES.find((s) => s === sp.status);
  const eventSlug = sp.event?.trim() || undefined;
  const q = sp.q?.trim().slice(0, 100) || undefined;
  const filters = { status, event: eventSlug, q };

  let result: Paginated<AdminSideEvent> | null = null;
  let loadError: string | null = null;
  try {
    result = await ticketsApiGet<Paginated<AdminSideEvent>>(
      `/admin/side-events${toQuery({ page, limit: ADMIN_PAGE_SIZE, status, eventSlug, search: q })}`,
    );
    redirectIfPastLastPage('/tickets-command/side-events', page, ADMIN_PAGE_SIZE, result.total, filters);
  } catch (e) {
    unstable_rethrow(e);
    loadError = e instanceof Error ? e.message : 'Request failed';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Side events</h1>
          <p className="text-[15px] text-stone-500">
            Separately booked activities such as masterclasses, standalone or attached to a main event.
          </p>
        </header>
        <Link href={`/tickets-command/side-events/new${toQuery({ eventSlug })}`} className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800">
          New side event
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input aria-label="Search side events" name="q" defaultValue={q} placeholder="Search name or slug" className={input} maxLength={100} />
        <input aria-label="Main event slug" name="event" defaultValue={eventSlug} placeholder="Main event slug" className={`${input} font-mono`} />
        <select aria-label="Status" name="status" defaultValue={status ?? ''} className={`${input} capitalize`}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">Filter</button>
        {status || eventSlug || q ? <Link href="/tickets-command/side-events" className="text-sm text-stone-500 hover:underline">Clear</Link> : null}
      </form>

      {loadError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load side events</p>
          <p className="mt-2 text-sm">{loadError}</p>
          <p className="mt-2 text-sm">Update the filters above or clear them to try again.</p>
        </div>
      ) : null}
      {result ? <>
      <div className={tableWrap}>
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Name</th>
              <th className={th}>Main event</th>
              <th className={th}>Dates</th>
              <th className={th}>Admission</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${td} py-16 text-center text-stone-400`}>
                  {status || eventSlug || q ? 'No side events match these filters.' : 'No side events yet.'}
                </td>
              </tr>
            ) : (
              result.data.map((ev) => (
                <tr key={ev._id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/90">
                  <td className={`${td} font-medium text-stone-900`}>
                    <Link href={`/tickets-command/side-events/${ev._id}`} className="hover:underline">{ev.name}</Link>
                    <p className="font-mono text-[12px] font-normal text-stone-500">{ev.slug}</p>
                  </td>
                  <td className={`${td} text-[13px]`}>{ev.parent ? ev.parent.name : <span className="text-stone-400">Standalone</span>}</td>
                  <td className={`${td} text-[13px] text-stone-600`}>
                    {formatInZone(ev.startsAt, ev.timezone, false)} – {formatInZone(ev.endsAt, ev.timezone, false)}
                    <p className="text-[12px] text-stone-400">{ev.days.length} day{ev.days.length === 1 ? '' : 's'}</p>
                  </td>
                  <td className={`${td} text-[13px]`}>{admissionLabel(ev)}</td>
                  <td className={`${td} capitalize`}>{ev.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination basePath="/tickets-command/side-events" page={page} limit={ADMIN_PAGE_SIZE} total={result.total} params={filters} />
      </> : null}
    </div>
  );
}
