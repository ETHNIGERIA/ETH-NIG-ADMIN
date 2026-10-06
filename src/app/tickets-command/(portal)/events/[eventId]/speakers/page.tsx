import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent } from '@/tickets-portal/types/admin-events';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { fetchEventRelatedRecords } from '@/tickets-portal/data/event-related-read';
import { ApplicationStatusActions } from '@/tickets-portal/components/events/ApplicationStatusActions';
import { TicketsLoadError } from '@/tickets-portal/components/TicketsLoadError';
import { errorMessage, isNotFoundError } from '@/tickets-portal/lib/api-errors';

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

function StatusPill({ status }: { status?: string }) {
  const value = (status ?? 'unknown').toLowerCase();
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-900',
    reviewed: 'bg-sky-50 text-sky-900',
    approved: 'bg-emerald-50 text-emerald-800',
    rejected: 'bg-stone-100 text-stone-600',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[value] ?? 'bg-stone-100 text-stone-700'}`}>
      {status ?? '—'}
    </span>
  );
}

export default async function EventSpeakersPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let event: AdminEvent;
  try {
    const raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
    event = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch (e) {
    if (isNotFoundError(e)) notFound();
    return (
      <TicketsLoadError
        title="Could not load speakers"
        message={errorMessage(e, 'The tickets API did not respond.')}
      />
    );
  }

  const id = event._id;
  const related = await fetchEventRelatedRecords(
    { _id: id, slug: event.slug },
    { limit: 50, kinds: ['speakers'] },
  );
  const loadError = related.errors.speakers ?? related.errors.speakerApplications;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/tickets-command/events/${id}`}
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Back to event
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">Speakers</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">
          Listed speakers and applications for <span className="font-medium text-stone-800">{event.name}</span>.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-6 py-5 text-amber-950">
          <p className="font-semibold">Some speaker data could not be loaded</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-stone-900">Listed speakers</h2>
        <div className={tableWrap}>
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Speaker</th>
                <th className={`${th} hidden sm:table-cell`}>Title</th>
                <th className={`${th} hidden md:table-cell`}>Company</th>
              </tr>
            </thead>
            <tbody>
              {related.speakers.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`${td} py-16 text-center text-stone-400`}>
                    No listed speakers for this event yet.
                  </td>
                </tr>
              ) : (
                related.speakers.map((speaker) => (
                  <tr key={speaker._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={`${td} font-medium text-stone-900`}>{speaker.name}</td>
                    <td className={`${td} hidden sm:table-cell`}>{speaker.title ?? '—'}</td>
                    <td className={`${td} hidden md:table-cell`}>{speaker.company ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-stone-900">Applications</h2>
        <div className={tableWrap}>
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Speaker</th>
                <th className={`${th} hidden sm:table-cell`}>Topic</th>
                <th className={th}>Status</th>
                <th className={th}>Approve</th>
              </tr>
            </thead>
            <tbody>
              {related.speakerApplications.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${td} py-16 text-center text-stone-400`}>
                    No speaker applications tied to this event.
                  </td>
                </tr>
              ) : (
                related.speakerApplications.map((app) => (
                  <tr key={app._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={td}>
                      <p className="font-medium text-stone-900">{app.fullName || app.name}</p>
                      <p className="text-[13px] text-stone-500">{app.email}</p>
                    </td>
                    <td className={`${td} hidden sm:table-cell`}>{app.topicTitle ?? app.speakingFormat ?? '—'}</td>
                    <td className={td}>
                      <StatusPill status={app.status} />
                    </td>
                    <td className={td}>
                      <ApplicationStatusActions
                        kind="speaker"
                        applicationId={app._id}
                        eventId={id}
                        currentStatus={app.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
