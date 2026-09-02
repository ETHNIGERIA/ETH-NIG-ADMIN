'use client';

import { useMemo, useRef, useState } from 'react';
import { toDatetimeLocalValue } from '@/tickets-portal/lib/datetime-local';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

type EventDayValue = {
  key: string;
  date: string;
  label: string;
  startsAt?: string;
  endsAt?: string;
};

type DayDraft = EventDayValue & { id: string };

type Props = {
  name?: string;
  initialDays?: EventDayValue[];
  idPrefix?: string;
};

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `day-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateInputValue(value: string) {
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}

function dayDraft(day: EventDayValue): DayDraft {
  return {
    id: newId(),
    key: day.key,
    date: dateInputValue(day.date),
    label: day.label,
    startsAt: day.startsAt ? toDatetimeLocalValue(day.startsAt) : '',
    endsAt: day.endsAt ? toDatetimeLocalValue(day.endsAt) : '',
  };
}

function nextDayKey(usedKeys: Set<string>) {
  let index = 1;
  let key = `day-${index}`;
  while (usedKeys.has(key)) {
    index += 1;
    key = `day-${index}`;
  }
  usedKeys.add(key);
  return key;
}

export function EventDaysEditor({ name = 'daysJson', initialDays = [], idPrefix = 'event-day' }: Props) {
  const [days, setDays] = useState<DayDraft[]>(() => initialDays.map(dayDraft));
  const usedKeysRef = useRef(new Set(initialDays.map((day) => day.key)));

  const serializedDays = useMemo(
    () =>
      JSON.stringify(
        days.map(({ id: _id, startsAt, endsAt, ...day }) => ({
          ...day,
          ...(startsAt ? { startsAt } : {}),
          ...(endsAt ? { endsAt } : {}),
        })),
      ),
    [days],
  );

  function updateDay(id: string, field: keyof EventDayValue, value: string) {
    setDays((current) => current.map((day) => (day.id === id ? { ...day, [field]: value } : day)));
  }

  function addDay() {
    const key = nextDayKey(usedKeysRef.current);
    setDays((current) => [
      ...current,
      {
        id: newId(),
        key,
        date: '',
        label: `Day ${current.length + 1}`,
        startsAt: '',
        endsAt: '',
      },
    ]);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className={labelClass}>
          Event days <span className="font-normal text-stone-400">(optional)</span>
        </p>
        <p className="text-[12px] text-stone-500">
          Leave this empty for a single-day event. Add one row per day for a multi-day event. Day IDs are generated
          automatically and are used internally for ticket check-in.
        </p>
      </div>

      {days.length > 0 ? (
        <div className="space-y-3">
          {days.map((day, index) => {
            const dayId = `${idPrefix}-${day.id}`;
            return (
              <fieldset key={day.id} className="rounded-md border border-stone-200 bg-stone-50/60 p-3">
                <legend className="px-1 text-[13px] font-medium text-stone-800">Day {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor={`${dayId}-date`}>Date</label>
                    <input
                      id={`${dayId}-date`}
                      type="date"
                      required
                      value={day.date}
                      onChange={(event) => updateDay(day.id, 'date', event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${dayId}-label`}>Display label</label>
                    <input
                      id={`${dayId}-label`}
                      type="text"
                      required
                      value={day.label}
                      onChange={(event) => updateDay(day.id, 'label', event.target.value)}
                      className={fieldClass}
                      placeholder="Day 1"
                    />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-stone-500">
                  Internal day ID: <code className="rounded bg-stone-100 px-1 py-0.5 text-stone-700">{day.key}</code>
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor={`${dayId}-starts`}>Starts at <span className="font-normal text-stone-400">(optional)</span></label>
                    <input
                      id={`${dayId}-starts`}
                      type="datetime-local"
                      value={day.startsAt ?? ''}
                      onChange={(event) => updateDay(day.id, 'startsAt', event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${dayId}-ends`}>Ends at <span className="font-normal text-stone-400">(optional)</span></label>
                    <input
                      id={`${dayId}-ends`}
                      type="datetime-local"
                      value={day.endsAt ?? ''}
                      onChange={(event) => updateDay(day.id, 'endsAt', event.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDays((current) => current.filter((entry) => entry.id !== day.id))}
                  className="mt-3 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 hover:bg-stone-100"
                >
                  Remove day
                </button>
              </fieldset>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-stone-200 px-3 py-3 text-[13px] text-stone-500">
          No additional days configured. Single-day tickets use the main event date.
        </p>
      )}

      <button
        type="button"
        onClick={addDay}
        className="rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
      >
        Add event day
      </button>

      <input type="hidden" name={name} value={serializedDays} readOnly />
    </div>
  );
}
