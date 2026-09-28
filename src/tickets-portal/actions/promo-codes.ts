'use server';

import { unstable_rethrow } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  ticketsApiDelete,
  ticketsApiPatch,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type { AdminPromoCode, PromoCodeDiscountType } from '@/tickets-portal/types/admin-promo-codes';

export type PromoCodeActionState = { error?: string; ok?: boolean } | undefined;

type Owner = { kind: 'influencer' | 'community' | 'event'; id: string };

/** Owner context posted by PromoCodesManager (`ownerKind` + `ownerId`). */
function parseOwner(formData: FormData): Owner | null {
  const kind = String(formData.get('ownerKind') ?? '').trim();
  const id = String(formData.get('ownerId') ?? '').trim();
  if (!id || (kind !== 'influencer' && kind !== 'community' && kind !== 'event')) return null;
  return { kind, id };
}

function revalidateOwnerPromos(owner: Owner) {
  if (owner.kind === 'event') {
    revalidatePath(`/tickets-command/events/${owner.id}`);
    return;
  }
  const base = owner.kind === 'influencer' ? 'influencers' : 'communities';
  revalidatePath(`/tickets-command/${base}/${owner.id}/promo-codes`);
  revalidatePath(`/tickets-command/${base}`);
}

/**
 * Parses and validates the create/edit form into an API body. Event codes are
 * ownerless and always scoped to their event; on edit a blank max means "no limit".
 */
function parsePromoForm(
  formData: FormData,
  mode: 'create' | 'update',
): { owner: Owner; body: Record<string, unknown> } | { error: string } {
  const owner = parseOwner(formData);
  if (!owner) return { error: 'Missing owner context.' };

  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const discountValueRaw = String(formData.get('discountValue') ?? '').trim();
  const maxUsesRaw = String(formData.get('maxUses') ?? '').trim();
  const discountType = String(formData.get('discountType') ?? '').trim() as PromoCodeDiscountType;
  const scope = String(formData.get('eventId') ?? '').trim();

  if (!code || !discountValueRaw) return { error: 'Code and discount value are required.' };
  if (discountType !== 'percentage' && discountType !== 'fixed') return { error: 'Invalid discount type.' };

  const discountValue = Number(discountValueRaw);
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { error: 'Discount value must be a non-negative number.' };
  }
  if (discountType === 'percentage' && discountValue > 100) return { error: 'Percentage cannot exceed 100.' };
  if (owner.kind === 'event' && scope !== owner.id) return { error: 'Event code mismatch.' };

  const body: Record<string, unknown> = {
    code,
    discountType,
    discountValue: discountType === 'fixed' ? Math.round(discountValue * 100) : discountValue,
    isActive: formData.get('isActive') === 'on',
  };
  if (owner.kind === 'influencer') body.influencerId = owner.id;
  if (owner.kind === 'community') body.communityId = owner.id;

  if (scope) body.eventId = scope;
  else if (mode === 'update') body.eventId = null;

  if (maxUsesRaw) {
    const maxUses = Number(maxUsesRaw);
    if (!Number.isInteger(maxUses) || maxUses < 0) return { error: 'Max tickets must be a non-negative whole number.' };
    body.maxUses = maxUses;
  } else if (mode === 'update') {
    body.maxUses = null; // cleared field = remove the limit
  }

  return { owner, body };
}

export async function createPromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData,
): Promise<PromoCodeActionState> {
  const parsed = parsePromoForm(formData, 'create');
  if ('error' in parsed) return { error: parsed.error };

  try {
    await ticketsApiPost<AdminPromoCode, Record<string, unknown>>('/admin/promo-codes', parsed.body);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not create promo code.' };
  }

  revalidateOwnerPromos(parsed.owner);
  return { ok: true };
}

export async function updatePromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData,
): Promise<PromoCodeActionState> {
  const promoId = String(formData.get('promoId') ?? '').trim();
  if (!promoId) return { error: 'Missing promo id.' };
  const parsed = parsePromoForm(formData, 'update');
  if ('error' in parsed) return { error: parsed.error };

  try {
    await ticketsApiPatch<AdminPromoCode, Record<string, unknown>>(`/admin/promo-codes/${promoId}`, parsed.body);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not update promo code.' };
  }

  revalidateOwnerPromos(parsed.owner);
  return { ok: true };
}

export async function deletePromoCodeAction(
  _prev: PromoCodeActionState,
  formData: FormData,
): Promise<PromoCodeActionState> {
  const promoId = String(formData.get('promoId') ?? '').trim();
  if (!promoId) return { error: 'Missing promo id.' };
  const owner = parseOwner(formData);

  try {
    await ticketsApiDelete(`/admin/promo-codes/${promoId}`);
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not delete promo code.' };
  }

  if (owner) revalidateOwnerPromos(owner);
  return { ok: true };
}
