import { TicketsCommandLayout } from '@/tickets-portal/components/TicketsCommandLayout';

export default function TicketsPortalSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TicketsCommandLayout>{children}</TicketsCommandLayout>;
}
