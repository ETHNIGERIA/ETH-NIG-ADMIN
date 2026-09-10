import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import {
  TICKETS_LOGIN_PATH,
  TICKETS_SESSION_COOKIE,
} from '@/tickets-portal/auth/constants';
import { fetchAllAdminPages } from '@/tickets-portal/lib/admin-fetch-all';
import { hackathonApplicationsToCsv } from '@/tickets-portal/lib/hackathon-csv';
import type { HackathonApplication } from '@/tickets-portal/types/admin-hackathon-application';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILTER_KEYS = ['status', 'track', 'tier', 'from', 'to', 'q'];

export async function GET(req: NextRequest) {
  const token = (await cookies()).get(TICKETS_SESSION_COOKIE)?.value;
  if (!token) return Response.redirect(new URL(TICKETS_LOGIN_PATH, req.url));

  const filters: Record<string, string> = {};
  for (const key of FILTER_KEYS) {
    const v = req.nextUrl.searchParams.get(key);
    if (v) filters[key] = v;
  }

  const result = await fetchAllAdminPages<HackathonApplication>(
    token,
    '/admin/hackathon-applications',
    filters,
  );
  if (!result.ok) {
    if (result.status === 401) {
      return Response.redirect(new URL(TICKETS_LOGIN_PATH, req.url));
    }
    return new Response(`Export failed (${result.status})`, { status: 502 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(hackathonApplicationsToCsv(result.rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hackathon-applications-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
