'use server';

import { revalidatePath } from 'next/cache';
import {
  ticketsApiDelete,
  ticketsApiPatch,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type { AdminPromoCode, PromoCodeDiscountType } from '@/tickets-portal/types/admin-promo-codes';

export type PromoCodeActionState = { error?: string; ok?: boolean } | undefined;

function revalidateOwnerPromos(formData: FormData) {
  const ownerKind = String(formData.get('ownerKind') ?? '').trim();
  const ownerId = String(formData.get('ownerId') ?? '').trim();
  if (ownerKind === 'influencer' && ownerId) {
    revalidatePath(`/tickets-command/influencers/${ownerId}/promo-codes`);
    revalidatePath('/tickets-command/influencers');
  } else if (ownerKind === 'community' && ownerId) {
    revalidatePath(`/tickets-command/communities/${ownerId}/promo-codes`);
    revalidatePath('/tickets-command/communities');
  }
}

function parseScope(formData: FormData): string | undefined {
  const raw = String(formData.get('eventId') ?? '').trim();
  return raw === '' ? undefined : raw;
}

function toMinorUnitsForFixed(
  value: number,
  discountType: PromoCodeDiscountType,
) {
  if (discountType !== 'fixed') return value;
  return Math.round(value * 100);
}

export async function createPromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData,
): Promise<PromoCodeActionState> {
  const ownerKind = String(formData.get('ownerKind') ?? '').trim();
  const ownerId = String(formData.get('ownerId') ?? '').trim();
  const influencerId = String(formData.get('influencerId') ?? '').trim();
  const communityId = String(formData.get('communityId') ?? '').trim();

  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const discountValueRaw = String(formData.get('discountValue') ?? '').trim();
  const maxUsesRaw = String(formData.get('maxUses') ?? '').trim();
  const isActive = formData.get('isActive') === 'on';

  const discountType = String(formData.get('discountType') ?? '').trim() as PromoCodeDiscountType;

  if (!ownerId || (ownerKind !== 'influencer' && ownerKind !== 'community')) {
    return { error: 'Missing owner context.' };
  }
  if (ownerKind === 'influencer' && influencerId !== ownerId) {
    return { error: 'Influencer mismatch.' };
  }
  if (ownerKind === 'community' && communityId !== ownerId) {
    return { error: 'Community mismatch.' };
  }

  if (!code || !discountValueRaw) {
    return { error: 'Code and discount value are required.' };
  }
  if (!discountType || (discountType !== 'percentage' && discountType !== 'fixed')) {
    return { error: 'Invalid discount type.' };
  }

  const discountValue = Number(discountValueRaw);
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { error: 'Discount value must be a non-negative number.' };
  }
  if (discountType === 'percentage' && discountValue > 100) {
    return { error: 'Percentage cannot exceed 100.' };
  }

  const body: Record<string, unknown> = {
    code,
    discountType,
    discountValue: toMinorUnitsForFixed(discountValue, discountType),
    isActive,
  };

  if (ownerKind === 'influencer') body.influencerId = influencerId;
  else body.communityId = communityId;

  const scope = parseScope(formData);
  if (scope) body.eventId = scope;

  if (maxUsesRaw) {
    const maxUses = parseInt(maxUsesRaw, 10);
    if (!Number.isFinite(maxUses) || maxUses < 0) {
      return { error: 'Max uses must be a non-negative integer.' };
    }
    body.maxUses = maxUses;
  }

  try {
    await ticketsApiPost<AdminPromoCode, Record<string, unknown>>('/admin/promo-codes', body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create promo code.' };
  }

  revalidateOwnerPromos(formData);
  return { ok: true };
}

export async function updatePromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData,
): Promise<PromoCodeActionState> {
  const promoId = String(formData.get('promoId') ?? '').trim();
  const ownerKind = String(formData.get('ownerKind') ?? '').trim();
  const ownerId = String(formData.get('ownerId') ?? '').trim();
  const influencerId = String(formData.get('influencerId') ?? '').trim();
  const communityId = String(formData.get('communityId') ?? '').trim();

  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const discountValueRaw = String(formData.get('discountValue') ?? '').trim();
  const maxUsesRaw = String(formData.get('maxUses') ?? '').trim();
  const isActive = formData.get('isActive') === 'on';

  const discountType = String(formData.get('discountType') ?? '').trim() as PromoCodeDiscountType;

  if (!promoId) return { error: 'Missing promo id.' };
  if (!ownerId || (ownerKind !== 'influencer' && ownerKind !== 'community')) {
    return { error: 'Missing owner context.' };
  }
  if (ownerKind === 'influencer' && influencerId !== ownerId) {
    return { error: 'Influencer mismatch.' };
  }
  if (ownerKind === 'community' && communityId !== ownerId) {
    return { error: 'Community mismatch.' };
  }
  if (!code || !discountValueRaw) {
    return { error: 'Code and discount value are required.' };
  }

  const discountValue = Number(discountValueRaw);
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { error: 'Discount value must be a non-negative number.' };
  }
  if (discountType === 'percentage' && discountValue > 100) {
    return { error: 'Percentage cannot exceed 100.' };
  }

  const body: Record<string, unknown> = {
    code,
    discountType,
    discountValue: toMinorUnitsForFixed(discountValue, discountType),
    isActive,
  };

  if (ownerKind === 'influencer') body.influencerId = influencerId;
  else body.communityId = communityId;

  const scope = parseScope(formData);
  if (scope === undefined) {
    body.eventId = null;
  } else {
    body.eventId = scope;
  }

  if (maxUsesRaw) {
    const maxUses = parseInt(maxUsesRaw, 10);
    if (!Number.isFinite(maxUses) || maxUses < 0) {
      return { error: 'Max uses must be a non-negative integer.' };
    }
    body.maxUses = maxUses;
  }

  try {
    await ticketsApiPatch<AdminPromoCode, Record<string, unknown>>(
      `/admin/promo-codes/${promoId}`,
      body,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update promo code.' };
  }

  revalidateOwnerPromos(formData);
  return { ok: true };
}

export async function deletePromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData,
): Promise<PromoCodeActionState> {
  const promoId = String(formData.get('promoId') ?? '').trim();
  if (!promoId) return { error: 'Missing promo id.' };

  try {
    await ticketsApiDelete(`/admin/promo-codes/${promoId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete promo code.' };
  }

  revalidateOwnerPromos(formData);
  return { ok: true };
}
