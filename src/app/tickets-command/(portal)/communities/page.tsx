import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminCommunity } from '@/tickets-portal/types/admin-communities';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { CommunitiesManager } from '@/tickets-portal/components/communities/CommunitiesManager';
import { HowItWorks } from '@/tickets-portal/components/ui/HowItWorks';

export default async function CommunitiesPage() {
  let communities: AdminCommunity[] = [];
  let loadError: string | null = null;

  try {
    const raw = await ticketsApiGet<AdminCommunity[]>('/admin/communities');
    communities = raw.map((r) => ({
      ...r,
      _id: normalizeDocumentId(r._id),
    }));
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Could not load communities.';
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Communities</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-stone-600">
          Groups (meetups, clubs, partner communities) that share their own promo codes with members.
        </p>
        <HowItWorks
          items={[
            'Add a community, then open “Promo codes” to give it codes.',
            'Sales made with a community’s codes count towards that community. Communities do not get payouts.',
          ]}
        />
      </header>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <CommunitiesManager communities={communities} />
      )}
    </div>
  );
}
