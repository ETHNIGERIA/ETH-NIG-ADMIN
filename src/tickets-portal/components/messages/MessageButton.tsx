'use client';

import { useState, type ReactNode } from 'react';
import { Mail } from 'lucide-react';
import { MessageComposer } from '@/tickets-portal/components/messages/MessageComposer';
import { MessageHistory } from '@/tickets-portal/components/messages/MessageHistory';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import type { SendMessageState } from '@/tickets-portal/actions/admin-messages';
import type { MessageTarget } from '@/tickets-portal/types/admin-messages';

export const messageButtonClass =
  'inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 disabled:opacity-40';

/** Toast for a finished send; shared by every place that opens the composer. */
export function useMessageSentToast() {
  const toast = useToast();
  return (res: NonNullable<SendMessageState>) => {
    const queued = res.queued ?? 0;
    const missing = res.notFound ? ` ${res.notFound} skipped (deleted or not found).` : '';
    toast.success('Email queued', `${queued} ${queued === 1 ? 'email' : 'emails'} sending now.${missing}`);
  };
}

/** Button that opens the composer for the given records. Usable inside server-rendered pages. */
export function MessageButton({
  targetType,
  ids,
  recipientLabel,
  children,
  onSent,
}: {
  targetType: MessageTarget;
  ids: string[];
  recipientLabel?: string;
  children: ReactNode;
  onSent?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const sentToast = useMessageSentToast();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={ids.length === 0} className={messageButtonClass}>
        <Mail className="h-3.5 w-3.5" />
        {children}
      </button>
      {open ? (
        <MessageComposer
          targetType={targetType}
          ids={ids}
          recipientLabel={recipientLabel}
          onClose={() => setOpen(false)}
          onSent={(res) => {
            setOpen(false);
            sentToast(res);
            onSent?.();
          }}
        />
      ) : null}
    </>
  );
}

/** Message button plus that record's history, reloaded after each send. */
export function MessagePanel({
  targetType,
  targetId,
  recipientLabel,
}: {
  targetType: MessageTarget;
  targetId: string;
  recipientLabel: string;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-2">
      <MessageButton
        targetType={targetType}
        ids={[targetId]}
        recipientLabel={recipientLabel}
        onSent={() => setRefreshKey((k) => k + 1)}
      >
        Message
      </MessageButton>
      <MessageHistory targetType={targetType} targetId={targetId} refreshKey={refreshKey} />
    </div>
  );
}
