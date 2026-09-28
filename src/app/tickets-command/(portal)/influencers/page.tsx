import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminInfluencer } from '@/tickets-portal/types/admin-influencers';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { InfluencersManager } from '@/tickets-portal/components/influencers/InfluencersManager';
import { HowItWorks } from '@/tickets-portal/components/ui/HowItWorks';

export default async function InfluencersPage() {
  let influencers: AdminInfluencer[] = [];
  let loadError: string | null = null;

  try {
    const raw = await ticketsApiGet<AdminInfluencer[]>('/admin/influencers');
    influencers = raw.map((r) => ({
      ...r,
      _id: normalizeDocumentId(r._id),
    }));
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Could not load influencers.';
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Influencers</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-stone-600">
          People who promote the event with their own promo codes.
        </p>
        <HowItWorks
          items={[
            'Add an influencer here, or accept an influencer application under Applications. Accepting creates the influencer, or links an existing one with the same email.',
            'Open “Promo codes” to give an influencer codes. Sales made with those codes count towards them.',
            'Influencers sign in to the influencer portal with their email to see their own sales.',
          ]}
        />
      </header>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <InfluencersManager influencers={influencers} />
      )}
    </div>
  );
}
