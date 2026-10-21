'use client';

import { useEffect, useRef, useState } from 'react';

const checkboxClass = 'h-4 w-4 cursor-pointer rounded border-stone-300 text-stone-900 focus:ring-stone-500';

/** Checkbox selection over the rows currently on the page. */
export function useRowSelection(ids: string[]) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  // Only ids still on the page count, so rows removed by a refresh drop out.
  const selected = ids.filter((id) => picked.has(id));
  const allSelected = ids.length > 0 && selected.length === ids.length;

  return {
    selected,
    allSelected,
    someSelected: selected.length > 0 && !allSelected,
    isSelected: (id: string) => picked.has(id),
    toggle: (id: string) =>
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: () => setPicked(allSelected ? new Set() : new Set(ids)),
    clear: () => setPicked(new Set()),
  };
}

export function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className={checkboxClass}
    />
  );
}

export function RowCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <input type="checkbox" aria-label={label} checked={checked} onChange={onChange} className={checkboxClass} />;
}
