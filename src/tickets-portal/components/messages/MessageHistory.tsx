'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { listAdminMessagesAction } from '@/tickets-portal/actions/admin-messages';
import { NETWORK_ERROR } from '@/tickets-portal/components/ui/FormModal';
import type { AdminMessageRow, MessageTarget } from '@/tickets-portal/types/admin-messages';

const STATUS: Record<string, { label: string; className: string }> = {
  accepted: { label: 'Sent', className: 'bg-emerald-50 text-emerald-800' },
  permanent_failed: { label: 'Failed', className: 'bg-red-50 text-red-700' },
  outcome_unknown: { label: 'Unconfirmed', className: 'bg-amber-50 text-amber-900' },
};
const SENDING = { label: 'Sending', className: 'bg-stone-100 text-stone-600' };

function fmt(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Collapsed until opened, so lists with many records do not fetch every history. */
export function MessageHistory({
  targetType,
  targetId,
  refreshKey = 0,
  defaultOpen = false,
}: {
  targetType: MessageTarget;
  targetId: string;
  /** Change to reload after a send. */
  refreshKey?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState<{ items?: AdminMessageRow[]; error?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState(null);
    listAdminMessagesAction(targetType, targetId)
      .catch(() => ({ error: NETWORK_ERROR }))
      .then((res) => {
        if (!cancelled) setState(res);
      });
    return () => {
      cancelled = true;
    };
  }, [open, targetType, targetId, refreshKey]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[12px] font-medium uppercase tracking-wide text-stone-400 hover:text-stone-700"
      >
        Message history
        <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className="mt-2">
          {state === null ? (
            <p className="flex items-center gap-2 text-xs text-stone-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
            </p>
          ) : state.error ? (
            <p className="text-xs text-red-700">{state.error}</p>
          ) : !state.items?.length ? (
            <p className="text-xs text-stone-500">No messages sent yet.</p>
          ) : (
            <ul className="space-y-2">
              {state.items.map((m) => {
                const status = STATUS[m.status] ?? SENDING;
                return (
                  <li key={m._id} className="rounded-lg border border-stone-200 p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-stone-900">{m.subject}</p>
                      <span className={clsx('rounded-md px-2 py-0.5 font-medium', status.className)}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-stone-500">
                      {fmt(m.createdAt)}
                      {m.kind === 'approval_confirmation' ? ' · Approval confirmation' : ''}
                      {m.sentByEmail ? ` · by ${m.sentByEmail}` : ''} · to {m.to}
                    </p>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-stone-700">{m.body}</p>
                    {m.status === 'permanent_failed' || m.status === 'outcome_unknown' ? (
                      <p className="mt-1 text-red-700">{m.lastError}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
