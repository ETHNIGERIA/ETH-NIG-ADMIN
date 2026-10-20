import { loadCampaigns } from '@/tickets-portal/actions/communications';
import { CommunicationsManager } from '@/tickets-portal/components/communications/CommunicationsManager';
export const dynamic='force-dynamic';
export default async function NewCommunication({params}:{params:Promise<{eventId:string}>}){const {eventId}=await params;return <CommunicationsManager eventId={eventId} initial={await loadCampaigns(eventId)} startNew/>;}
