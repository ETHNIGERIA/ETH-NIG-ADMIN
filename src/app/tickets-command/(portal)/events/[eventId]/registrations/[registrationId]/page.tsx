import RegistrationDetail from '@/tickets-portal/components/events/RegistrationDetailPage';

export default function RegistrationDetailPage({ params }: { params: Promise<{ eventId: string; registrationId: string }> }) {
  return <RegistrationDetail params={params} />;
}
