import { NextRequest, NextResponse } from 'next/server';
import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';

type NestErrorEnvelope = {
  error?: { message?: string | string[] };
  message?: string | string[];
};

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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

  const res = await fetch(`${baseUrl}/admin/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as NestErrorEnvelope;
    const raw = json?.error?.message ?? json?.message ?? 'Failed to send password reset email';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    return NextResponse.json({ error: message }, { status: res.status });
  }

  return new NextResponse(null, { status: 204 });
}
