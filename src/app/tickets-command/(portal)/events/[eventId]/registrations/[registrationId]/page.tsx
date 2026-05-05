import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type { AdminRegistration, AdminTicket } from '@/tickets-portal/types/admin-registrations';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { normalizeAdminRegistration, normalizeAdminTicket } from '@/tickets-portal/lib/admin-registrations';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { RegistrationDetailActions } from '@/tickets-portal/components/events/RegistrationDetailActions';

const card =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';

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

function formatFormValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
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

function TicketStatusBadge({ status }: { status: AdminTicket['status'] }) {
  const styles: Record<AdminTicket['status'], string> = {
    active: 'bg-emerald-50 text-emerald-800',
    used: 'bg-stone-100 text-stone-700',
    cancelled: 'bg-red-50 text-red-900',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; registrationId: string }>;
}) {
  const { eventId, registrationId } = await params;

  let event: AdminEvent;
  try {
    const raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
    event = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  const eventNormalizedId = normalizeDocumentId(event._id);

  let rawReg: AdminRegistration;
  try {
    rawReg = await ticketsApiGet<AdminRegistration>(
      `/admin/events/${eventNormalizedId}/registrations/${registrationId}`,
    );
  } catch {
    notFound();
  }

  const reg = normalizeAdminRegistration(rawReg);
  if (reg.eventId !== eventNormalizedId) {
    notFound();
  }

  let tiers: AdminTicketTier[] = [];
  try {
    const p = await ticketsApiGet<Paginated<AdminTicketTier>>(
      `/admin/events/${eventNormalizedId}/tiers?page=1&limit=100`,
    );
    tiers = p.data.map((t) => ({ ...t, _id: normalizeDocumentId(t._id) }));
  } catch {
    tiers = [];
  }

  const tier = tiers.find((t) => normalizeDocumentId(t._id) === reg.tierId);

  let tickets: AdminTicket[] = [];
  try {
    const rawTickets = await ticketsApiGet<AdminTicket[]>(
      `/admin/events/${eventNormalizedId}/registrations/${registrationId}/tickets`,
    );
    tickets = Array.isArray(rawTickets) ? rawTickets.map(normalizeAdminTicket) : [];
  } catch {
    tickets = [];
  }

  const formEntries = Object.entries(reg.formData ?? {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/tickets-command/events/${eventNormalizedId}/registrations`}
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← All registrations
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">{reg.email}</h1>
            {reg.name ? <p className="mt-1 text-[15px] text-stone-600">{reg.name}</p> : null}
            <p className="mt-2 text-[13px] text-stone-500">
              Event:{' '}
              <Link href={`/tickets-command/events/${eventNormalizedId}`} className="hover:underline">
                {event.name}
              </Link>
            </p>
          </div>
          <StatusBadge status={reg.status} />
        </div>
      </div>

      <RegistrationDetailActions
        eventId={eventNormalizedId}
        registrationId={reg._id}
        status={reg.status}
      />

      <div className={`${card} p-5 sm:p-6`}>
        <h2 className="text-[15px] font-semibold text-stone-900">Order summary</h2>
        <dl className="mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Tier</dt>
            <dd className="mt-0.5 font-medium text-stone-900">{tier?.name ?? reg.tierId}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Quantity</dt>
            <dd className="mt-0.5 font-medium text-stone-900">{reg.quantity}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Original</dt>
            <dd className="mt-0.5 text-stone-800">
              {typeof reg.originalAmount === 'number' ? formatMinorToNgn(reg.originalAmount) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Discount</dt>
            <dd className="mt-0.5 text-stone-800">
              {reg.discountCode ? (
                <span className="font-mono text-[13px]">{reg.discountCode}</span>
              ) : (
                '—'
              )}
              {typeof reg.discountAmount === 'number' && reg.discountAmount > 0 ? (
                <span className="ml-2 text-stone-600">({formatMinorToNgn(reg.discountAmount)})</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Final total</dt>
            <dd className="mt-0.5 font-semibold text-stone-900">
              {typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Created</dt>
            <dd className="mt-0.5 text-stone-700">{fmt(reg.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className={`${card} p-5 sm:p-6`}>
        <h2 className="text-[15px] font-semibold text-stone-900">Registration answers</h2>
        {formEntries.length === 0 ? (
          <p className="mt-4 text-[14px] text-stone-500">No custom field answers stored.</p>
        ) : (
          <dl className="mt-4 space-y-3 text-[14px]">
            {formEntries.map(([key, val]) => (
              <div key={key} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <dt className="font-mono text-[12px] text-stone-500">{key}</dt>
                <dd className="mt-1 text-stone-800">{formatFormValue(val)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className={card}>
        <div className="border-b border-stone-100 px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-semibold text-stone-900">Tickets</h2>
          <p className="mt-1 text-[13px] text-stone-500">
            {tickets.length === 0 ? 'No ticket rows returned for this registration.' : `${tickets.length} ticket(s)`}
          </p>
        </div>
        {tickets.length > 0 ? (
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Code</th>
                <th className={`${th} hidden sm:table-cell`}>Attendee</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-b border-stone-100 last:border-0">
                  <td className={`${td} font-mono text-[13px]`}>{t.code}</td>
                  <td className={`${td} hidden text-[13px] text-stone-600 sm:table-cell`}>
                    {t.attendeeName || t.attendeeEmail ? (
                      <>
                        {t.attendeeName ?? '—'}
                        {t.attendeeEmail ? (
                          <span className="mt-0.5 block text-stone-500">{t.attendeeEmail}</span>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={td}>
                    <TicketStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
