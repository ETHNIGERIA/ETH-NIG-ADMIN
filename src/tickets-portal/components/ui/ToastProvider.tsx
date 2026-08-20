'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, description, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, description?: string) => showToast({ type: 'success', title, description }),
    [showToast],
  );

  const error = useCallback(
    (title: string, description?: string) =>
      showToast({ type: 'error', title, description, duration: 6000 }),
    [showToast],
  );

  const info = useCallback(
    (title: string, description?: string) => showToast({ type: 'info', title, description }),
    [showToast],
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      showToast({ type: 'warning', title, description, duration: 5500 }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2.5 p-4 sm:bottom-4 sm:right-4 sm:max-w-sm"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'error'
              ? AlertCircle
              : toast.type === 'warning'
              ? AlertTriangle
              : Info;

          return (
            <div
              key={toast.id}
              className={clsx(
                'pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-5',
                toast.type === 'success' && 'border-emerald-200 bg-white text-stone-900',
                toast.type === 'error' && 'border-red-200 bg-white text-stone-900',
                toast.type === 'warning' && 'border-amber-200 bg-white text-stone-900',
                toast.type === 'info' && 'border-stone-200 bg-white text-stone-900',
              )}
            >
              <div className="shrink-0 pt-0.5">
                <Icon
                  className={clsx(
                    'h-5 w-5',
                    toast.type === 'success' && 'text-emerald-600',
                    toast.type === 'error' && 'text-red-600',
                    toast.type === 'warning' && 'text-amber-600',
                    toast.type === 'info' && 'text-stone-600',
                  )}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-stone-500 break-words leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
