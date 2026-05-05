'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiDelete, ticketsApiPatch, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminCommunity } from '@/tickets-portal/types/admin-communities';

export type CommunityActionState = { error?: string; ok?: boolean } | undefined;

export async function createCommunityAction(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();

  if (!name) return { error: 'Name is required.' };

  const body: Record<string, unknown> = { name };
  if (description) body.description = description;
  if (region) body.region = region;

  try {
    await ticketsApiPost<AdminCommunity, Record<string, unknown>>('/admin/communities', body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create community.' };
  }

  revalidatePath('/tickets-command/communities');
  return { ok: true };
}

export async function updateCommunityAction(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const id = String(formData.get('communityId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();

  if (!id) return { error: 'Missing community.' };
  if (!name) return { error: 'Name is required.' };

  const body: Record<string, unknown> = { name };
  if (description) body.description = description;
  if (region) body.region = region;

  try {
    await ticketsApiPatch<AdminCommunity, Record<string, unknown>>(`/admin/communities/${id}`, body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update community.' };
  }

  revalidatePath('/tickets-command/communities');
  revalidatePath(`/tickets-command/communities/${id}/promo-codes`);
  return { ok: true };
}

export async function deleteCommunityAction(
  _prev: CommunityActionState,
  formData: FormData,
): Promise<CommunityActionState> {
  const id = String(formData.get('communityId') ?? '').trim();
  if (!id) return { error: 'Missing community.' };

  try {
    await ticketsApiDelete(`/admin/communities/${id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete community.' };
  }

  revalidatePath('/tickets-command/communities');
  return { ok: true };
}
