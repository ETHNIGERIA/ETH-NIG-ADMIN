import { loadCampaigns } from "@/tickets-portal/actions/communications";
import { CommunicationsManager } from "@/tickets-portal/components/communications/CommunicationsManager";
export const dynamic = "force-dynamic";
export default async function CommunicationsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const initial = await loadCampaigns(eventId);
  return <CommunicationsManager eventId={eventId} initial={initial} />;
}
