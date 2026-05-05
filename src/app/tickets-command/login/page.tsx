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
  if (jar.get(TICKETS_SESSION_COOKIE)) {
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
