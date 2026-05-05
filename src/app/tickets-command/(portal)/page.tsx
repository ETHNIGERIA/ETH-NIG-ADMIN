import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminOverviewResponse } from '@/tickets-portal/types/admin-overview';
import { OverviewView } from '@/tickets-portal/components/overview/OverviewView';

export default async function TicketsOverviewPage() {
  try {
    const data = await ticketsApiGet<AdminOverviewResponse>('/admin/overview');
    return <OverviewView data={data} />;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-[15px] font-semibold">Could not load overview</p>
        <p className="mt-2 text-[14px] leading-relaxed text-red-800/90">{message}</p>
        <p className="mt-4 text-[13px] text-red-700/80">
          Ensure{' '}
          <code className="rounded border border-red-200 bg-white px-1.5 py-0.5 text-[12px]">
            TICKETS_API_BASE_URL
          </code>{' '}
          is set and the API is reachable from this server.
        </p>
      </div>
    );
  }
}
