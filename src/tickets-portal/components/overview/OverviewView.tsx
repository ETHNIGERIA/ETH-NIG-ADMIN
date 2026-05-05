import type { AdminOverviewResponse } from '@/tickets-portal/types/admin-overview';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200/90 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-[13px] font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight text-stone-900">
        {value}
      </p>
      {sub ? <p className="mt-2 text-[13px] leading-snug text-stone-500">{sub}</p> : null}
    </div>
  );
}

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

export function OverviewView({ data }: { data: AdminOverviewResponse }) {
  const { totals: t, recent } = data;

  return (
    <div className="space-y-12">
      <header className="space-y-1">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Overview</h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-stone-500">
          Totals and recent activity from your ticketing API.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Totals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Events"
            value={t.events.total}
            sub={`${t.events.published} published · ${t.events.draft} draft`}
          />
          <StatCard
            label="Registrations"
            value={t.registrations.total}
            sub={`${t.registrations.confirmed} confirmed`}
          />
          <StatCard
            label="Payments"
            value={t.payments.total}
            sub={`${t.payments.succeeded} succeeded · ${formatMinorToNgn(t.payments.amountMinor)}`}
          />
          <StatCard label="Tickets issued" value={t.tickets.total} sub={`${t.tickets.active} active`} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tiers" value={t.ticketTiers.total} sub={`${t.ticketTiers.active} active`} />
          <StatCard
            label="Registration value"
            value={formatMinorToNgn(t.registrations.finalAmountMinor)}
            sub={`Discounts ${formatMinorToNgn(t.registrations.discountAmountMinor)}`}
          />
          <StatCard
            label="Promo codes"
            value={t.promoCodes.total}
            sub={`${t.promoCodes.usageCount} uses`}
          />
          <StatCard
            label="Influencer payouts"
            value={t.influencerPayouts.total}
            sub={`${formatMinorToNgn(t.influencerPayouts.payoutAmount)} total`}
          />
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">
            Recent events
          </h2>
          <div className={tableWrap}>
            <table className="w-full min-w-[280px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Event</th>
                  <th className={th}>Status</th>
                  <th className={`${th} hidden sm:table-cell`}>Regs</th>
                </tr>
              </thead>
              <tbody>
                {recent.events.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`${td} py-10 text-center text-stone-400`}>
                      No events yet
                    </td>
                  </tr>
                ) : (
                  recent.events.map((ev) => (
                    <tr key={ev.slug + ev.startsAt} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                      <td className={`${td} max-w-[200px] truncate font-medium text-stone-900`}>
                        {ev.name}
                      </td>
                      <td className={`${td} capitalize`}>{ev.status}</td>
                      <td className={`${td} hidden tabular-nums sm:table-cell`}>
                        {ev.registrationCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">
            Recent transactions
          </h2>
          <div className={tableWrap}>
            <table className="w-full min-w-[280px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Amount</th>
                  <th className={th}>Status</th>
                  <th className={`${th} hidden md:table-cell`}>When</th>
                </tr>
              </thead>
              <tbody>
                {recent.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`${td} py-10 text-center text-stone-400`}>
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  recent.transactions.map((tx, i) => (
                    <tr
                      key={`${tx.createdAt ?? i}-${i}`}
                      className={`border-b border-stone-100 last:border-0 ${rowHover}`}
                    >
                      <td className={`${td} tabular-nums font-medium text-stone-900`}>
                        {formatMinorToNgn(tx.amountMinor)}
                      </td>
                      <td className={`${td} capitalize`}>{tx.status}</td>
                      <td className={`${td} hidden text-[13px] text-stone-500 md:table-cell`}>
                        {fmtDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">
          Recent registrations
        </h2>
        <div className={`${tableWrap} overflow-x-auto`}>
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Email</th>
                <th className={th}>Event</th>
                <th className={th}>Tier</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.registrations.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${td} py-10 text-center text-stone-400`}>
                    No registrations yet
                  </td>
                </tr>
              ) : (
                recent.registrations.map((r, i) => (
                  <tr
                    key={`${r.email}-${i}`}
                    className={`border-b border-stone-100 last:border-0 ${rowHover}`}
                  >
                    <td className={`${td} max-w-[160px] truncate font-medium text-stone-900`}>
                      {r.email}
                    </td>
                    <td className={`${td} max-w-[140px] truncate`}>{r.eventId.name}</td>
                    <td className={`${td} max-w-[120px] truncate`}>{r.tierId.name}</td>
                    <td className={`${td} capitalize`}>{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
