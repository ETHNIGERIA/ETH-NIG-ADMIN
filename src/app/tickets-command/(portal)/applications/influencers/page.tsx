import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { ApplicationsManager } from '@/tickets-portal/components/applications/ApplicationsManager';
import type { ApplicationPage, InfluencerApplication } from '@/tickets-portal/types/admin-applications';

export const dynamic = 'force-dynamic';

export default async function InfluencerApplicationsPage() {
  try {
    const data = await ticketsApiGet<ApplicationPage<InfluencerApplication>>(
      '/admin/influencer-applications?limit=100',
    );
    return <ApplicationsManager kind="influencer" items={data.items} />;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load applications';
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
        <p className="font-semibold">Could not load applications</p>
        <p className="mt-2 text-[14px]">{message}</p>
      </div>
    );
  }
}
