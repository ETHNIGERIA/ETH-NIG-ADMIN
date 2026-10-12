'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ticketsApiGet, ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import type { SpeakerApplication, SponsorApplication } from '@/tickets-portal/types/admin-collab-applications';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';

export async function updateEventApplicationStatus(form: FormData) {
  const eventId = String(form.get('eventId') ?? '');
  const kind = String(form.get('kind') ?? '');
  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '');
  if (!/^[a-f0-9]{24}$/i.test(eventId) || !/^[a-f0-9]{24}$/i.test(id) || !['speakers', 'sponsors'].includes(kind) || !['pending', 'contacted', 'approved', 'rejected'].includes(status)) throw new Error('Invalid application update.');
  const event = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
  if (event.kind === 'side') throw new Error('Invalid event.');
  const api = kind === 'speakers' ? 'speaker-applications' : 'sponsor-applications';
  const application = await ticketsApiGet<SpeakerApplication | SponsorApplication>(`/admin/${api}/${id}`);
  if (application.eventSlug !== event.slug) throw new Error('This application belongs to another event.');
  await ticketsApiPatch(`/admin/${api}/${id}/status`, { status });
  const path = `/tickets-command/events-v2/${eventId}/applications/${kind}/${id}`;
  revalidatePath(path);
  revalidatePath(`/tickets-command/events-v2/${eventId}/applications/${kind}`);
  redirect(path);
}
