'use client';

import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';

/**
 * Submit button for the event console status form. Moving to approved emails
 * the applicant, so that choice asks for confirmation before submitting.
 */
export function ApplicationStatusSubmit({
  currentStatus,
  recipientEmail,
}: {
  currentStatus: string;
  recipientEmail: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [confirm, setConfirm] = useState(false);

  const submit = () => ref.current?.form?.requestSubmit();
  const onClick = () => {
    const chosen = (ref.current?.form?.elements.namedItem('status') as HTMLSelectElement | null)?.value;
    if (chosen === 'approved' && currentStatus !== 'approved') setConfirm(true);
    else submit();
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
      >
        Save status
      </button>
      {confirm ? (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            submit();
          }}
          variant="warning"
          title="Approve application"
          description={`Approving sends an acceptance confirmation email to ${recipientEmail}.`}
          implications={[
            'It is sent within a minute, and skipped if the application is rejected or deleted first.',
            "It is saved to the application's message history.",
          ]}
          confirmLabel="Approve and send email"
        />
      ) : null}
    </>
  );
}
