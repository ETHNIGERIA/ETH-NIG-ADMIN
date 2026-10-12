'use client';

import { useActionState, useState } from 'react';
import { deleteEventAction, setEventStatusAction, updateEventAction, type ActionState } from '@/tickets-portal/actions/events';
import { EventDaysEditor } from '@/tickets-portal/components/events/EventDaysEditor';
import { DetailIntegrationHint } from '@/tickets-portal/components/events/IntegrationHintCollapsible';
import { consoleCard, consoleField, consoleLabel } from '@/tickets-portal/components/events-v2/SectionHeader';
import { toDatetimeLocalValue } from '@/tickets-portal/lib/datetime-local';
import { TIMEZONE_OPTIONS } from '@/tickets-portal/lib/timezones';
import type { AdminEvent, EventStatus } from '@/tickets-portal/types/admin-events';

export function EventSettings({ event }: { event: AdminEvent }) {
  const [updateState, updateAction, updating] = useActionState(updateEventAction, undefined as ActionState);
  const [statusState, statusAction, statusPending] = useActionState(setEventStatusAction, undefined as ActionState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteEventAction, undefined as ActionState);
  const [clearDays, setClearDays] = useState(false);
  const returnTo = `/tickets-command/events-v2/${event._id}/settings`;

  return (
    <div className="space-y-7">
      <section className={consoleCard}>
        <div className="border-b border-stone-100 pb-4">
          <h3 className="text-base font-semibold text-stone-900">Publication status</h3>
          <p className="mt-1 text-sm text-stone-500">Control whether this event is draft, published or archived.</p>
        </div>
        {statusState?.error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{statusState.error}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="mr-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold capitalize text-stone-700">Current: {event.status}</span>
          {(['draft', 'published', 'archived'] as EventStatus[]).map((status) => (
            <form key={status} action={statusAction}>
              <input type="hidden" name="eventId" value={event._id} />
              <input type="hidden" name="status" value={status} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button type="submit" disabled={statusPending || event.status === status} className="rounded-lg border border-stone-200 px-3.5 py-2 text-sm font-medium capitalize text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40">{status}</button>
            </form>
          ))}
        </div>
      </section>

      <section className={consoleCard}>
        <div className="border-b border-stone-100 pb-4">
          <h3 className="text-base font-semibold text-stone-900">Event identity & schedule</h3>
          <p className="mt-1 text-sm text-stone-500">Dates and configured days affect checkout and check-in. Review them before saving.</p>
        </div>
        {updateState?.error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{updateState.error}</p> : null}
        <form action={updateAction} className="mt-5 space-y-5">
          <input type="hidden" name="eventId" value={event._id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="v2-event-name" className={consoleLabel}>Event name</label>
              <input id="v2-event-name" name="name" required defaultValue={event.name} className={consoleField} />
            </div>
            <div>
              <label htmlFor="v2-start" className={consoleLabel}>Starts</label>
              <input id="v2-start" name="startsAt" type="datetime-local" required defaultValue={toDatetimeLocalValue(event.startsAt)} className={consoleField} />
            </div>
            <div>
              <label htmlFor="v2-end" className={consoleLabel}>Ends</label>
              <input id="v2-end" name="endsAt" type="datetime-local" required defaultValue={toDatetimeLocalValue(event.endsAt)} className={consoleField} />
            </div>
            <div>
              <label htmlFor="v2-timezone" className={consoleLabel}>Timezone</label>
              <select id="v2-timezone" name="timezone" defaultValue={event.timezone ?? 'Africa/Lagos'} className={consoleField}>
                {!TIMEZONE_OPTIONS.includes(event.timezone as (typeof TIMEZONE_OPTIONS)[number]) ? <option value={event.timezone}>{event.timezone}</option> : null}
                {TIMEZONE_OPTIONS.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
              </select>
            </div>
            <div>
              <span className={consoleLabel}>Event slug</span>
              <p className="rounded-lg border border-stone-200 bg-stone-50 px-3.5 py-2.5 font-mono text-sm text-stone-600">{event.slug}</p>
            </div>
          </div>
          <div className="border-t border-stone-100 pt-5">
            <h4 className="mb-2 text-sm font-semibold text-stone-900">Event days</h4>
            <EventDaysEditor initialDays={event.days} />
            {event.days?.length ? (
              <label className="mt-3 flex items-start gap-2 text-xs text-stone-600">
                <input type="checkbox" name="clearDays" checked={clearDays} onChange={(e) => setClearDays(e.target.checked)} className="mt-0.5" />
                Clear all configured days when saving
              </label>
            ) : null}
          </div>
          <div className="border-t border-stone-100 pt-5">
            <label htmlFor="v2-origins" className={consoleLabel}>Allowed origins</label>
            <textarea id="v2-origins" name="allowedOrigins" rows={3} defaultValue={(event.allowedOrigins ?? []).join('\n')} className={`${consoleField} resize-y`} />
            <p className="mt-1.5 text-xs text-stone-500">One origin per line. Used by the ticketing integration.</p>
            <div className="mt-3"><DetailIntegrationHint /></div>
          </div>
          <div className="flex justify-end border-t border-stone-100 pt-5">
            <button type="submit" disabled={updating} className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50">{updating ? 'Saving…' : 'Save event settings'}</button>
          </div>
        </form>
      </section>

      <details className="rounded-xl border border-red-200 bg-white">
        <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-red-800">Danger zone</summary>
        <div className="border-t border-red-100 px-5 py-5">
          <p className="text-sm text-stone-600">Deleting soft-deletes this event. Use archive to keep the record without publishing it.</p>
          {deleteState?.error ? <p role="alert" className="mt-3 text-sm text-red-700">{deleteState.error}</p> : null}
          <form action={deleteAction} className="mt-4 flex flex-wrap items-center gap-3">
            <input type="hidden" name="eventId" value={event._id} />
            <input type="hidden" name="returnTo" value="/tickets-command/events-v2" />
            <label className="flex w-full items-center gap-2 text-xs text-red-800"><input type="checkbox" required /> I understand this event will be removed from the dashboard.</label>
            <button type="submit" disabled={deleting} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete event'}</button>
          </form>
        </div>
      </details>
    </div>
  );
}
