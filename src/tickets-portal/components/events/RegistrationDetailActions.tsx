'use client';

import { useActionState } from 'react';
import { cancelRegistrationAction, confirmRegistrationAction } from '@/tickets-portal/actions/registrations';
import type { RegistrationStatus } from '@/tickets-portal/types/admin-registrations';

const btnPrimary =
  'rounded-md bg-stone-900 px-4 py-2 text-[14px] font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'rounded-md border border-red-200 bg-white px-4 py-2 text-[14px] font-medium text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50';

export function RegistrationDetailActions({
  eventId,
  registrationId,
  status,
}: {
  eventId: string;
  registrationId: string;
  status: RegistrationStatus;
}) {
  const [confirmState, confirmAction] = useActionState(confirmRegistrationAction, undefined);
  const [cancelState, cancelAction] = useActionState(cancelRegistrationAction, undefined);

  const canConfirm = status === 'pending';
  const canCancel = status !== 'cancelled';

  const err = confirmState?.error ?? cancelState?.error;

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-[13px] text-red-900">
          {err}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {canConfirm ? (
          <form action={confirmAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="registrationId" value={registrationId} />
            <button type="submit" className={btnPrimary}>
              Confirm registration
            </button>
          </form>
        ) : null}
        {canCancel ? (
          <form
            action={cancelAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  'Cancel this registration? Its status will be set to cancelled in the ticketing API.',
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="registrationId" value={registrationId} />
            <button type="submit" className={btnDanger}>
              Cancel registration
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
