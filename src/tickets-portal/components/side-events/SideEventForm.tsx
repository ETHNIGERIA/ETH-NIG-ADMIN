'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  createSideEventAction,
  searchMainEventsAction,
  updateSideEventAction,
  type SideEventActionState,
} from '@/tickets-portal/actions/side-events';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import type { EventOption } from '@/tickets-portal/actions/events';
import { EventCombobox } from '@/tickets-portal/components/ui/EventCombobox';
import { BenefitsListEditor } from '@/tickets-portal/components/events/BenefitsListEditor';
import { FlyerField } from '@/tickets-portal/components/side-events/FlyerField';
import { slugifyFromTitle } from '@/tickets-portal/lib/slugify';
import { TIMEZONE_OPTIONS } from '@/tickets-portal/lib/timezones';
import { isoToZonedWallTime } from '@/tickets-portal/lib/zoned-time';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-50 disabled:text-stone-500';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';
const hintClass = 'mt-1.5 text-[12px] text-stone-500';
const STANDALONE: EventOption = { id: '', name: 'Standalone (no main event)' };

type Session = { id: string; key: string; date: string; label: string; startTime: string; endTime: string };

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function sessionsFrom(event: AdminSideEvent | undefined): Session[] {
  if (!event) return [{ id: newId(), key: 'day-1', date: '', label: 'Day 1', startTime: '10:00', endTime: '14:00' }];
  return event.days.map((day) => {
    const start = isoToZonedWallTime(day.startsAt, event.timezone);
    const end = isoToZonedWallTime(day.endsAt, event.timezone);
    return { id: newId(), key: day.key, date: start.date, label: day.label, startTime: start.time, endTime: end.time };
  });
}

function LockedNote({ locked }: { locked: boolean }) {
  return locked ? <span className="ml-1 font-normal text-amber-700">(locked after publication)</span> : null;
}

