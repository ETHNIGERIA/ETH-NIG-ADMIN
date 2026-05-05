import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

/** Matches ticketsethng JWT `expiresIn: '8h'`. */
const MAX_AGE_SECONDS = 8 * 60 * 60;

export function ticketsSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}
