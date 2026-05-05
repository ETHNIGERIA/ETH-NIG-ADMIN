import { NextRequest, NextResponse } from 'next/server';
import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';

type NestErrorEnvelope = {
  error?: { message?: string | string[] };
  message?: string | string[];
};

export async function POST(req: NextRequest) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and newPassword are required' }, { status: 400 });
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

  const res = await fetch(`${baseUrl}/admin/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as NestErrorEnvelope;
    const raw = json?.error?.message ?? json?.message ?? 'Failed to reset password';
    const message = Array.isArray(raw) ? raw.join(', ') : String(raw);
    return NextResponse.json({ error: message }, { status: res.status });
  }

  return new NextResponse(null, { status: 204 });
}
