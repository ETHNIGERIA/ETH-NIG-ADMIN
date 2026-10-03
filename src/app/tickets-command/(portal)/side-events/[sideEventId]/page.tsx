import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import { normalizeAdminRegistration } from '@/tickets-portal/lib/admin-registrations';
import { redirectIfPastLastPage } from '@/tickets-portal/lib/list-params';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { formatInZone } from '@/tickets-portal/lib/zoned-time';
import { admissionLabel, SIDE_EVENT_CURRENCIES } from '@/tickets-portal/lib/side-events';
import { getBuyerSite } from '@/tickets-portal/auth/server-config';
import { SideEventEditor } from '@/tickets-portal/components/side-events/SideEventEditor';
import { SideEventCheckIn } from '@/tickets-portal/components/side-events/SideEventCheckIn';

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'check-in', label: 'Check-in' },
] as const;
type TabKey = (typeof TABS)[number]['key'];
const REG_PAGE_SIZE = 20;

const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';

export default async function SideEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sideEventId: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { sideEventId } = await params;
  const sp = await searchParams;
  const tab: TabKey = TABS.find((t) => t.key === sp.tab)?.key ?? 'details';
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  let event: AdminSideEvent;
  try {
    event = await ticketsApiGet<AdminSideEvent>(`/admin/side-events/${encodeURIComponent(sideEventId)}`);
  } catch (e) {
    unstable_rethrow(e);
    notFound();
  }

  let regs: Paginated<AdminRegistration> | null = null;
  let regError: string | null = null;
  if (tab === 'registrations') {
    try {
      // Existing registration list, scoped to this side event's id.
      regs = await ticketsApiGet<Paginated<AdminRegistration>>(
        `/admin/events/${event._id}/registrations?page=${page}&limit=${REG_PAGE_SIZE}`,
      );
      redirectIfPastLastPage(`/tickets-command/side-events/${event._id}`, page, REG_PAGE_SIZE, regs.total, { tab });
    } catch (e) {
      unstable_rethrow(e);
      regError = e instanceof Error ? e.message : 'Could not load registrations.';
    }
  }

  const buyerSite = getBuyerSite();
  const publicUrl = buyerSite ? `${buyerSite.url}/side-events/${event.slug}` : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tickets-command/side-events" className="text-[14px] text-stone-600 hover:text-stone-900">← Side events</Link>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-stone-900">{event.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-stone-500">
          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[12px] font-medium capitalize text-stone-700">{event.status}</span>
          <span>{event.parent ? <>Part of <strong className="text-stone-800">{event.parent.name}</strong></> : 'Standalone'}</span>
          <span>{admissionLabel(event)} · covers all {event.days.length} day{event.days.length === 1 ? '' : 's'}</span>
          {event.admission?.capacity != null ? <span>{event.admission.soldCount}/{event.admission.capacity} seats taken</span> : null}
        </div>
        {event.status === 'published' && publicUrl ? (
          <p className="mt-2 text-[13px]">
            Public page: <a href={publicUrl} target="_blank" rel="noreferrer" className="font-mono text-stone-800 underline underline-offset-2">{publicUrl}</a>
          </p>
        ) : null}
      </div>

      <div className="flex gap-6 overflow-x-auto border-b border-stone-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/tickets-command/side-events/${event._id}?tab=${t.key}`}
            className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium ${
              tab === t.key ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === 'details' ? (
        <SideEventEditor key={`${event._id}:${event.version}`} event={event} currencies={SIDE_EVENT_CURRENCIES} />
      ) : null}

      {tab === 'registrations' ? (
        regError ? (
          <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">{regError}</div>
        ) : regs ? (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-stone-200/90 bg-white">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className={th}>Contact</th>
                    <th className={th}>Status</th>
                    <th className={th}>Total</th>
                    <th className={th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.data.length === 0 ? (
                    <tr><td colSpan={4} className={`${td} py-16 text-center text-stone-400`}>No registrations yet.</td></tr>
                  ) : (
                    regs.data.map((r) => {
                      const reg = normalizeAdminRegistration(r);
                      return (
                        <tr key={reg._id} className="border-b border-stone-100 last:border-0">
                          <td className={td}>
                            <Link href={`/tickets-command/side-events/${event._id}/registrations/${reg._id}`} className="font-medium text-stone-900 hover:underline">{reg.email}</Link>
                            {reg.name ? <p className="text-[13px] text-stone-500">{reg.name}</p> : null}
                          </td>
                          <td className={`${td} capitalize`}>{reg.status}</td>
                          <td className={`${td} text-[13px]`}>{typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}</td>
                          <td className={`${td} text-[13px] text-stone-500`}>{formatInZone(reg.createdAt, event.timezone)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination basePath={`/tickets-command/side-events/${event._id}`} page={page} limit={REG_PAGE_SIZE} total={regs.total} params={{ tab }} />
          </div>
        ) : null
      ) : null}

      {tab === 'check-in' ? (
        <div className="space-y-4">
          <p className="max-w-2xl text-[14px] text-stone-600">
            Only passes for <strong>{event.name}</strong> are accepted; main-event tickets are rejected. Each pass checks in once per day. A second scan the same day shows “already checked in”.
          </p>
          <SideEventCheckIn eventId={event._id} days={event.days} timezone={event.timezone} />
        </div>
      ) : null}
    </div>
  );
}
