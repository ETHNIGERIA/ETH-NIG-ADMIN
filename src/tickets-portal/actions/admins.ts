'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ticketsApiPost, ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminAccount } from '@/tickets-portal/types/admin-accounts';

export type AdminActionState = { error?: string; success?: string } | undefined;

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
    unstable_rethrow(e);
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
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not activate admin.' };
  }

  redirect(`/tickets-command/admins/${adminId}`);
}

export async function inviteAdminAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!email) return { error: 'Email is required.' };
  try {
    await ticketsApiPost('/admin/admins/invitations', { email, name });
    revalidatePath('/tickets-command/admins');
    return { success: 'Invitation sent. The new administrator must set a password before signing in.' };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not send invitation. Check the directory before retrying.' };
  }
}

export async function resendAdminInvitationAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const adminId = String(formData.get('adminId') ?? '').trim();
  if (!adminId) return { error: 'Missing invitation.' };
  try {
    await ticketsApiPost(`/admin/admins/${adminId}/resend-invitation`, {});
    revalidatePath(`/tickets-command/admins/${adminId}`);
    return { success: 'Replacement invitation sent. The previous link no longer works.' };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not resend invitation.' };
  }
}

export async function updateAdminAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const adminId = String(formData.get('adminId') ?? '').trim();
  if (!adminId) return { error: 'Missing admin.' };
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  try {
    await ticketsApiPatch(`/admin/admins/${adminId}`, { email, name, canManageAdmins: formData.get('canManageAdmins') === 'on' });
    revalidatePath('/tickets-command/admins');
    revalidatePath(`/tickets-command/admins/${adminId}`);
    return { success: 'Account updated. Email or permission changes require this administrator to sign in again.' };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not update admin.' };
  }
}
