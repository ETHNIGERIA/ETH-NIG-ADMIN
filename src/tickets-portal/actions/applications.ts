'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import type { ApplicationStatus } from '@/tickets-portal/types/admin-applications';

export type ApplicationActionState = { error?: string; ok?: boolean } | undefined;

async function updateStatus(path: string, formData: FormData): Promise<ApplicationActionState> {
  const status = String(formData.get('status') ?? '').trim() as ApplicationStatus;
  if (!['pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'].includes(status)) return { error: 'Invalid status.' };
  try {
    await ticketsApiPatch(path, { status });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update application.' };
  }
  revalidatePath('/tickets-command/applications/volunteers');
  revalidatePath('/tickets-command/applications/influencers');
  return { ok: true };
}

export async function updateVolunteerApplicationStatusAction(_prev: ApplicationActionState, formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return { error: 'Missing application.' };
  return updateStatus(`/admin/volunteer-applications/${id}/status`, formData);
}

export async function updateInfluencerApplicationStatusAction(_prev: ApplicationActionState, formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return { error: 'Missing application.' };
  return updateStatus(`/admin/influencer-applications/${id}/status`, formData);
}
