import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { ApplicationsManager } from '@/tickets-portal/components/applications/ApplicationsManager';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { unstable_rethrow } from 'next/navigation';
import {
  ADMIN_PAGE_SIZE,
  parseListParams,
  redirectIfPastLastPage,
  toQuery,
  type ListSearchParams,
} from '@/tickets-portal/lib/list-params';
import {
  APPLICATION_STATUSES,
  type ApplicationPage,
  type VolunteerApplication,
} from '@/tickets-portal/types/admin-applications';

export const dynamic = 'force-dynamic';

export default async function VolunteerApplicationsPage({ searchParams }: { searchParams: Promise<ListSearchParams> }) {
  const { page, status } = parseListParams(await searchParams, APPLICATION_STATUSES);
  try {
    const data = await ticketsApiGet<ApplicationPage<VolunteerApplication>>(
      `/admin/volunteer-applications${toQuery({ page, limit: ADMIN_PAGE_SIZE, status })}`,
    );
    redirectIfPastLastPage('/tickets-command/applications/volunteers', page, ADMIN_PAGE_SIZE, data.total, { status });
    return (
      <div className="space-y-4">
        <ApplicationsManager kind="volunteer" items={data.items} total={data.total} filtered={Boolean(status)} />
        <Pagination
          basePath="/tickets-command/applications/volunteers"
          page={page}
          limit={ADMIN_PAGE_SIZE}
          total={data.total}
          params={{ status }}
        />
      </div>
    );
  } catch (e) {
    unstable_rethrow(e);
    const message = e instanceof Error ? e.message : 'Failed to load applications';
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
        <p className="font-semibold">Could not load applications</p>
        <p className="mt-2 text-[14px]">{message}</p>
      </div>
    );
  }
}
