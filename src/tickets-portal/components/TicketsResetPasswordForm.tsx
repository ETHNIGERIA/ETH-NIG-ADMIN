'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  TICKETS_LOGIN_PATH,
  TICKETS_FORGOT_PASSWORD_PATH,
} from '@/tickets-portal/auth/constants';

type Props = {
  initialToken?: string;
};

export function TicketsResetPasswordForm({ initialToken = '' }: Props) {
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/tickets-auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Unable to reset password');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fbfbfa] px-6 py-16">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 space-y-2 text-center sm:text-left">
          <h1 className="text-[26px] font-semibold tracking-tight text-stone-900">Choose new password</h1>
          <p className="text-[15px] leading-relaxed text-stone-500">
            Paste the token from your reset email and set a new admin password.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[14px] text-emerald-800">
                Your password has been reset.
              </div>
              <Link
                href={TICKETS_LOGIN_PATH}
                className="inline-flex rounded-md bg-stone-900 px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-stone-800"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="tickets-reset-token" className="block text-[13px] font-medium text-stone-700">
                  Token
                </label>
                <input
                  id="tickets-reset-token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none ring-stone-900/10 placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="tickets-reset-password"
                  className="block text-[13px] font-medium text-stone-700"
                >
                  New password
                </label>
                <input
                  id="tickets-reset-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none ring-stone-900/10 placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="tickets-reset-confirm"
                  className="block text-[13px] font-medium text-stone-700"
                >
                  Confirm password
                </label>
                <input
                  id="tickets-reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none ring-stone-900/10 placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-stone-900 py-2.5 text-[15px] font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}

          <div className="mt-5 flex items-center justify-between gap-4 text-[13px]">
            <Link href={TICKETS_LOGIN_PATH} className="text-stone-500 hover:text-stone-900">
              Back to sign in
            </Link>
            <Link
              href={TICKETS_FORGOT_PASSWORD_PATH}
              className="text-stone-500 hover:text-stone-900"
            >
              Resend link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
