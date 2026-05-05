'use client';

import { useState } from 'react';
import { TICKETS_PORTAL_BASE_PATH } from '@/tickets-portal/auth/constants';

function safeNextPath(path: string | undefined): string {
  if (path && path.startsWith(TICKETS_PORTAL_BASE_PATH) && !path.startsWith('//')) {
    return path;
  }
  return TICKETS_PORTAL_BASE_PATH;
}

type Props = {
  nextPath?: string;
};

export function TicketsLoginForm({ nextPath }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const target = safeNextPath(nextPath);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tickets-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Sign-in failed');
        return;
      }
      window.location.assign(target);
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
          <h1 className="text-[26px] font-semibold tracking-tight text-stone-900">Tickets</h1>
          <p className="text-[15px] leading-relaxed text-stone-500">
            Sign in with your API admin account. This session is separate from the main dashboard.
          </p>
        </div>

        <div className="rounded-lg border border-stone-200/90 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <form onSubmit={onSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="tickets-email" className="block text-[13px] font-medium text-stone-700">
                Email
              </label>
              <input
                id="tickets-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none ring-stone-900/10 placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tickets-password"
                className="block text-[13px] font-medium text-stone-700"
              >
                Password
              </label>
              <input
                id="tickets-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none ring-stone-900/10 placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-stone-900 py-2.5 text-[15px] font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
