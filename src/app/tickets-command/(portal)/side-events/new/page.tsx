import Link from 'next/link';
import { SideEventForm } from '@/tickets-portal/components/side-events/SideEventForm';
import { SIDE_EVENT_CURRENCIES } from '@/tickets-portal/lib/side-events';

export default async function NewSideEventPage({
  searchParams,
}: {
  searchParams: Promise<{ eventSlug?: string }>;
}) {
  const { eventSlug } = await searchParams;
  const slug = eventSlug?.trim().toLowerCase();
  // Only prefills the picker; the API checks the main event exists and is yours.
  const initialParent = slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? { id: slug, name: slug } : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tickets-command/side-events" className="text-[14px] text-stone-600 hover:text-stone-900">← Side events</Link>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-stone-900">New side event</h1>
        <p className="mt-1 text-[15px] text-stone-500">Saved as a draft. Publish it from its page when ready.</p>
      </div>
      <SideEventForm initialParent={initialParent} currencies={SIDE_EVENT_CURRENCIES} />
    </div>
  );
}
