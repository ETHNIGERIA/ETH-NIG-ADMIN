'use server';

import { redirect } from 'next/navigation';
import { ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminAccount } from '@/tickets-portal/types/admin-accounts';

export type AdminActionState = { error?: string } | undefined;

export async function deactivateAdminAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const adminId = String(formData.get('adminId') ?? '').trim();
  if (!adminId) {
    return { error: 'Missing admin.' };
  }

  try {
    await ticketsApiPatch<AdminAccount, Record<string, never>>(`/admin/admins/${adminId}/deactivate`, {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not deactivate admin.' };
  }

  redirect(`/tickets-command/admins/${adminId}`);
}

export async function activateAdminAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const adminId = String(formData.get('adminId') ?? '').trim();
  if (!adminId) {
    return { error: 'Missing admin.' };
  }

  try {
    await ticketsApiPatch<AdminAccount, Record<string, never>>(`/admin/admins/${adminId}/activate`, {});
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not activate admin.' };
  }

  redirect(`/tickets-command/admins/${adminId}`);
}
