'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Status select backed by `?status=`. Changing it resets to page 1 so the filter runs server-side. */
export function StatusFilter({
  statuses,
  label = 'All statuses',
}: {
  statuses: readonly string[];
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('status') ?? '';

  return (
    <select
      value={statuses.includes(current) ? current : ''}
      onChange={(e) => {
        const next = new URLSearchParams(searchParams.toString());
        next.delete('page');
        if (e.target.value) next.set('status', e.target.value);
        else next.delete('status');
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname);
      }}
      className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm capitalize text-stone-800 outline-none focus:border-stone-400"
    >
      <option value="">{label}</option>
      {statuses.map((s) => (
        <option key={s} value={s} className="capitalize">
          {s}
        </option>
      ))}
    </select>
  );
}
