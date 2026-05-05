'use server';

import { redirect } from 'next/navigation';
import { ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminUser } from '@/tickets-portal/types/admin-users';

export type UserActionState = { error?: string } | undefined;

export async function deactivateUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const userId = String(formData.get('userId') ?? '').trim();
  if (!userId) {
    return { error: 'Missing user.' };
  }

  try {
    await ticketsApiPatch<AdminUser, Record<string, never>>(`/admin/users/${userId}/deactivate`, {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not deactivate user.' };
  }

  redirect(`/tickets-command/users/${userId}`);
}

export async function activateUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const userId = String(formData.get('userId') ?? '').trim();
  if (!userId) {
    return { error: 'Missing user.' };
  }

  try {
    await ticketsApiPatch<AdminUser, Record<string, never>>(`/admin/users/${userId}/activate`, {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not activate user.' };
  }

  redirect(`/tickets-command/users/${userId}`);
}
