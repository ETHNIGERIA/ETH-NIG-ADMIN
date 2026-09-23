'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type EventOption = {
  slug: string;
  name: string;
};

/** Event select backed by `?event=`. Changing it resets to page 1 so the filter runs server-side. */
export function EventFilter({
  events = [],
  label = 'All events',
}: {
  events?: EventOption[];
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('event') ?? '';

  return (
    <select
      value={current}
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
      <option value="">{label}</option>
      {events.map((ev) => (
        <option key={ev.slug} value={ev.slug}>
          {ev.name || ev.slug}
        </option>
      ))}
    </select>
  );
}
