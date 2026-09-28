'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';

export const formFieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
export const formLabelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';
export const formHintClass = 'mt-1 text-[12px] text-stone-500';

/** Shown when a server action rejects (network drop, deploy skew) instead of returning { error }. */
export const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

/** Modal shell for create/edit forms (same look as the careers form modal). */
export function FormModal({
  title,
  description,
  error,
  isPending,
  onClose,
  children,
}: {
  title: string;
  description?: ReactNode;
  error?: string | null;
  isPending: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Callers pass inline closures; read the latest via refs so the listener is attached once.
  const latest = useRef({ onClose, isPending });
  useLayoutEffect(() => {
    latest.current = { onClose, isPending };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !latest.current.isPending) latest.current.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-xs sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          disabled={isPending}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="pr-8 text-lg font-bold tracking-tight text-stone-900">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p> : null}
        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function FormModalActions({
  isPending,
  onCancel,
  submitLabel,
}: {
  isPending: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4 sm:col-span-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}

/** Header row above a list: count on the left, primary action on the right. */
export function ListToolbar({ summary, action }: { summary: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-stone-500">{summary}</p>
      {action}
    </div>
  );
}

export const primaryButtonClass =
  'inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800';
export const iconButtonClass =
  'rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700';
export const dangerIconButtonClass =
  'rounded p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600';
