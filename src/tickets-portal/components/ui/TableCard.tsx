import type { ComponentType, ReactNode } from 'react';

export const tableTh = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
export const tableTd = 'px-4 py-3 align-top text-sm text-stone-700';
export const tableRow = 'transition-colors hover:bg-stone-50/50';

/** Centered empty state for a list card. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint?: ReactNode;
}) {
  return (
    <div className="p-12 text-center text-stone-500">
      <Icon className="mx-auto mb-3 h-10 w-10 text-stone-300" />
      <p className="font-semibold text-stone-800">{title}</p>
      {hint ? <p className="mt-1 text-xs text-stone-400">{hint}</p> : null}
    </div>
  );
}

/**
 * List card shared by the portal managers (influencers, communities, promo
 * codes, careers, applications, collab applications, contact): bordered card,
 * horizontal scroll, header row and divided body, or `empty` when there are no
 * rows. Sites keeps its own denser table. `minWidth` is a literal Tailwind
 * class (e.g. "min-w-[560px]") so Tailwind can see it.
 */
export function TableCard({
  isEmpty,
  empty,
  minWidth,
  head,
  children,
}: {
  isEmpty: boolean;
  empty: ReactNode;
  minWidth: string;
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm">
      {isEmpty ? (
        empty
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full ${minWidth}`}>
            <thead className="border-b border-stone-200/80 bg-stone-50/75">
              <tr>{head}</tr>
            </thead>
            <tbody className="divide-y divide-stone-100">{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
