'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TICKETS_LOGIN_PATH } from '@/tickets-portal/auth/constants';

export function TicketsForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/tickets-auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Unable to send reset email');
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
          <h1 className="text-[26px] font-semibold tracking-tight text-stone-900">Reset password</h1>
          <p className="text-[15px] leading-relaxed text-stone-500">
            Enter your admin email and we’ll send a reset link if the account exists.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[14px] text-emerald-800">
                If the email exists, a password reset link has been sent.
              </div>
              <Link
                href={TICKETS_LOGIN_PATH}
                className="inline-flex rounded-md bg-stone-900 px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-stone-800"
              >
                Back to sign in
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
                <label htmlFor="tickets-reset-email" className="block text-[13px] font-medium text-stone-700">
                  Email
                </label>
                <input
                  id="tickets-reset-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none ring-stone-900/10 placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-stone-900 py-2.5 text-[15px] font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="mt-5 text-[13px]">
            <Link href={TICKETS_LOGIN_PATH} className="text-stone-500 hover:text-stone-900">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
