'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiDelete, ticketsApiPatch, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminInfluencer } from '@/tickets-portal/types/admin-influencers';

export type InfluencerActionState = { error?: string; ok?: boolean } | undefined;

export async function createInfluencerAction(
  _prev: InfluencerActionState,
  formData: FormData,
): Promise<InfluencerActionState> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const emailRaw = String(formData.get('email') ?? '').trim();
  const notesRaw = String(formData.get('notes') ?? '').trim();

  if (!displayName) return { error: 'Display name is required.' };

  const body: Record<string, unknown> = { displayName };
  if (emailRaw) body.email = emailRaw;
  if (notesRaw) body.notes = notesRaw;

  try {
    await ticketsApiPost<AdminInfluencer, Record<string, unknown>>('/admin/influencers', body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not create influencer.' };
  }

  revalidatePath('/tickets-command/influencers');
  return { ok: true };
}

export async function updateInfluencerAction(
  _prev: InfluencerActionState,
  formData: FormData,
): Promise<InfluencerActionState> {
  const id = String(formData.get('influencerId') ?? '').trim();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const emailRaw = String(formData.get('email') ?? '').trim();
  const notesRaw = String(formData.get('notes') ?? '').trim();

  if (!id) return { error: 'Missing influencer.' };
  if (!displayName) return { error: 'Display name is required.' };

  const body: Record<string, unknown> = {
    displayName,
    notes: notesRaw,
  };
  if (emailRaw) body.email = emailRaw;

  try {
    await ticketsApiPatch<AdminInfluencer, Record<string, unknown>>(`/admin/influencers/${id}`, body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update influencer.' };
  }

  revalidatePath('/tickets-command/influencers');
  revalidatePath(`/tickets-command/influencers/${id}/promo-codes`);
  return { ok: true };
}

export async function deleteInfluencerAction(
  _prev: InfluencerActionState,
  formData: FormData,
): Promise<InfluencerActionState> {
  const id = String(formData.get('influencerId') ?? '').trim();
  if (!id) return { error: 'Missing influencer.' };

  try {
    await ticketsApiDelete(`/admin/influencers/${id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete influencer.' };
  }

  revalidatePath('/tickets-command/influencers');
  return { ok: true };
}
