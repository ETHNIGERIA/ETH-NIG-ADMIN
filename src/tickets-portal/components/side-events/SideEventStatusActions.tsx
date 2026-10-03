'use client';

import { useActionState, useEffect } from 'react';
import {
  setSideEventStatusAction,
  type SideEventActionState,
} from '@/tickets-portal/actions/side-events';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';

const NEXT: Record<AdminSideEvent['status'], Array<'published' | 'archived'>> = {
  draft: ['published', 'archived'],
  published: ['archived'],
  archived: ['published'],
};

export function SideEventStatusActions({ event, disabled = false, onPendingChange }: { event: AdminSideEvent; disabled?: boolean; onPendingChange?: (pending: boolean) => void }) {
  const [state, formAction, pending] = useActionState(setSideEventStatusAction, undefined as SideEventActionState);
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {NEXT[event.status].map((status) => (
          <form
            key={status}
            action={formAction}
            onSubmit={(e) => {
              if (disabled || pending) { e.preventDefault(); return; }
              const ok =
                status === 'published'
                  ? window.confirm(
                      event.locked
                        ? 'Republish this side event?'
                        : 'Publish now? Slug, main event, schedule and admission are locked after publishing.',
                    )
                  : window.confirm('Archive? It leaves public listings and stops new registrations. Issued passes stay valid.');
              if (!ok) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={event._id} readOnly />
            <input type="hidden" name="version" value={event.version} readOnly />
            <input type="hidden" name="status" value={status} readOnly />
            <button
              type="submit"
              disabled={pending || disabled}
              className={
                status === 'published'
                  ? 'rounded-md bg-emerald-700 px-4 py-2 text-[14px] font-medium text-white hover:bg-emerald-800 disabled:opacity-50'
                  : 'rounded-md border border-stone-300 bg-white px-4 py-2 text-[14px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50'
              }
            >
              {pending ? 'Working…' : status === 'published' ? 'Publish' : 'Archive'}
            </button>
          </form>
        ))}
      </div>
      {state?.error ? <p role="alert" className="whitespace-pre-line text-[13px] text-red-700">{state.error}</p> : null}
      {state?.notice ? <p role="status" className="text-[13px] text-emerald-700">{state.notice}</p> : null}
    </div>
  );
}
