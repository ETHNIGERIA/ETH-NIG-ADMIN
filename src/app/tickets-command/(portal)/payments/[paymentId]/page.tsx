import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminPaymentDetail } from '@/tickets-portal/types/admin-payments';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { overviewEventHref, overviewRegistrationHref } from '@/tickets-portal/lib/overview-links';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';

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

function tierDisplay(raw: AdminPaymentDetail): string {
  const { tierId } = raw;
  if (tierId != null && typeof tierId === 'object' && 'name' in tierId) {
    return String((tierId as { name: string }).name);
  }
  return tierId != null ? normalizeDocumentId(tierId) : '—';
}

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;

  let raw: AdminPaymentDetail;
  try {
    raw = await ticketsApiGet<AdminPaymentDetail>(`/admin/payments/${paymentId}`);
  } catch {
    notFound();
  }

  const eventHref = overviewEventHref(raw.eventId);
  const registrationHref = overviewRegistrationHref(raw.eventId, raw.registrationId ?? null);

  let eventTitle = 'Event';
  if (raw.eventId != null && typeof raw.eventId === 'object' && 'name' in raw.eventId) {
    eventTitle = String((raw.eventId as { name: string }).name);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/tickets-command" className="text-[14px] text-stone-600 hover:text-stone-900">
          ← Overview
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">Payment</h1>
        <p className="mt-2 text-[15px] text-stone-600">
          {formatMinorToNgn(raw.amountMinor)} ·{' '}
          <span className="uppercase">{raw.currency}</span> · {raw.providerCode} ·{' '}
          <span className="capitalize">{raw.status}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-6">
        <h2 className="text-[15px] font-semibold text-stone-900">Details</h2>
        <dl className="mt-4 grid gap-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">Amount</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-stone-900">
              {formatMinorToNgn(raw.amountMinor)} {raw.currency.toUpperCase()}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Provider</dt>
            <dd className="mt-0.5 font-medium text-stone-900">{raw.providerCode}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Status</dt>
            <dd className="mt-0.5 capitalize text-stone-900">{raw.status}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Tier</dt>
            <dd className="mt-0.5 text-stone-900">{tierDisplay(raw)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Created</dt>
            <dd className="mt-0.5 text-stone-700">{fmt(raw.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Updated</dt>
            <dd className="mt-0.5 text-stone-700">{fmt(raw.updatedAt)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-stone-100 pt-6">
          {eventHref ? (
            <Link
              href={eventHref}
              className="text-[14px] font-medium text-stone-800 underline-offset-4 hover:underline"
            >
              Open event: {eventTitle}
            </Link>
          ) : null}
          {registrationHref ? (
            <Link
              href={registrationHref}
              className="text-[14px] font-medium text-stone-800 underline-offset-4 hover:underline"
            >
              Open registration
            </Link>
          ) : (
            <span className="text-[14px] text-stone-400">No registration linked</span>
          )}
        </div>
      </div>
    </div>
  );
}
