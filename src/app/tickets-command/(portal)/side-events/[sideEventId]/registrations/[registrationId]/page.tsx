import RegistrationDetail from '@/tickets-portal/components/events/RegistrationDetailPage';

export default async function SideEventRegistrationPage({ params }: { params: Promise<{ sideEventId: string; registrationId: string }> }) {
  const { sideEventId, registrationId } = await params;
  return <RegistrationDetail sideEvent params={Promise.resolve({ eventId: sideEventId, registrationId })} />;
}
