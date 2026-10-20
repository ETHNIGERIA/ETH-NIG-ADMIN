import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { referrer: 'no-referrer', robots: { index: false, follow: false } };
import { TicketsResetPasswordForm } from '@/tickets-portal/components/TicketsResetPasswordForm';

type SearchParams = { token?: string | string[] };

function pickToken(raw: SearchParams['token']): string | undefined {
  if (typeof raw === 'string' && /^[a-f0-9]{64}$/.test(raw)) return raw;
  return undefined;
}

export default async function TicketsResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return <TicketsResetPasswordForm initialToken={pickToken(sp.token)} />;
}
