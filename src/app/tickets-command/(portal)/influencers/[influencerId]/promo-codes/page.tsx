import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminInfluencer } from '@/tickets-portal/types/admin-influencers';
import type { AdminPromoCode } from '@/tickets-portal/types/admin-promo-codes';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import {
  ADMIN_PAGE_SIZE,
  parseListParams,
  redirectIfPastLastPage,
  toQuery,
  type ListSearchParams,
} from '@/tickets-portal/lib/list-params';
import { toPromoCodePage } from '@/tickets-portal/lib/admin-promo-codes';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { getBuyerSite } from '@/tickets-portal/auth/server-config';
import { PromoCodesManager } from '@/tickets-portal/components/promotions/PromoCodesManager';
import { PromoCodesHowItWorks } from '@/tickets-portal/components/promotions/PromoCodesHowItWorks';

export default async function InfluencerPromoCodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ influencerId: string }>;
  searchParams: Promise<ListSearchParams>;
}) {
  const { influencerId } = await params;
  const id = normalizeDocumentId(influencerId);

  let influencer: AdminInfluencer;
  try {
    const raw = await ticketsApiGet<AdminInfluencer>(`/admin/influencers/${id}`);
    influencer = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  const { page } = parseListParams(await searchParams, []);
  const basePath = `/tickets-command/influencers/${id}/promo-codes`;
  let codes: AdminPromoCode[] = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    const res = toPromoCodePage(
      await ticketsApiGet<Paginated<AdminPromoCode> | AdminPromoCode[]>(
        `/admin/promo-codes${toQuery({ influencerId: id, page, limit: ADMIN_PAGE_SIZE })}`,
      ),
    );
    redirectIfPastLastPage(basePath, page, ADMIN_PAGE_SIZE, res.total);
    codes = res.codes;
    total = res.total;
  } catch (e) {
    unstable_rethrow(e);
    loadError = e instanceof Error ? e.message : 'Could not load promo codes.';
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap gap-3 text-[13px] text-stone-600">
          <Link href="/tickets-command/influencers" className="hover:text-stone-900 hover:underline">
            ← Influencers
          </Link>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">
          Promo codes — {influencer.displayName}
        </h1>
        <PromoCodesHowItWorks owner="influencer" />
      </header>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <PromoCodesManager codes={codes} total={total} ownerKind="influencer" ownerId={id} buyerSite={getBuyerSite()} />
          <Pagination basePath={basePath} page={page} limit={ADMIN_PAGE_SIZE} total={total} />
        </div>
      )}
    </div>
  );
}
