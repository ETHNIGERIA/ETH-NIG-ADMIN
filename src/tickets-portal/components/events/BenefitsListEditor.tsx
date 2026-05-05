'use client';

import { useState } from 'react';

const fieldClass =
  'min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-3 py-2 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';

type Props = {
  /** Serialized as newline-separated for server actions (matches parseBenefits). */
  name?: string;
  initialItems: string[];
  idPrefix?: string;
};

export function BenefitsListEditor({ name = 'benefits', initialItems, idPrefix = 'benefits' }: Props) {
  const [items, setItems] = useState<string[]>(() =>
    initialItems.map((s) => s.trim()).filter(Boolean),
  );
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    setItems((prev) => [...prev, t]);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        <ul className="space-y-2 rounded-md border border-stone-100 bg-stone-50/80 px-3 py-2.5">
          {items.map((b, i) => (
            <li key={`${b}-${i}`} className="flex items-start gap-2 text-[14px] text-stone-800">
              <span className="mt-0.5 shrink-0 text-emerald-600" aria-hidden>
                ✓
              </span>
              <span className="min-w-0 flex-1 leading-snug">{b}</span>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                className="shrink-0 rounded px-1.5 py-0.5 text-[12px] text-stone-500 hover:bg-stone-200/80 hover:text-stone-800"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-stone-400">No benefits listed yet — they show as a checklist on the public page.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor={`${idPrefix}-add`} className="sr-only">
          Add benefit
        </label>
        <input
          id={`${idPrefix}-add`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className={fieldClass}
          placeholder="e.g. Priority seating"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-800 hover:bg-stone-50"
        >
          Add
        </button>
      </div>

      <input type="hidden" name={name} value={items.join('\n')} readOnly />
    </div>
  );
}
