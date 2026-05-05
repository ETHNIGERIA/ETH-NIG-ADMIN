'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import {
  deleteEventAction,
  setEventStatusAction,
  updateEventAction,
  type ActionState,
} from '@/tickets-portal/actions/events';
import type { AdminEvent, EventStatus } from '@/tickets-portal/types/admin-events';
import { toDatetimeLocalValue } from '@/tickets-portal/lib/datetime-local';
import { DetailIntegrationHint } from '@/tickets-portal/components/events/IntegrationHintCollapsible';
import { EventTiersSection } from '@/tickets-portal/components/events/EventTiersSection';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

function StatusBadge({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    draft: 'bg-stone-100 text-stone-700',
    published: 'bg-emerald-50 text-emerald-800',
    archived: 'bg-amber-50 text-amber-900',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export function EventDetailForms({
  event,
  eventId,
  tiers,
}: {
  event: AdminEvent;
  eventId: string;
  tiers: AdminTicketTier[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateEventAction, undefined as ActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteEventAction, undefined as ActionState);
  const [statusState, statusAction, statusPending] = useActionState(setEventStatusAction, undefined as ActionState);

  const originsText = (event.allowedOrigins ?? []).join('\n');

  const tierCount = tiers.length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[13px] text-stone-500">Status</span>
        <StatusBadge status={event.status} />
        <span className="text-[13px] text-stone-400" aria-hidden>
          ·
        </span>
        <span className="text-[13px] text-stone-600">
          {tierCount === 0
            ? 'No ticket tiers yet'
            : tierCount === 1
              ? '1 ticket tier'
              : `${tierCount} ticket tiers`}
        </span>
      </div>

      {statusState?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
          {statusState.error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <span className="w-full text-[13px] font-medium text-stone-500">Set status</span>
        {(['draft', 'published', 'archived'] as const).map((s) => (
          <form key={s} action={statusAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="status" value={s} />
            <button
              type="submit"
              disabled={statusPending || event.status === s}
              className="rounded-md border border-stone-200 px-3 py-1.5 text-[13px] capitalize text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              {s}
            </button>
          </form>
        ))}
      </div>

      <div className="border-t border-stone-100 pt-8">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Details</h2>
        <p className="mt-1 font-mono text-[14px] text-stone-600">{event.slug}</p>
        <DetailIntegrationHint />

        {updateState?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
            {updateState.error}
          </div>
        ) : null}

        <form action={updateAction} className="mt-6 max-w-lg space-y-5">
          <input type="hidden" name="eventId" value={eventId} />

          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={event.name}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="startsAt" className={labelClass}>
              Starts
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(event.startsAt)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="endsAt" className={labelClass}>
              Ends
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(event.endsAt)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="allowedOrigins" className={labelClass}>
              Allowed origins
            </label>
            <textarea
              id="allowedOrigins"
              name="allowedOrigins"
              rows={3}
              defaultValue={originsText}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={updatePending}
            className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {updatePending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="border-t border-stone-100 pt-10">
        <EventTiersSection eventId={eventId} initialTiers={tiers} />
      </div>

      <div className="border-t border-stone-200 pt-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-red-800/80">Danger zone</p>
        <div className="rounded-lg border-2 border-red-400 bg-red-50/50 px-4 py-4">
          {deleteState?.error ? (
            <div className="mb-3 rounded-md border border-red-200 bg-white px-3 py-2 text-[14px] text-red-800">
              {deleteState.error}
            </div>
          ) : null}
          <p className="text-[13px] text-red-900/90">Permanently soft-deletes this event in the API.</p>
          <form action={deleteAction} className="mt-4">
            <input type="hidden" name="eventId" value={eventId} />
            <button
              type="submit"
              disabled={deletePending}
              className="rounded-md border border-red-500 bg-white px-4 py-2 text-[14px] font-medium text-red-800 hover:bg-red-100/80 disabled:opacity-50"
            >
              {deletePending ? 'Deleting…' : 'Delete event'}
            </button>
          </form>
        </div>
        <div className="mt-6">
          <Link href="/tickets-command/events" className="text-[14px] text-stone-600 hover:text-stone-900">
            ← All events
          </Link>
        </div>
      </div>
    </div>
  );
}
