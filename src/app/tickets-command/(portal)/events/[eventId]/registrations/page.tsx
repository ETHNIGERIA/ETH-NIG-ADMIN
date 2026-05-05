import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { normalizeAdminRegistration } from '@/tickets-portal/lib/admin-registrations';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

function fmt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: AdminRegistration['status'] }) {
  const styles: Record<AdminRegistration['status'], string> = {
    pending: 'bg-amber-50 text-amber-900',
    confirmed: 'bg-emerald-50 text-emerald-800',
    cancelled: 'bg-stone-100 text-stone-600',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export default async function EventRegistrationsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const limit = 20;

  let event: AdminEvent;
  try {
    const raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
    event = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  const id = normalizeDocumentId(event._id);

  let tiers: AdminTicketTier[] = [];
  try {
    const p = await ticketsApiGet<Paginated<AdminTicketTier>>(
      `/admin/events/${id}/tiers?page=1&limit=100`,
    );
    tiers = p.data.map((t) => ({ ...t, _id: normalizeDocumentId(t._id) }));
  } catch {
    tiers = [];
  }

  const tierNameById = new Map(tiers.map((t) => [normalizeDocumentId(t._id), t.name]));

  let result: Paginated<AdminRegistration>;
  try {
    result = await ticketsApiGet<Paginated<AdminRegistration>>(
      `/admin/events/${id}/registrations?page=${page}&limit=${limit}`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load registrations';
    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/tickets-command/events/${id}`}
            className="text-[14px] text-stone-600 hover:text-stone-900"
          >
            ← Back to event
          </Link>
          <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">
            Registrations
          </h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load registrations</p>
          <p className="mt-2 text-[14px]">{message}</p>
        </div>
      </div>
    );
  }

  const rows = result.data.map((r) => normalizeAdminRegistration(r));
  const { pages, total } = result;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/tickets-command/events/${id}`}
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Back to event
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">Registrations</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">
          Checkouts for <span className="font-medium text-stone-800">{event.name}</span>. Confirm pending
          registrations or cancel them when needed.
        </p>
      </div>

      <div className={tableWrap}>
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Contact</th>
              <th className={th}>Tier</th>
              <th className={`${th} hidden sm:table-cell`}>Qty</th>
              <th className={th}>Status</th>
              <th className={`${th} hidden md:table-cell`}>Total</th>
              <th className={`${th} hidden lg:table-cell`}>Created</th>
              <th className={`${th} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={`${td} py-16 text-center text-stone-400`}>
                  No registrations for this event yet.
                </td>
              </tr>
            ) : (
              rows.map((reg) => {
                const rid = reg._id;
                const tierLabel = tierNameById.get(reg.tierId) ?? reg.tierId.slice(-6);
                return (
                  <tr key={rid} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={td}>
                      <Link
                        href={`/tickets-command/events/${id}/registrations/${rid}`}
                        className="font-medium text-stone-900 hover:underline"
                      >
                        {reg.email}
                      </Link>
                      {reg.name ? (
                        <p className="mt-0.5 text-[13px] text-stone-500">{reg.name}</p>
                      ) : null}
                    </td>
                    <td className={`${td} text-[13px] text-stone-600`}>{tierLabel}</td>
                    <td className={`${td} hidden sm:table-cell`}>{reg.quantity}</td>
                    <td className={td}>
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className={`${td} hidden text-[13px] md:table-cell`}>
                      {typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}
                    </td>
                    <td className={`${td} hidden text-[13px] text-stone-500 lg:table-cell`}>
                      {fmt(reg.createdAt)}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <Link
                        href={`/tickets-command/events/${id}/registrations/${rid}`}
                        className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
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
            Page {page} of {pages} · {total} total
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/tickets-command/events/${id}/registrations?page=${page - 1}`}
                className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md px-3 py-1.5 text-stone-300">Previous</span>
            )}
            {page < pages ? (
              <Link
                href={`/tickets-command/events/${id}/registrations?page=${page + 1}`}
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
