'use client';

import { startTransition, useActionState, useState } from 'react';
import {
  updatePartnerApplicationStatusAction,
  updateSpeakerApplicationStatusAction,
  updateSponsorApplicationStatusAction,
  type ApplicationActionState,
} from '@/tickets-portal/actions/applications';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';

export function ApplicationStatusActions({
  kind,
  applicationId,
  eventId,
  currentStatus,
  recipientEmail,
}: {
  kind: 'partner' | 'sponsor' | 'speaker';
  applicationId: string;
  eventId: string;
  currentStatus?: string;
  /** Shown in the approval notice: approving emails this address. */
  recipientEmail?: string;
}) {
  const action =
    kind === 'partner'
      ? updatePartnerApplicationStatusAction
      : kind === 'sponsor'
        ? updateSponsorApplicationStatusAction
        : updateSpeakerApplicationStatusAction;
  const [state, formAction, pending] = useActionState(
    action,
    undefined as ApplicationActionState,
  );
  const status = (currentStatus ?? '').toLowerCase();
  const approved = status === 'approved';
  const rejected = status === 'rejected';
  const [confirmApprove, setConfirmApprove] = useState(false);

  const approve = () => {
    setConfirmApprove(false);
    const fd = new FormData();
    fd.set('applicationId', applicationId);
    fd.set('eventId', eventId);
    fd.set('status', 'approved');
    startTransition(() => formAction(fd));
  };

  return (
    <div className="space-y-2">
      {state?.error ? (
        <p className="text-[12px] text-red-800">{state.error}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Approving emails the applicant, so it goes through a confirmation first. */}
        <button
          type="button"
          onClick={() => setConfirmApprove(true)}
          disabled={pending || approved}
          className="rounded-md bg-stone-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-stone-800 disabled:opacity-40"
        >
          {approved ? 'Approved' : pending ? 'Saving…' : 'Approve'}
        </button>
        <form action={formAction}>
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="status" value="rejected" />
          <button
            type="submit"
            disabled={pending || rejected}
            className="rounded-md border border-stone-200 px-2.5 py-1.5 text-[12px] text-stone-600 hover:bg-stone-50 disabled:opacity-40"
          >
            {rejected ? 'Rejected' : 'Reject'}
          </button>
        </form>
      </div>
      {confirmApprove ? (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmApprove(false)}
          onConfirm={approve}
          variant="warning"
          title={`Approve ${kind} application`}
          description={`Approving sends an acceptance confirmation email to ${recipientEmail ?? 'the applicant'}.`}
          implications={['The email is sent right away and cannot be recalled.', "It is saved to the application's message history."]}
          confirmLabel="Approve and send email"
        />
      ) : null}
    </div>
  );
}
