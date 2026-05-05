import { NextRequest, NextResponse } from 'next/server';
import { TICKETS_SESSION_COOKIE } from '@/tickets-portal/auth/constants';
import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';
import { ticketsSessionCookieOptions } from '@/tickets-portal/auth/session';

type NestLoginEnvelope = {
  success?: boolean;
  data?: { accessToken?: string };
};

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  let baseUrl: string;
  try {
    baseUrl = getTicketsApiBaseUrl();
  } catch {
    return NextResponse.json(
      { error: 'Tickets API is not configured (set TICKETS_API_BASE_URL on the server)' },
      { status: 503 },
    );
  }

  const res = await fetch(`${baseUrl}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = (await res.json().catch(() => ({}))) as NestLoginEnvelope & {
    error?: { message?: string };
    message?: string;
  };

  if (!res.ok) {
    const raw =
      json?.error?.message ??
      json?.message ??
      ('Invalid credentials' as const);
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    return NextResponse.json({ error: message }, { status: res.status });
  }

  const token = json?.data?.accessToken;
  if (!token) {
    return NextResponse.json({ error: 'Invalid response from tickets API' }, { status: 502 });
  }

  const out = NextResponse.json({ ok: true });
  out.cookies.set(TICKETS_SESSION_COOKIE, token, ticketsSessionCookieOptions());
  return out;
}