export function SideEventForm({
  event,
  initialParent,
  currencies,
  onDirtyChange,
  onPendingChange,
  disabled = false,
}: {
  /** Omit to create. */
  event?: AdminSideEvent;
  /** Create only: preselected main event. */
  initialParent?: EventOption | null;
  currencies: string[];
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
  disabled?: boolean;
}) {
  const action = event ? updateSideEventAction : createSideEventAction;
  const [state, formAction, pending] = useActionState(action, undefined as SideEventActionState);
  const locked = event?.locked ?? false;
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);
  const [description, setDescription] = useState(event?.description ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [price, setPrice] = useState(event?.admission && !event.admission.isFree ? (event.admission.priceMinor / 100).toFixed(2) : "");
  const [currency, setCurrency] = useState(event?.admission?.currency ?? currencies[0] ?? "NGN");
  const [capacity, setCapacity] = useState(String(event?.admission?.capacity ?? ""));

  const [name, setName] = useState(event?.name ?? '');
  const [slug, setSlug] = useState(event?.slug ?? '');
  const [timezone, setTimezone] = useState(event?.timezone ?? 'Africa/Lagos');
  const [sessions, setSessions] = useState<Session[]>(() => sessionsFrom(event));
  const usedKeys = useRef(new Set(sessions.map((s) => s.key)));
  const [isFree, setIsFree] = useState(event?.admission?.isFree ?? false);
  const [flyerUploading, setFlyerUploading] = useState(false);
  const markDirty = () => onDirtyChange?.(true);

  const sessionsJson = useMemo(
    () => JSON.stringify(sessions.map(({ id: _id, ...s }) => s)),
    [sessions],
  );

  function updateSession(id: string, field: keyof Session, value: string) {
    setSessions((list) => list.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addSession() {
    onDirtyChange?.(true);
    let n = 1;
    while (usedKeys.current.has(`day-${n}`)) n += 1;
    const key = `day-${n}`;
    usedKeys.current.add(key);
    setSessions((list) => [
      ...list,
      { id: newId(), key, date: '', label: `Day ${list.length + 1}`, startTime: '10:00', endTime: '14:00' },
    ]);
  }

  const parentInitial = event
    ? event.parent
      ? { id: event.parent.slug, name: `${event.parent.name} (${event.parent.slug})` }
      : null
    : (initialParent ?? null);

  return (
    <form action={formAction} onChange={() => onDirtyChange?.(true)} className="max-w-2xl">
      <fieldset disabled={pending || disabled} className="space-y-6">
      {event ? (
        <>
          <input type="hidden" name="id" value={event._id} readOnly />
          <input type="hidden" name="version" value={event.version} readOnly />
          <input type="hidden" name="locked" value={String(locked)} readOnly />
        </>
      ) : null}
      <input type="hidden" name="sessionsJson" value={sessionsJson} readOnly />

      {state?.error ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
          {state.error}
        </div>
      ) : null}
      {state?.notice ? (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[14px] text-emerald-800">
          {state.notice}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <label htmlFor="se-name" className={labelClass}>Name</label>
          <input id="se-name" name="name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Ethereum Builder Masterclass" autoComplete="off" />
        </div>

        <div>
          <label htmlFor="se-slug" className={labelClass}>URL slug<LockedNote locked={locked} /></label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="se-slug" name="slug" required disabled={locked} maxLength={100} value={slug} onChange={(e) => setSlug(e.target.value.trim().toLowerCase())} className={`${fieldClass} min-w-0 flex-1 font-mono text-[14px]`} placeholder="ethereum-builder-masterclass" autoComplete="off" />
            {!locked ? (
              <button type="button" onClick={() => { setSlug(slugifyFromTitle(name)); onDirtyChange?.(true); }} disabled={!name.trim()} className="shrink-0 rounded-md border border-stone-200 bg-white px-4 py-2.5 text-[14px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40">
                Generate from name
              </button>
            ) : null}
          </div>
          <p className={hintClass}>Unique across all events. Cannot change once published.</p>
        </div>

        <div>
          <label htmlFor="se-parent" className={labelClass}>Main event<LockedNote locked={locked} /></label>
          <EventCombobox
            name="eventSlug"
            inputId="se-parent"
            initial={parentInitial}
            search={searchMainEventsAction}
            emptyOption={STANDALONE}
            optionLabel={(opt) => opt.name}
            disabled={locked}
            onSelectionChange={() => onDirtyChange?.(true)}
          />
          <p className={hintClass}>Optional. Lists only main events you manage. The main event must be published before this side event can be.</p>
        </div>

        <div>
          <label htmlFor="se-description" className={labelClass}>Description</label>
          <textarea id="se-description" name="description" rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} className={`${fieldClass} resize-y`} placeholder="What attendees will learn or do." />
          <p className={hintClass}>Plain text, shown as written. Required to publish.</p>
        </div>

        <div>
          <label htmlFor="se-venue" className={labelClass}>Venue</label>
          <input id="se-venue" name="venue" maxLength={300} value={venue} onChange={(e) => setVenue(e.target.value)} className={fieldClass} placeholder="Lagos workshop room" />
          <p className={hintClass}>Required to publish.</p>
        </div>

        <div>
          <p className={labelClass}>Flyer <span className="font-normal text-stone-400">(optional)</span></p>
          <FlyerField initialUrl={event?.flyerUrl ?? ''} onChange={markDirty} onUploadingChange={setFlyerUploading} />
          <p className={hintClass}>Shown on the public page. JPG, PNG or WebP, up to 5 MB. Can be changed after publishing.</p>
        </div>

        <div>
          <p className={labelClass}>Benefits <span className="font-normal text-stone-400">(optional)</span></p>
          <BenefitsListEditor initialItems={event?.benefits ?? []} idPrefix="se-benefits" onChange={markDirty} />
          <p className={hintClass}>Up to 20 items, 200 characters each. Can be changed after publishing.</p>
        </div>

        <div>
          <label htmlFor="se-timezone" className={labelClass}>Timezone<LockedNote locked={locked} /></label>
          <select id="se-timezone" name="timezone" disabled={locked} value={timezone} onChange={(e) => setTimezone(e.target.value)} className={fieldClass}>
            {(TIMEZONE_OPTIONS as readonly string[]).includes(timezone) ? null : <option value={timezone}>{timezone}</option>}
            {TIMEZONE_OPTIONS.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className={labelClass}>Schedule<LockedNote locked={locked} /></p>
          <p className="text-[12px] text-stone-500">
            One row per day, in order. Times are local to {timezone}. Days do not need to be consecutive. Each admitted attendee is checked in separately for every day.
          </p>
        </div>
        {sessions.map((s, index) => (
          <fieldset key={s.id} disabled={locked} className="rounded-md border border-stone-200 bg-stone-50/60 p-3">
            <legend className="px-1 text-[13px] font-medium text-stone-800">Day {index + 1} <code className="ml-1 text-[11px] font-normal text-stone-500">{s.key}</code></legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${s.id}-label`}>Session title</label>
                <input id={`${s.id}-label`} required maxLength={120} value={s.label} onChange={(e) => updateSession(s.id, 'label', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${s.id}-date`}>Date</label>
                <input id={`${s.id}-date`} type="date" required value={s.date} onChange={(e) => updateSession(s.id, 'date', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${s.id}-start`}>Starts</label>
                <input id={`${s.id}-start`} type="time" required value={s.startTime} onChange={(e) => updateSession(s.id, 'startTime', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor={`${s.id}-end`}>Ends</label>
                <input id={`${s.id}-end`} type="time" required value={s.endTime} onChange={(e) => updateSession(s.id, 'endTime', e.target.value)} className={fieldClass} />
              </div>
            </div>
            {!locked && sessions.length > 1 ? (
              <button type="button" onClick={() => { setSessions((list) => list.filter((x) => x.id !== s.id)); onDirtyChange?.(true); }} className="mt-3 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 hover:bg-stone-100">
                Remove day
              </button>
            ) : null}
          </fieldset>
        ))}
        {!locked ? (
          <button type="button" onClick={addSession} className="rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50">
            Add day
          </button>
        ) : null}
      </section>

      <fieldset disabled={locked} className="space-y-4 rounded-md border border-stone-200 p-4">
        <legend className="px-1 text-[13px] font-medium text-stone-800">Admission<LockedNote locked={locked} /></legend>
        <p className="text-[12px] text-stone-500">
          One pass covers every listed day. It is sold separately: a main-event ticket does not include it, and it does not include the main event.
        </p>
        <label className="flex items-center gap-2 text-[14px] text-stone-800">
          <input type="checkbox" name="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
          Free (registration still required)
        </label>
        {!isFree ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="se-price" className={labelClass}>Price</label>
              <input id="se-price" name="price" type="number" min="0.01" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} className={fieldClass} placeholder="75000" />
            </div>
            <div>
              <label htmlFor="se-currency" className={labelClass}>Currency</label>
              <select id="se-currency" name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={fieldClass}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        ) : null}
        <div>
          <label htmlFor="se-capacity" className={labelClass}>Seats <span className="font-normal text-stone-400">(optional)</span></label>
          <input id="se-capacity" name="capacity" type="number" min="1" step="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className={fieldClass} placeholder="Unlimited" />
          <p className={hintClass}>Seats for the whole side event, not per day.</p>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending || flyerUploading} className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50">
          {pending ? 'Saving…' : flyerUploading ? 'Uploading flyer…' : event ? 'Save changes' : 'Create draft'}
        </button>
        {!event ? (
          <Link href="/tickets-command/side-events" className="rounded-md border border-stone-200 px-4 py-2.5 text-[14px] text-stone-600 hover:bg-stone-50">
            Cancel
          </Link>
        ) : null}
      </div>
      </fieldset>
    </form>
  );
}
