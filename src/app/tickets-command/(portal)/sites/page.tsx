import { fetchAdminSites } from '@/tickets-portal/actions/sites';
import { SitesManager } from '@/tickets-portal/components/sites/SitesManager';

export const dynamic = 'force-dynamic';

export default async function AdminSitesPage() {
  const sites = await fetchAdminSites();
  return <SitesManager initialSites={sites} />;
}
