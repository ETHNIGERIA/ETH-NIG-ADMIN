import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eventConsoleHref, loadConsoleEvent } from '@/tickets-portal/lib/event-console';
import { SectionHeader } from '@/tickets-portal/components/events-v2/SectionHeader';
import { fetchEventOptions } from '@/tickets-portal/data/event-options-read';
import { PublicSpeakerForm } from '@/tickets-portal/components/speakers/PublicSpeakerForm';
import { SideEventForm } from '@/tickets-portal/components/side-events/SideEventForm';
import { SIDE_EVENT_CURRENCIES } from '@/tickets-portal/lib/side-events';

export default async function NewConsoleItem({ params }: { params: Promise<{ eventId: string; section: string }> }) {
  const { eventId, section } = await params;
  if (section !== 'speakers' && section !== 'side-events') notFound();
  const event = await loadConsoleEvent(eventId);
  const sectionPath = eventConsoleHref(eventId, section);
  if (section === 'side-events') return <div className="space-y-6">
    <Link href={sectionPath} className="text-sm font-medium text-stone-500 hover:text-stone-900">← Side events</Link>
    <SectionHeader eyebrow="Program / Side event" title="Create side event" description={`Add an activity attached to ${event.name}.`} />
    <SideEventForm initialParent={{ id: event.slug, name: event.name }} lockedParentSlug={event.slug} currencies={SIDE_EVENT_CURRENCIES} returnTo={sectionPath} />
  </div>;
  const options = await fetchEventOptions();
  return <div className="space-y-6">
    <Link href={sectionPath} className="text-sm font-medium text-stone-500 hover:text-stone-900">← Speakers</Link>
    <SectionHeader eyebrow="People / Speaker" title="Add a speaker" description="Create a public profile for an invited speaker in this event." />
    <PublicSpeakerForm events={options} initialEventSlug={event.slug} lockedEventSlug={event.slug} returnTo={sectionPath} />
  </div>;
}
