import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { Plus } from 'lucide-react';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { ADMIN_PAGE_SIZE, redirectIfPastLastPage, toQuery } from '@/tickets-portal/lib/list-params';
import { fetchEventOptions } from '@/tickets-portal/data/event-options-read';
import { EventFilter } from '@/tickets-portal/components/ui/EventFilter';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { SpeakersTabs } from '@/tickets-portal/components/speakers/SpeakersTabs';
import { PublicSpeakersTable } from '@/tickets-portal/components/speakers/PublicSpeakersTable';
import type { PublicSpeakerPage } from '@/tickets-portal/types/public-speakers';

export const dynamic = 'force-dynamic';

export default async function PublicSpeakersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; event?: string; created?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? '', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const event = params.event?.trim() || undefined;
  const newHref = `/tickets-command/speakers/public/new${toQuery({ eventSlug: event })}`;

  let content: React.ReactNode;
  try {
    const [data, events] = await Promise.all([
      ticketsApiGet<PublicSpeakerPage>(`/admin/public-speakers${toQuery({ page, limit: ADMIN_PAGE_SIZE, event })}`),
      fetchEventOptions(),
    ]);
    redirectIfPastLastPage('/tickets-command/speakers/public', page, ADMIN_PAGE_SIZE, data.total, { event });
    content = (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">{data.total} {data.total === 1 ? 'speaker' : 'speakers'} · visible and hidden</p>
          <EventFilter events={events} />
        </div>
        <PublicSpeakersTable speakers={data.items} />
        <Pagination basePath="/tickets-command/speakers/public" page={page} limit={ADMIN_PAGE_SIZE} total={data.total} params={{ event }} />
      </>
    );
  } catch (error) {
    unstable_rethrow(error);
    content = (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
        Could not load public speakers. {error instanceof Error ? error.message : 'Please try again.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">Speaker management</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-stone-900">Public speakers</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-stone-600">Manage the people shown on the event site, including invited speakers and approved applicants.</p>
        </div>
        <Link href={newHref} className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800">
          <Plus className="h-4 w-4" /> Add speaker
        </Link>
      </header>

      <SpeakersTabs active="public" />

      {params.created === '1' || params.updated === '1' ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Speaker {params.created === '1' ? 'added' : 'updated'} successfully. Public pages refresh within about five minutes.
        </p>
      ) : null}

      {content}
    </div>
  );
}
