'use server';

import { redirect } from 'next/navigation';
import { ticketsApiDelete, ticketsApiPatch, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import { nairaInputToMinor } from '@/tickets-portal/lib/money-input';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type { ActionState } from '@/tickets-portal/actions/events';

function parseBenefits(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseDatetimeLocalToIso(formData: FormData, key: string): string | undefined {
  const raw = String(formData.get(key) ?? '').trim();
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function parseOptionalNonNegInt(formData: FormData, key: string): number | undefined {
  const raw = String(formData.get(key) ?? '').trim();
  if (raw === '') return undefined;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return undefined;
  return n;
}

function parseOptionalNairaMinor(formData: FormData, key: string): number | undefined {
  const raw = String(formData.get(key) ?? '').trim();
  if (raw === '') return undefined;
  const m = nairaInputToMinor(raw);
  return m >= 0 ? m : undefined;
}

export async function createTierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const benefitsRaw = String(formData.get('benefits') ?? '');
  const isFree = formData.get('isFree') === 'on' || formData.get('isFree') === 'true';
  const priceInput = String(formData.get('priceMajor') ?? '');
  const currency = String(formData.get('currency') ?? 'NGN')
    .trim()
    .toUpperCase() || 'NGN';
  const capRaw = String(formData.get('capacity') ?? '').trim();

  if (!eventId || !name) {
    return { error: 'Event and tier name are required.' };
  }

  const priceMinor = isFree ? 0 : nairaInputToMinor(priceInput);
  if (!isFree && priceMinor <= 0) {
    return { error: 'Paid tiers need a price greater than zero.' };
  }

  const body: Record<string, unknown> = {
    name,
    isFree,
    priceMinor,
    benefits: parseBenefits(benefitsRaw),
  };
  if (description) body.description = description;
  if (!isFree) body.currency = currency;
  if (capRaw !== '') {
    const c = parseInt(capRaw, 10);
    if (!Number.isNaN(c) && c >= 0) body.capacity = c;
  }

  if (!isFree) {
    const ebIso = parseDatetimeLocalToIso(formData, 'earlyBirdEndsAt');
    const ebPrice = parseOptionalNairaMinor(formData, 'earlyBirdPriceMajor');
    const ebCap = parseOptionalNonNegInt(formData, 'earlyBirdCapacity');
    if (ebIso !== undefined) body.earlyBirdEndsAt = ebIso;
    if (ebPrice !== undefined) body.earlyBirdPriceMinor = ebPrice;
    if (ebCap !== undefined) body.earlyBirdCapacity = ebCap;
  }

  try {
    await ticketsApiPost<AdminTicketTier, Record<string, unknown>>(
      `/admin/events/${eventId}/tiers`,
      body,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create tier.' };
  }

  redirect(`/tickets-command/events/${eventId}`);
}

export async function updateTierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const tierId = String(formData.get('tierId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const benefitsRaw = String(formData.get('benefits') ?? '');
  const isFree = formData.get('isFree') === 'on' || formData.get('isFree') === 'true';
  const priceInput = String(formData.get('priceMajor') ?? '');
  const currency = String(formData.get('currency') ?? 'NGN')
    .trim()
    .toUpperCase() || 'NGN';
  const capRaw = String(formData.get('capacity') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim() as 'active' | 'inactive';
  const clearEarlyBird = formData.get('clearEarlyBird') === 'on';

  if (!eventId || !tierId || !name) {
    return { error: 'Missing tier or name.' };
  }
  if (status !== 'active' && status !== 'inactive') {
    return { error: 'Status must be active or inactive.' };
  }

  const priceMinor = isFree ? 0 : nairaInputToMinor(priceInput);
  if (!isFree && priceMinor <= 0) {
    return { error: 'Paid tiers need a price greater than zero.' };
  }

  const patch: Record<string, unknown> = {
    name,
    priceMinor,
    isFree,
    status,
    benefits: parseBenefits(benefitsRaw),
    description,
  };
  if (!isFree) {
    patch.currency = currency;
  }

  if (capRaw !== '') {
    const c = parseInt(capRaw, 10);
    if (!Number.isNaN(c) && c >= 0) patch.capacity = c;
  }

  if (isFree) {
    patch.earlyBirdEndsAt = null;
    patch.earlyBirdPriceMinor = null;
    patch.earlyBirdCapacity = null;
  } else if (clearEarlyBird) {
    patch.earlyBirdEndsAt = null;
    patch.earlyBirdPriceMinor = null;
    patch.earlyBirdCapacity = null;
  } else if (!isFree) {
    const ebIso = parseDatetimeLocalToIso(formData, 'earlyBirdEndsAt');
    const ebPrice = parseOptionalNairaMinor(formData, 'earlyBirdPriceMajor');
    const ebCap = parseOptionalNonNegInt(formData, 'earlyBirdCapacity');
    if (ebIso !== undefined) patch.earlyBirdEndsAt = ebIso;
    if (ebPrice !== undefined) patch.earlyBirdPriceMinor = ebPrice;
    if (ebCap !== undefined) patch.earlyBirdCapacity = ebCap;
  }

  try {
    await ticketsApiPatch<AdminTicketTier, Record<string, unknown>>(
      `/admin/events/${eventId}/tiers/${tierId}`,
      patch,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update tier.' };
  }

  redirect(`/tickets-command/events/${eventId}`);
}

export async function deleteTierAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const tierId = String(formData.get('tierId') ?? '').trim();
  if (!eventId || !tierId) {
    return { error: 'Missing tier.' };
  }

  try {
    await ticketsApiDelete(`/admin/events/${eventId}/tiers/${tierId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not remove tier.' };
  }

  redirect(`/tickets-command/events/${eventId}`);
}
