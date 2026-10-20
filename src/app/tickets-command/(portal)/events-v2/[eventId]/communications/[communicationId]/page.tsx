import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { loadCampaigns, type Campaign } from '@/tickets-portal/actions/communications';
import { CommunicationsManager } from '@/tickets-portal/components/communications/CommunicationsManager';
export const dynamic='force-dynamic';
export default async function CommunicationPage({params}:{params:Promise<{eventId:string;communicationId:string}>}){const {eventId,communicationId}=await params;const [initial,campaign]=await Promise.all([loadCampaigns(eventId),ticketsApiGet<Campaign>(`/admin/events/${encodeURIComponent(eventId)}/communications/${encodeURIComponent(communicationId)}`)]);return <CommunicationsManager key={communicationId} eventId={eventId} initial={initial} initialCampaign={campaign}/>;}
