import Link from 'next/link';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';

function fmt(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = 20;

  let result: Paginated<AdminEvent>;
  try {
    result = await ticketsApiGet<Paginated<AdminEvent>>(
      `/admin/events?page=${page}&limit=${limit}`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load events';
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
        <p className="font-semibold">Could not load events</p>
        <p className="mt-2 text-[14px]">{message}</p>
      </div>
    );
  }

  const { data: events, pages, total } = result;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="space-y-1">
          <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Events</h1>
          <p className="text-[15px] text-stone-500">
            {total === 0 ? 'No events yet.' : `${total} event${total === 1 ? '' : 's'}`}
          </p>
        </header>
        <Link
          href="/tickets-command/events/new"
          className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
        >
          New event
        </Link>
      </div>

      <div className={tableWrap}>
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Name</th>
              <th className={th}>Slug</th>
              <th className={th}>Status</th>
              <th className={`${th} hidden md:table-cell`}>Starts</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className={`${td} py-16 text-center text-stone-400`}>
                  Create your first event to get started.
                </td>
              </tr>
            ) : (
              events.map((ev) => {
                const id = normalizeDocumentId(ev._id);
                return (
                  <tr key={id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={`${td} font-medium text-stone-900`}>
                      <Link
                        href={`/tickets-command/events/${id}`}
                        className="hover:underline"
                      >
                        {ev.name}
                      </Link>
                    </td>
                    <td className={`${td} font-mono text-[13px] text-stone-600`}>{ev.slug}</td>
                    <td className={`${td} capitalize`}>{ev.status}</td>
                    <td className={`${td} hidden text-[13px] text-stone-500 md:table-cell`}>
                      {fmt(ev.startsAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-4 text-[14px] text-stone-600">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/tickets-command/events?page=${page - 1}`}
                className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md px-3 py-1.5 text-stone-300">Previous</span>
            )}
            {page < pages ? (
              <Link
                href={`/tickets-command/events?page=${page + 1}`}
                className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-md px-3 py-1.5 text-stone-300">Next</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
