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

export default async function EventPartnersPage({
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
        title="Could not load partners"
        message={errorMessage(e, 'The tickets API did not respond.')}
      />
    );
  }

  const id = event._id;
  const related = await fetchEventRelatedRecords(
    { _id: id, slug: event.slug },
    { limit: 50, kinds: ['partners'] },
  );
  const loadError = related.errors.partners ?? related.errors.partnerApplications;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/tickets-command/events/${id}`}
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Back to event
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">Partners</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">
          Listed partners and applications for <span className="font-medium text-stone-800">{event.name}</span>.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-6 py-5 text-amber-950">
          <p className="font-semibold">Some partner data could not be loaded</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-stone-900">Listed partners</h2>
        <div className={tableWrap}>
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Partner</th>
                <th className={`${th} hidden sm:table-cell`}>Category</th>
                <th className={`${th} hidden md:table-cell`}>Website</th>
              </tr>
            </thead>
            <tbody>
              {related.partners.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`${td} py-16 text-center text-stone-400`}>
                    No listed partners for this event yet.
                  </td>
                </tr>
              ) : (
                related.partners.map((partner) => (
                  <tr key={partner._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={`${td} font-medium text-stone-900`}>{partner.name}</td>
                    <td className={`${td} hidden capitalize sm:table-cell`}>{partner.category ?? '—'}</td>
                    <td className={`${td} hidden md:table-cell`}>
                      {partner.website ? (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-stone-800 underline-offset-4 hover:underline"
                        >
                          {partner.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-stone-900">Applications</h2>
        {related.partnerApplications.length === 0 ? (
          <div className={`${tableWrap} px-4 py-16 text-center text-[14px] text-stone-400`}>
            No partner applications tied to this event.
          </div>
        ) : (
          <div className="space-y-4">
            {related.partnerApplications.map((app) => (
              <article key={app._id} className="rounded-lg border border-stone-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[16px] font-semibold text-stone-900">{app.companyName}</h3>
                    <p className="mt-1 text-[13px] text-stone-500">{app.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={app.status} />
                    <ApplicationStatusActions
                      kind="partner"
                      applicationId={app._id}
                      eventId={id}
                      currentStatus={app.status}
                    />
                  </div>
                </div>
                <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {[
                    ['Event slug', app.eventSlug],
                    ['Partnership type', app.partnershipType || app.partnerType],
                    ['Phone', app.phone],
                    ['Telegram', app.telegram],
                    ['Country', app.country],
                    ['Communication', app.communicationMethod],
                    ['Website', app.website],
                    ['LinkedIn', app.linkedin],
                    ['Logo URL', app.logoUrl],
                    ['Objectives', app.objectives || app.objective],
                    ['What they can offer', app.whatCanOffer],
                    ['Benefits sought', app.benefitsSeek],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-[14px] text-stone-800">
                        {value?.trim() ? value : '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
