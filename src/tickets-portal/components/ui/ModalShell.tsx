'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
} as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared frame for the portal's centered dialogs (forms, details, confirms):
 * backdrop, panel, close button, Escape / backdrop-click to close (disabled
 * while `isBusy`), and modal focus handling (focus moves in, Tab stays inside,
 * focus returns to the trigger on close). Slide-over panels (event tiers,
 * contact messages) are a different pattern and do not use it.
 */
export function ModalShell({
  onClose,
  label,
  isBusy = false,
  size = 'xl',
  align = 'start',
  showClose = true,
  panelClassName = '',
  children,
}: {
  onClose: () => void;
  /** Accessible name of the dialog */
  label: string;
  isBusy?: boolean;
  size?: keyof typeof SIZES;
  /** 'start' for tall forms (scrolls), 'center' for short confirmations */
  align?: 'start' | 'center';
  showClose?: boolean;
  panelClassName?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // A drag that starts inside the panel and ends on the backdrop must not close.
  const pressStartedOnBackdrop = useRef(false);
  // Callers pass inline closures; read the latest via a ref so listeners attach once.
  const latest = useRef({ onClose, isBusy });
  useLayoutEffect(() => {
    latest.current = { onClose, isBusy };
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () => (panel ? [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)] : []);
    // Prefer the first form field over the close button.
    const first = focusables().find((el) => el.getAttribute('aria-label') !== 'Close dialog') ?? focusables()[0];
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !latest.current.isBusy) {
        latest.current.onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      const active = document.activeElement;
      const outside = !panel?.contains(active);
      if (e.shiftKey && (active === head || outside)) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && (active === tail || outside)) {
        e.preventDefault();
        head.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-stone-900/50 p-4 backdrop-blur-xs ${
        align === 'start' ? 'items-start overflow-y-auto sm:p-8' : 'items-center'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const onBackdrop = e.target === e.currentTarget && pressStartedOnBackdrop.current;
        pressStartedOnBackdrop.current = false;
        if (onBackdrop && !isBusy) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${SIZES[size]} rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl outline-none animate-in fade-in zoom-in-95 ${panelClassName}`}
      >
        {showClose ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
