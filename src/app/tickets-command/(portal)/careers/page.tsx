import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { CareersManager } from '@/tickets-portal/components/careers/CareersManager';
import type { AdminCareerPage } from '@/tickets-portal/types/admin-careers';

export const dynamic = 'force-dynamic';

export default async function CareersPage() {
  try {
    const careers = await ticketsApiGet<AdminCareerPage>('/admin/careers?limit=100');
    return <div className="space-y-8"><header><h1 className="text-[28px] font-semibold tracking-tight text-stone-900">Careers</h1><p className="mt-2 text-[15px] text-stone-600">Manage the API-backed opportunities shown on the public careers page.</p></header><CareersManager careers={careers.data} /></div>;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load careers';
    return <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900"><p className="font-semibold">Could not load careers</p><p className="mt-2 text-[14px]">{message}</p></div>;
  }
}
