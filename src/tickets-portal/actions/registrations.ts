'use server';

import { redirect } from 'next/navigation';
import { ticketsApiDelete, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';

export type RegistrationActionState = { error?: string } | undefined;

export async function confirmRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const registrationId = String(formData.get('registrationId') ?? '').trim();
  if (!eventId || !registrationId) {
    return { error: 'Missing event or registration.' };
  }

  try {
    await ticketsApiPost<AdminRegistration, Record<string, never>>(
      `/admin/events/${eventId}/registrations/${registrationId}/confirm`,
      {},
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not confirm registration.' };
  }

  redirect(`/tickets-command/events/${eventId}/registrations/${registrationId}`);
}

export async function cancelRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData,
): Promise<RegistrationActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const registrationId = String(formData.get('registrationId') ?? '').trim();
  if (!eventId || !registrationId) {
    return { error: 'Missing event or registration.' };
  }

  try {
    await ticketsApiDelete(`/admin/events/${eventId}/registrations/${registrationId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not cancel registration.' };
  }

  redirect(`/tickets-command/events/${eventId}/registrations`);
}
