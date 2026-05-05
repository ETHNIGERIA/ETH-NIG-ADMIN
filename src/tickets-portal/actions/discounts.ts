'use server';

import { revalidatePath } from 'next/cache';
import {
  ticketsApiDelete,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type { AdminDiscount, AdminDiscountType } from '@/tickets-portal/types/admin-discounts';

export type DiscountActionState = { error?: string; ok?: boolean } | undefined;

function parseDatetimeLocal(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function toMinorUnitsForFixed(value: number, type: AdminDiscountType) {
  if (type !== 'fixed') return value;
  return Math.round(value * 100);
}

export async function createDiscountAction(
  _prev: DiscountActionState,
  formData: FormData,
): Promise<DiscountActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? '').trim() as AdminDiscountType;
  const valueRaw = String(formData.get('value') ?? '').trim();
  const maxUsesRaw = String(formData.get('maxUses') ?? '').trim();
  const validFromRaw = String(formData.get('validFrom') ?? '').trim();
  const validUntilRaw = String(formData.get('validUntil') ?? '').trim();
  const isActive = formData.get('isActive') === 'on';

  if (!eventId) return { error: 'Event is required.' };
  if (!code) return { error: 'Code is required.' };
  if (type !== 'percentage' && type !== 'fixed') return { error: 'Invalid discount type.' };

  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value < 0) {
    return { error: 'Value must be a non-negative number.' };
  }
  if (type === 'percentage' && value > 100) {
    return { error: 'Percentage cannot exceed 100.' };
  }

  const validFrom = parseDatetimeLocal(validFromRaw);
  const validUntil = parseDatetimeLocal(validUntilRaw);
  if (!validFrom || !validUntil) {
    return { error: 'Valid from / until must be valid dates.' };
  }

  const body: Record<string, unknown> = {
    code,
    type,
    value: toMinorUnitsForFixed(value, type),
    validFrom,
    validUntil,
    isActive,
    eventId,
  };

  if (maxUsesRaw) {
    const maxUses = parseInt(maxUsesRaw, 10);
    if (!Number.isFinite(maxUses) || maxUses < 0) {
      return { error: 'Max uses must be a non-negative integer.' };
    }
    body.maxUses = maxUses;
  }

  try {
    await ticketsApiPost<AdminDiscount, Record<string, unknown>>('/admin/discounts', body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create discount.' };
  }

  revalidatePath(`/tickets-command/events/${eventId}/discounts`);
  revalidatePath(`/tickets-command/events/${eventId}`);
  return { ok: true };
}

export async function deleteDiscountAction(
  _prev: DiscountActionState,
  formData: FormData,
): Promise<DiscountActionState> {
  const discountId = String(formData.get('discountId') ?? '').trim();
  const eventId = String(formData.get('eventId') ?? '').trim();
  if (!discountId) return { error: 'Missing discount.' };

  try {
    await ticketsApiDelete(`/admin/discounts/${discountId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete discount.' };
  }

  if (eventId) {
    revalidatePath(`/tickets-command/events/${eventId}/discounts`);
    revalidatePath(`/tickets-command/events/${eventId}`);
  }
  return { ok: true };
}
