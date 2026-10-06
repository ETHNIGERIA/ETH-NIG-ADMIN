'use server';

import { unstable_rethrow } from 'next/navigation';
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
    unstable_rethrow(e);
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

const PARTNER_STATUSES = new Set(['pending', 'reviewed', 'approved', 'rejected']);

export async function updatePartnerApplicationStatusAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  return updateApplicationStatus('/admin/partner-applications', 'partners', formData);
}

export async function updateSponsorApplicationStatusAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  return updateApplicationStatus('/admin/sponsor-applications', 'sponsors', formData);
}

export async function updateSpeakerApplicationStatusAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  return updateApplicationStatus('/admin/speaker-applications', 'speakers', formData);
}

async function updateApplicationStatus(
  basePath: string,
  page: 'partners' | 'sponsors' | 'speakers',
  formData: FormData,
): Promise<ApplicationActionState> {
  const id = String(formData.get('applicationId') ?? '').trim();
  const eventId = String(formData.get('eventId') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toLowerCase();

  if (!id) return { error: 'Missing application.' };
  if (!PARTNER_STATUSES.has(status)) return { error: 'Invalid status.' };

  try {
    await ticketsApiPatch<unknown, { status: string }>(`${basePath}/${id}/status`, { status });
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not update status.' };
  }

  if (eventId) {
    revalidatePath(`/tickets-command/events/${eventId}`);
    revalidatePath(`/tickets-command/events/${eventId}/${page}`);
  }
  revalidatePath('/tickets-command/program');
  return { ok: true };
}
