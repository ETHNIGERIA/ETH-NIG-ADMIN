'use client';

import { useActionState } from 'react';
import { cancelRegistrationAction, confirmRegistrationAction, sendPaymentReminderAction } from '@/tickets-portal/actions/registrations';
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
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmRegistrationAction, undefined);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelRegistrationAction, undefined);
  const [reminderState, reminderAction, reminderPending] = useActionState(sendPaymentReminderAction, undefined);

  const canConfirm = status === 'pending';
  const canCancel = status !== 'cancelled';

  const err = confirmState?.error ?? cancelState?.error ?? reminderState?.error;

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-[13px] text-red-900">
          {err}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {canConfirm ? (
          <form
            action={confirmAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  'Confirm this registration?\n\nIf it has a Paystack payment, the payment is verified with Paystack first — confirmation is refused if that payment is not successful. On success (or when there is no payment on record) tickets are issued and the confirmation email is sent to the attendee.',
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="registrationId" value={registrationId} />
            <button type="submit" className={btnPrimary} disabled={confirmPending}>
              {confirmPending ? 'Confirming…' : 'Confirm registration'}
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
            <button type="submit" className={btnDanger} disabled={cancelPending}>
              {cancelPending ? 'Cancelling…' : 'Cancel registration'}
            </button>
          </form>
        ) : null}
        {canConfirm ? (
          <form action={reminderAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="registrationId" value={registrationId} />
            <button type="submit" disabled={reminderPending} className="rounded-md border border-stone-300 px-4 py-2 text-[14px] font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50">
              {reminderPending ? 'Sending…' : 'Send payment reminder'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
