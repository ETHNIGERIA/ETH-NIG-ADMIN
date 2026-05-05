'use client';

import { useActionState } from 'react';
import { activateAdminAction, deactivateAdminAction } from '@/tickets-portal/actions/admins';

const btnPrimary =
  'rounded-md bg-stone-900 px-4 py-2 text-[14px] font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'rounded-md border border-red-200 bg-white px-4 py-2 text-[14px] font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50';

export function AdminDetailActions({
  adminId,
  isActive,
}: {
  adminId: string;
  isActive: boolean;
}) {
  const [deactivateState, deactivateAction] = useActionState(deactivateAdminAction, undefined);
  const [activateState, activateAction] = useActionState(activateAdminAction, undefined);

  const err = deactivateState?.error ?? activateState?.error;

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-[13px] text-red-900">
          {err}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {isActive ? (
          <form
            action={deactivateAction}
            onSubmit={(e) => {
              if (!window.confirm('Deactivate this admin account?')) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="adminId" value={adminId} />
            <button type="submit" className={btnDanger}>
              Deactivate admin
            </button>
          </form>
        ) : (
          <form action={activateAction}>
            <input type="hidden" name="adminId" value={adminId} />
            <button type="submit" className={btnPrimary}>
              Activate admin
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
