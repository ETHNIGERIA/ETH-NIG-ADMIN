import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminCommunity } from '@/tickets-portal/types/admin-communities';
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

export default async function CommunityPromoCodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ communityId: string }>;
  searchParams: Promise<ListSearchParams>;
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

  const { page } = parseListParams(await searchParams, []);
  const basePath = `/tickets-command/communities/${id}/promo-codes`;
  let codes: AdminPromoCode[] = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    const res = toPromoCodePage(
      await ticketsApiGet<Paginated<AdminPromoCode> | AdminPromoCode[]>(
        `/admin/promo-codes${toQuery({ communityId: id, page, limit: ADMIN_PAGE_SIZE })}`,
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
          <Link href="/tickets-command/communities" className="hover:text-stone-900 hover:underline">
            ← Communities
          </Link>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Promo codes — {community.name}</h1>
        <PromoCodesHowItWorks owner="community" />
      </header>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load data</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <PromoCodesManager codes={codes} total={total} ownerKind="community" ownerId={id} buyerSite={getBuyerSite()} />
          <Pagination basePath={basePath} page={page} limit={ADMIN_PAGE_SIZE} total={total} />
        </div>
      )}
    </div>
  );
}
