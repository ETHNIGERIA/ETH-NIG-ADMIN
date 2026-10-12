import Link from 'next/link';
import { fetchEventOptions } from '@/tickets-portal/data/event-options-read';
import { PublicSpeakerForm } from '@/tickets-portal/components/speakers/PublicSpeakerForm';

export default async function NewPublicSpeakerPage({
  searchParams,
}: {
  searchParams: Promise<{ eventSlug?: string }>;
}) {
  const { eventSlug } = await searchParams;
  const events = await fetchEventOptions();
  const initialEventSlug = eventSlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(eventSlug) ? eventSlug : '';

  return (
    <div className="space-y-7">
      <header>
        <Link href="/tickets-command/speakers/public" className="text-sm font-medium text-stone-500 hover:text-stone-900">← Public speakers</Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Speaker management</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-stone-900">Add a public speaker</h1>
        <p className="mt-2 text-[15px] text-stone-600">Create a profile for an invited speaker or another person who did not apply through the site.</p>
      </header>
      <PublicSpeakerForm events={events} initialEventSlug={initialEventSlug} />
    </div>
  );
}
