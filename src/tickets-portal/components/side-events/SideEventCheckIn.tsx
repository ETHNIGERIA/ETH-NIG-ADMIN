'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  checkInSideEventAction,
  type SideEventActionState,
} from '@/tickets-portal/actions/side-events';
import type { SideEventDay } from '@/tickets-portal/types/admin-side-events';
import { formatInZone, isoToZonedWallTime } from '@/tickets-portal/lib/zoned-time';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';

/**
 * Door check-in for one side-event day. The server only accepts passes issued
 * for this side event, for a confirmed registration, once per day.
 */
export function SideEventCheckIn({
  eventId,
  days,
  timezone,
}: {
  eventId: string;
  days: SideEventDay[];
  timezone: string;
}) {
  const [state, formAction, pending] = useActionState(checkInSideEventAction, undefined as SideEventActionState);
  const [dayKey, setDayKey] = useState('');
  useEffect(() => {
    const today = isoToZonedWallTime(new Date().toISOString(), timezone).date;
    setDayKey(days.find((day) => isoToZonedWallTime(day.startsAt, timezone).date === today)?.key ?? '');
  }, [days, timezone]);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <input type="hidden" name="id" value={eventId} readOnly />
      <div>
        <label htmlFor="ci-day" className="mb-1.5 block text-[13px] font-medium text-stone-700">Day</label>
        <select id="ci-day" name="dayKey" required disabled={pending} value={dayKey} onChange={(e) => setDayKey(e.target.value)} className={fieldClass}>
          <option value="" disabled>Choose a scheduled day</option>
          {days.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label} — {formatInZone(d.startsAt, timezone)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-500">Today is selected when scheduled. Check the day before admitting an attendee. Times are in {timezone}.</p>
      </div>
      <div>
        <label htmlFor="ci-code" className="mb-1.5 block text-[13px] font-medium text-stone-700">Ticket code</label>
        <input id="ci-code" name="code" required autoComplete="off" className={`${fieldClass} font-mono uppercase`} placeholder="A1B2C3D4E5F6" />
      </div>
      <button type="submit" disabled={pending} className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50">
        {pending ? 'Checking…' : 'Check in'}
      </button>
      {state?.error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-[14px] text-red-800">{state.error}</p> : null}
      {state?.notice ? <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-[14px] text-emerald-800">{state.notice}</p> : null}
    </form>
  );
}
