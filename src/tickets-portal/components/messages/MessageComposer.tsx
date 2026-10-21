'use client';

import React, { useState, useTransition } from 'react';
import { Mail } from 'lucide-react';
import { sendAdminMessageAction, type SendMessageState } from '@/tickets-portal/actions/admin-messages';
import {
  FormModal,
  FormModalActions,
  NETWORK_ERROR,
  formFieldClass,
  formLabelClass,
} from '@/tickets-portal/components/ui/FormModal';
import {
  MESSAGE_BODY_MAX,
  MESSAGE_SUBJECT_MAX,
  type MessageTarget,
} from '@/tickets-portal/types/admin-messages';

/**
 * Email form for one or many records. The request key lives for the whole dialog:
 * an error here may be a timeout after the API already queued the emails, so a
 * resubmit must reuse it. Rows exist only if queuing succeeded, so after a real
 * rejection the same key still queues the corrected message.
 */
export function MessageComposer({
  targetType,
  ids,
  recipientLabel,
  defaultSubject,
  onClose,
  onSent,
}: {
  targetType: MessageTarget;
  ids: string[];
  /** Name shown when there is one recipient. */
  recipientLabel?: string;
  defaultSubject?: string;
  onClose: () => void;
  onSent: (res: NonNullable<SendMessageState>) => void;
}) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const count = ids.length;
  const single = count === 1;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await sendAdminMessageAction({
          targetType,
          ids,
          subject: String(fd.get('subject') ?? ''),
          body: String(fd.get('body') ?? ''),
          requestKey,
        });
        if (res?.error) {
          setError(res.error);
          return;
        }
        onSent(res ?? {});
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  };

  return (
    <FormModal
      title={single && recipientLabel ? `Message ${recipientLabel}` : `Message ${count} recipients`}
      description="Sent by email and saved to each record's message history."
      error={error}
      isPending={isPending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className={formLabelClass} htmlFor="msg-subject">
            Subject
          </label>
          <input
            id="msg-subject"
            name="subject"
            required
            maxLength={MESSAGE_SUBJECT_MAX}
            defaultValue={defaultSubject}
            className={formFieldClass}
          />
        </div>
        <div>
          <label className={formLabelClass} htmlFor="msg-body">
            Message
          </label>
          <textarea
            id="msg-body"
            name="body"
            required
            rows={8}
            maxLength={MESSAGE_BODY_MAX}
            className={formFieldClass}
          />
        </div>
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {single
            ? 'This emails the recipient now. It cannot be recalled once sent.'
            : `This emails ${count} recipients now, one email each. It cannot be recalled once sent.`}
        </p>
        <FormModalActions
          isPending={isPending}
          onCancel={onClose}
          submitLabel={single ? 'Send email' : `Send ${count} emails`}
        />
      </form>
    </FormModal>
  );
}
