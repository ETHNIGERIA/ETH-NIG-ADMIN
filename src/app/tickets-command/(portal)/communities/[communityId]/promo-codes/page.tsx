import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminCommunity } from '@/tickets-portal/types/admin-communities';
import type { AdminPromoCode } from '@/tickets-portal/types/admin-promo-codes';
import { normalizeAdminPromoCode } from '@/tickets-portal/lib/admin-promo-codes';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { PromoCodesManager } from '@/tickets-portal/components/promotions/PromoCodesManager';

export default async function CommunityPromoCodesPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = await params;
  const id = normalizeDocumentId(communityId);

  let community: AdminCommunity;
  try {
    const raw = await ticketsApiGet<AdminCommunity>(`/admin/communities/${id}`);
    community = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  let codes: AdminPromoCode[] = [];
  let events: Array<{ id: string; name: string }> = [];
  let loadError: string | null = null;

  try {
    const rawCodes = await ticketsApiGet<AdminPromoCode[]>(
      `/admin/promo-codes?communityId=${encodeURIComponent(id)}`,
    );
    codes = rawCodes.map(normalizeAdminPromoCode);
    const ep = await ticketsApiGet<Paginated<AdminEvent>>(`/admin/events?page=1&limit=100`);
    events = ep.data.map((e) => ({
      id: normalizeDocumentId(e._id),
      name: e.name,
    }));
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Could not load promo codes.';
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-3 text-[13px] text-stone-600">
          <Link href="/tickets-command/communities" className="hover:text-stone-900 hover:underline">
            ← Communities
          </Link>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Promo codes — {community.name}</h1>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <PromoCodesManager codes={codes} events={events} ownerKind="community" ownerId={id} />
      )}
    </div>
  );
}
