'use client';

import { useActionState } from 'react';
import { activateUserAction, deactivateUserAction } from '@/tickets-portal/actions/users';

const btnPrimary =
  'rounded-md bg-stone-900 px-4 py-2 text-[14px] font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'rounded-md border border-red-200 bg-white px-4 py-2 text-[14px] font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50';

export function UserDetailActions({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [deactivateState, deactivateAction] = useActionState(deactivateUserAction, undefined);
  const [activateState, activateAction] = useActionState(activateUserAction, undefined);

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
              if (!window.confirm('Deactivate this user? They will no longer be able to sign in.')) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="userId" value={userId} />
            <button type="submit" className={btnDanger}>
              Deactivate user
            </button>
          </form>
        ) : (
          <form action={activateAction}>
            <input type="hidden" name="userId" value={userId} />
            <button type="submit" className={btnPrimary}>
              Activate user
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
