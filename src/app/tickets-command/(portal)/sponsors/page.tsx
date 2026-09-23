import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { CollabApplicationsManager } from '@/tickets-portal/components/collab-applications/CollabApplicationsManager';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { unstable_rethrow } from 'next/navigation';
import {
  ADMIN_PAGE_SIZE,
  parseListParams,
  redirectIfPastLastPage,
  toQuery,
  type ListSearchParams,
} from '@/tickets-portal/lib/list-params';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import {
  COLLAB_APPLICATION_STATUSES,
  type CollabApplicationPage,
  type SponsorApplication,
} from '@/tickets-portal/types/admin-collab-applications';

export const dynamic = 'force-dynamic';

export default async function SponsorsPage({ searchParams }: { searchParams: Promise<ListSearchParams> }) {
  const { page, status, event } = parseListParams(await searchParams, COLLAB_APPLICATION_STATUSES);

  let content: React.ReactNode;
  try {
    const [data, eventsRes] = await Promise.all([
      ticketsApiGet<CollabApplicationPage<SponsorApplication>>(
        `/admin/sponsor-applications${toQuery({ page, limit: ADMIN_PAGE_SIZE, status, event })}`,
      ),
      ticketsApiGet<Paginated<AdminEvent>>('/admin/events?page=1&limit=100').catch(() => ({ data: [] } as unknown as Paginated<AdminEvent>)),
    ]);
    const eventOptions = (Array.isArray(eventsRes?.data) ? eventsRes.data : []).map((ev) => ({
      slug: ev.slug,
      name: ev.name,
    }));
    redirectIfPastLastPage('/tickets-command/sponsors', page, ADMIN_PAGE_SIZE, data.total, { status, event });
    content = (
      <>
        <CollabApplicationsManager
          kind="sponsor"
          items={data.items}
          total={data.total}
          filtered={Boolean(status || event)}
          events={eventOptions}
        />
        <Pagination basePath="/tickets-command/sponsors" page={page} limit={ADMIN_PAGE_SIZE} total={data.total} params={{ status, event }} />
      </>
    );
  } catch (e) {
    unstable_rethrow(e);
    const message = e instanceof Error ? e.message : 'Failed to load applications';
    content = (
      <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
        <p className="font-semibold">Could not load applications</p>
        <p className="mt-2 text-[14px]">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Sponsors</h1>
        <p className="mt-2 text-[15px] text-stone-600">Review sponsorship applications submitted from the event site.</p>
      </header>
      {content}
    </div>
  );
}
