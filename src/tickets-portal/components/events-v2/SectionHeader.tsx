import type { ReactNode } from 'react';

export function SectionHeader({ eyebrow, title, description, action }: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
        <h2 className="mt-1 text-[26px] font-bold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      {action}
    </header>
  );
}

export const consoleCard = 'rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6';
export const consoleField = 'w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10';
export const consoleLabel = 'mb-1.5 block text-sm font-medium text-stone-800';
