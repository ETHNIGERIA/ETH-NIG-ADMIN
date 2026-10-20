'use client';

import { useActionState } from 'react';
import { inviteAdminAction, resendAdminInvitationAction, updateAdminAction } from '@/tickets-portal/actions/admins';
import type { AdminAccount } from '@/tickets-portal/types/admin-accounts';

const field = 'w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900';
const button = 'rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50';
function Result({ state }: { state: { error?: string; success?: string } | undefined }) {
  return state?.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : state?.success ? <p role="status" className="text-sm text-emerald-700">{state.success}</p> : null;
}
export function AdminInviteForm() {
  const [state, action, pending] = useActionState(inviteAdminAction, undefined);
  return <details className="rounded-lg border border-stone-200 bg-white p-5">
    <summary className="cursor-pointer font-medium text-stone-900">Invite administrator</summary>
    <form action={action} className="mt-4 max-w-lg space-y-4">
      <p className="text-sm text-stone-600">The recipient sets their own password. New administrators cannot manage accounts until you grant that permission.</p>
      <label className="block text-sm text-stone-700">Name<input name="name" maxLength={150} className={field} /></label>
      <label className="block text-sm text-stone-700">Email<input name="email" type="email" required maxLength={254} className={field} /></label>
      <Result state={state} /><button disabled={pending} className={button}>{pending ? 'Sending…' : 'Send invitation'}</button>
    </form>
  </details>;
}
export function AdminEditForm({ admin }: { admin: AdminAccount }) {
  const [state, action, pending] = useActionState(updateAdminAction, undefined);
  return <form action={action} className="max-w-lg space-y-4">
    <input type="hidden" name="adminId" value={admin._id} />
    <label className="block text-sm text-stone-700">Name<input name="name" defaultValue={admin.name ?? ''} maxLength={150} className={field} /></label>
    <label className="block text-sm text-stone-700">Email<input name="email" type="email" defaultValue={admin.email} required maxLength={254} className={field} /></label>
    <label className="flex items-start gap-2 text-sm text-stone-700"><input type="checkbox" name="canManageAdmins" defaultChecked={admin.canManageAdmins} className="mt-1" />Allow this administrator to invite and manage administrator accounts</label>
    <p className="text-xs text-stone-500">Changing email or permissions ends this administrator’s current sessions. At least one active account manager must remain.</p>
    <Result state={state} /><button disabled={pending} className={button}>{pending ? 'Saving…' : 'Save account'}</button>
  </form>;
}
export function ResendAdminInvitationForm({ adminId }: { adminId: string }) {
  const [state, action, pending] = useActionState(resendAdminInvitationAction, undefined);
  return <form action={action} className="space-y-3">
    <input type="hidden" name="adminId" value={adminId} /><Result state={state} />
    <button disabled={pending} className={button}>{pending ? 'Sending…' : 'Resend invitation'}</button>
    <p className="text-xs text-stone-500">Available one minute after the previous invitation. Resending replaces the old link.</p>
  </form>;
}
