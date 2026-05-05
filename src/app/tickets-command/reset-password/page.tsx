import { TicketsResetPasswordForm } from '@/tickets-portal/components/TicketsResetPasswordForm';

type SearchParams = { token?: string | string[] };

function pickToken(raw: SearchParams['token']): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
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
