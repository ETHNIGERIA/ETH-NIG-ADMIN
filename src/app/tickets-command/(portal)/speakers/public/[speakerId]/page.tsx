import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { fetchEventOptions } from '@/tickets-portal/data/event-options-read';
import { PublicSpeakerForm } from '@/tickets-portal/components/speakers/PublicSpeakerForm';
import type { PublicSpeaker } from '@/tickets-portal/types/public-speakers';

export const dynamic = 'force-dynamic';

export default async function EditPublicSpeakerPage({
  params,
}: {
  params: Promise<{ speakerId: string }>;
}) {
  const { speakerId } = await params;
  if (!/^[a-f0-9]{24}$/i.test(speakerId)) notFound();

  let speaker: PublicSpeaker;
  try {
    speaker = await ticketsApiGet<PublicSpeaker>(`/admin/public-speakers/${speakerId}`);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof Error && error.message === 'Speaker not found') notFound();
    throw error;
  }
  const events = await fetchEventOptions();

  return (
    <div className="space-y-7">
      <header>
        <Link href="/tickets-command/speakers/public" className="text-sm font-medium text-stone-500 hover:text-stone-900">← Public speakers</Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Speaker management</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-stone-900">Edit {speaker.name}</h1>
        <p className="mt-2 text-[15px] text-stone-600">Update this speaker’s public profile, event, order and visibility.</p>
      </header>
      <PublicSpeakerForm speaker={speaker} events={events} />
    </div>
  );
}
