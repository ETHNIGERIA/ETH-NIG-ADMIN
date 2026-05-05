import { NextResponse } from 'next/server';
import { TICKETS_SESSION_COOKIE } from '@/tickets-portal/auth/constants';
import { ticketsSessionCookieOptions } from '@/tickets-portal/auth/session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TICKETS_SESSION_COOKIE, '', {
    ...ticketsSessionCookieOptions(),
    maxAge: 0,
  });
  return res;
}
