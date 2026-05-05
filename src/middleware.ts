import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  TICKETS_FORGOT_PASSWORD_PATH,
  TICKETS_LOGIN_PATH,
  TICKETS_PORTAL_BASE_PATH,
  TICKETS_RESET_PASSWORD_PATH,
  TICKETS_SESSION_COOKIE,
} from '@/tickets-portal/auth/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(TICKETS_PORTAL_BASE_PATH)) {
    return NextResponse.next();
  }

  if (
    pathname === TICKETS_LOGIN_PATH ||
    pathname.startsWith(`${TICKETS_LOGIN_PATH}/`) ||
    pathname === TICKETS_FORGOT_PASSWORD_PATH ||
    pathname.startsWith(`${TICKETS_FORGOT_PASSWORD_PATH}/`) ||
    pathname === TICKETS_RESET_PASSWORD_PATH ||
    pathname.startsWith(`${TICKETS_RESET_PASSWORD_PATH}/`)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TICKETS_SESSION_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = TICKETS_LOGIN_PATH;
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/tickets-command/:path*'],
};
