'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import clsx from 'clsx';

export type ConfirmVariant = 'danger' | 'warning' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  implications?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  implications = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const Icon =
    variant === 'danger'
      ? AlertCircle
      : variant === 'warning'
      ? AlertTriangle
      : CheckCircle2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
              variant === 'danger' && 'bg-red-50 border-red-200 text-red-600',
              variant === 'warning' && 'bg-amber-50 border-amber-200 text-amber-600',
              variant === 'success' && 'bg-emerald-50 border-emerald-200 text-emerald-600',
            )}
          >
            <Icon className="h-6 w-6 stroke-[1.75]" />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-bold text-stone-900 tracking-tight">{title}</h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Implications & Choices Callout */}
        {implications.length > 0 && (
          <div
            className={clsx(
              'rounded-xl border p-3.5 text-xs space-y-1.5',
              variant === 'danger' && 'bg-red-50/60 border-red-200/80 text-red-900',
              variant === 'warning' && 'bg-amber-50/60 border-amber-200/80 text-amber-900',
              variant === 'success' && 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900',
            )}
          >
            <p className="font-semibold uppercase tracking-wider text-[10px] opacity-80">
              Key Implications &amp; Effects
            </p>
            <ul className="list-disc list-inside space-y-1 opacity-90 leading-relaxed">
              {implications.map((imp, idx) => (
                <li key={idx}>{imp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onConfirm()}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50',
              variant === 'danger' && 'bg-red-600 hover:bg-red-700 active:bg-red-800',
              variant === 'warning' && 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
              variant === 'success' && 'bg-stone-900 hover:bg-stone-800 active:bg-stone-950',
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
