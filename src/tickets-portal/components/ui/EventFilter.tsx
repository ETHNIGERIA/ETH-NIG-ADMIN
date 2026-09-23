'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type EventOption = {
  slug: string;
  name: string;
};

/**
 * Event select backed by `?event=`. Changing it resets to page 1 so the filter runs server-side.
 * `events` null means the list failed to load; the active selection stays visible so it can be cleared.
 */
export function EventFilter({
  events,
  label = 'All events',
}: {
  events: EventOption[] | null;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('event') ?? '';
  const options = events ?? [];
  // Keep an active filter visible even when it is not in the loaded list.
  const showCurrent = current !== '' && !options.some((ev) => ev.slug === current);

  return (
    <select
      value={current}
      title={events === null ? 'Could not load events' : undefined}
      onChange={(e) => {
        const next = new URLSearchParams(searchParams.toString());
        next.delete('page');
        if (e.target.value) next.set('event', e.target.value);
        else next.delete('event');
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
      className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-stone-400"
    >
      <option value="">{events === null ? `${label} (event list unavailable)` : label}</option>
      {showCurrent ? <option value={current}>{current}</option> : null}
      {options.map((ev) => (
        <option key={ev.slug} value={ev.slug}>
          {ev.name || ev.slug}
        </option>
      ))}
    </select>
  );
}
