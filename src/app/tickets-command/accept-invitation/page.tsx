import type { Metadata } from 'next';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { referrer: 'no-referrer', robots: { index: false, follow: false } };
import { TicketsResetPasswordForm } from '@/tickets-portal/components/TicketsResetPasswordForm';
export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return <TicketsResetPasswordForm invitation initialToken={typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ? token : undefined} />;
}
