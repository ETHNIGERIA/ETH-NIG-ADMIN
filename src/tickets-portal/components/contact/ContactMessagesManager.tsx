'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { updateContactMessageStatusAction } from '@/tickets-portal/actions/contact';
import type { ActionState } from '@/tickets-portal/actions/events';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import {
  CONTACT_MESSAGE_STATUSES,
  type ContactMessage,
  type ContactMessageStatus,
} from '@/tickets-portal/types/admin-contact';

const STATUS_STYLES: Record<ContactMessageStatus, string> = {
  new: 'bg-emerald-50 text-emerald-800',
  read: 'bg-blue-50 text-blue-700',
  replied: 'bg-violet-50 text-violet-700',
  archived: 'bg-stone-100 text-stone-600',
};

function fmt(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const th =
  'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
const td = 'px-4 py-3 align-top text-sm text-stone-700';

export function ContactMessagesManager({ items }: { items: ContactMessage[] }) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | ContactMessageStatus>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const [state, action, pending] = useActionState(
    updateContactMessageStatusAction,
    undefined as ActionState,
  );
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state?.error) toast.error('Could not update', state.error);
      else toast.success('Updated');
    }
    wasPending.current = pending;
  }, [pending, state, toast]);

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? items
        : items.filter((m) => m.status === statusFilter),
    [items, statusFilter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {filtered.length} of {items.length}{' '}
          {items.length === 1 ? 'message' : 'messages'}
        </p>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | ContactMessageStatus)
          }
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm capitalize text-stone-800 outline-none focus:border-stone-400"
        >
          <option value="all">All statuses</option>
          {CONTACT_MESSAGE_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-stone-500">
            {items.length === 0
              ? 'No messages yet.'
              : 'No messages match this filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-stone-200/80 bg-stone-50/75">
                <tr>
                  <th className={th}>From</th>
                  <th className={th}>Subject</th>
                  <th className={th}>Received</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((m) => (
                  <tr
                    key={m._id}
                    onClick={() => setSelected(m)}
                    className="cursor-pointer transition-colors hover:bg-stone-50/70"
                  >
                    <td className={td}>
                      <p className="font-medium text-stone-900">{m.name}</p>
                      <p className="text-xs text-stone-500">{m.email}</p>
                    </td>
                    <td className={clsx(td, 'max-w-xs')}>
                      <p className="line-clamp-1 text-stone-800">{m.subject}</p>
                      <p className="line-clamp-1 text-xs text-stone-500">
                        {m.message}
                      </p>
                    </td>
                    <td className={clsx(td, 'whitespace-nowrap text-xs text-stone-500')}>
                      {fmt(m.createdAt)}
                    </td>
                    <td className={clsx(td, 'whitespace-nowrap')}>
                      <span
                        className={clsx(
                          'rounded-md px-2 py-0.5 text-[12px] font-medium capitalize',
                          STATUS_STYLES[m.status],
                        )}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-stone-900">
                  {selected.subject}
                </h2>
                <p className="mt-0.5 text-[13px] text-stone-500">
                  {selected.name} · {fmt(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-stone-600">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="text-stone-800 underline underline-offset-2 hover:text-stone-950"
                >
                  {selected.email}
                </a>
                {selected.phone ? <span>{selected.phone}</span> : null}
              </div>

              <p className="whitespace-pre-wrap text-stone-800">{selected.message}</p>

              <div className="border-t border-stone-100 pt-4">
                <p className="text-[12px] font-medium uppercase tracking-wide text-stone-400">
                  Status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CONTACT_MESSAGE_STATUSES.map((s) => (
                    <form key={s} action={action}>
                      <input type="hidden" name="id" value={selected._id} />
                      <input type="hidden" name="status" value={s} />
                      <button
                        type="submit"
                        disabled={pending || selected.status === s}
                        className="rounded-md border border-stone-200 px-3 py-1.5 text-[13px] capitalize text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                      >
                        {s}
                      </button>
                    </form>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-stone-500">
                  Current:{' '}
                  <span className="font-medium capitalize text-stone-700">
                    {selected.status}
                  </span>{' '}
                  · changes apply on the next list refresh
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
