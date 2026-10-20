import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  TICKETS_SESSION_COOKIE,
  TICKETS_PORTAL_BASE_PATH,
} from '@/tickets-portal/auth/constants';
import { TicketsLoginForm } from '@/tickets-portal/components/TicketsLoginForm';

type SearchParams = { next?: string | string[] };

function pickNext(raw: SearchParams['next']): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

export default async function TicketsLoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const jar = await cookies();
  const token = jar.get(TICKETS_SESSION_COOKIE)?.value;
  let validSession = false;
  if (token) {
    try {
      const response = await fetch(`${getTicketsApiBaseUrl()}/admin/admins/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(8_000) });
      validSession = response.ok;
    } catch { /* Render sign in when the session cannot be verified. */ }
  }
  if (validSession) {
    const sp = await searchParams;
    const candidate = pickNext(sp.next);
    const next =
      candidate &&
      candidate.startsWith(TICKETS_PORTAL_BASE_PATH) &&
      !candidate.startsWith('//')
        ? candidate
        : TICKETS_PORTAL_BASE_PATH;
    redirect(next);
  }

  const sp = await searchParams;
  return <TicketsLoginForm nextPath={pickNext(sp.next)} />;
}
