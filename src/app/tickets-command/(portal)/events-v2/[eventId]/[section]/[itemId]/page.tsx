import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { eventConsoleHref, formatEventDate, loadConsoleEvent } from '@/tickets-portal/lib/event-console';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { overviewEventId } from '@/tickets-portal/lib/overview-links';
import { SectionHeader, consoleCard } from '@/tickets-portal/components/events-v2/SectionHeader';
import RegistrationDetailPage from '@/tickets-portal/components/events/RegistrationDetailPage';
import { SideEventEditor } from '@/tickets-portal/components/side-events/SideEventEditor';
import { SideEventCheckIn } from '@/tickets-portal/components/side-events/SideEventCheckIn';
import { SIDE_EVENT_CURRENCIES } from '@/tickets-portal/lib/side-events';
import { PublicSpeakerForm } from '@/tickets-portal/components/speakers/PublicSpeakerForm';
import { fetchEventOptions } from '@/tickets-portal/data/event-options-read';
import type { AdminPaymentDetail } from '@/tickets-portal/types/admin-payments';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import type { PublicSpeaker } from '@/tickets-portal/types/public-speakers';
import type { CollabApplicationPage, SpeakerApplication, SponsorApplication } from '@/tickets-portal/types/admin-collab-applications';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';

export const dynamic = 'force-dynamic';

function detailValue(value: unknown) {
  if (value == null) return '—';
  if (typeof value === 'object' && 'name' in value) return String(value.name);
  if (typeof value === 'object' && '_id' in value) return normalizeDocumentId(value._id);
  return normalizeDocumentId(value);
}

function money(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${(amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function EventConsoleItem({ params, searchParams }: {
  params: Promise<{ eventId: string; section: string; itemId: string }>;
  searchParams: Promise<{ view?: string; page?: string; status?: string }>;
}) {
  const { eventId, section, itemId } = await params;
  const { view, page: rawPage, status } = await searchParams;
  const event = await loadConsoleEvent(eventId);
  if (section === 'applications') {
    if (itemId !== 'speakers' && itemId !== 'sponsors') notFound();
    const page = Math.max(1, Number.parseInt(rawPage || '1', 10) || 1);
    const validStatus = ['pending', 'contacted', 'approved', 'rejected'].includes(status || '') ? status : undefined;
    const api = itemId === 'speakers' ? 'speaker-applications' : 'sponsor-applications';
    const query = new URLSearchParams({ event: event.slug, page: String(page), limit: '20' });
    if (validStatus) query.set('status', validStatus);
    const result = await ticketsApiGet<CollabApplicationPage<SpeakerApplication | SponsorApplication>>(`/admin/${api}?${query}`);
    const listPath = eventConsoleHref(eventId, `applications/${itemId}`);
    const items = result.items.filter((application) => application.eventSlug === event.slug);
    return <div className="space-y-6">
      <Link href={eventConsoleHref(eventId, 'applications')} className="text-sm font-semibold text-blue-700 hover:underline">← Applications</Link>
      <SectionHeader eyebrow="People / Applications" title={itemId === 'speakers' ? 'Speaker applications' : 'Sponsor applications'} description={`Review submissions for ${event.name}.`} />
      <div className="flex flex-wrap gap-2">{['all', 'pending', 'contacted', 'approved', 'rejected'].map((option) => <Link key={option} href={`${listPath}${option === 'all' ? '' : `?status=${option}`}`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${(!validStatus && option === 'all') || validStatus === option ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}>{option}</Link>)}</div>
      <p className="text-sm text-slate-500">{result.total} {result.total === 1 ? 'application' : 'applications'}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Role / interest</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{items.length === 0 ? <tr><td colSpan={5} className="px-4 py-14 text-center text-slate-500">No applications in this view.</td></tr> : items.map((application) => <tr key={application._id} className="hover:bg-blue-50/30"><td className="px-4 py-4"><p className="font-semibold text-slate-900">{itemId === 'sponsors' ? (application as SponsorApplication).companyName : application.fullName}</p><p className="text-xs text-slate-500">{application.email}</p></td><td className="px-4 py-4 text-slate-600">{itemId === 'sponsors' ? (application as SponsorApplication).sponsorType || '—' : (application as SpeakerApplication).topicTitle || '—'}</td><td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{application.status}</span></td><td className="px-4 py-4 text-slate-500">{formatEventDate(application.createdAt, event.timezone)}</td><td className="px-4 py-4 text-right"><Link href={`${listPath}/${application._id}`} className="font-semibold text-blue-700 hover:underline">Review</Link></td></tr>)}</tbody></table></div>
      <Pagination basePath={listPath} page={page} limit={20} total={result.total} params={{ status: validStatus }} />
    </div>;
  }
  if (section !== 'registrations' && section !== 'payments' && section !== 'side-events' && section !== 'speakers') notFound();
  if (!/^[a-f0-9]{24}$/i.test(itemId)) notFound();
  const sectionPath = eventConsoleHref(eventId, section);

  if (section === 'registrations') {
    return <RegistrationDetailPage params={Promise.resolve({ eventId, registrationId: itemId })} consoleEventPath={eventConsoleHref(eventId)} />;
  }

  if (section === 'payments') {
    let payment: AdminPaymentDetail;
    try { payment = await ticketsApiGet<AdminPaymentDetail>(`/admin/payments/${itemId}`); }
    catch (error) { unstable_rethrow(error); notFound(); }
    if (overviewEventId(payment.eventId) !== eventId) notFound();
    const registrationId = payment.registrationId ? overviewEventId(payment.registrationId) : null;
    return <div className="space-y-6">
      <Link href={sectionPath} className="text-sm font-medium text-stone-500 hover:text-stone-900">← Payments</Link>
      <SectionHeader eyebrow="Finance / Payment" title="Payment details" description={`Reference ${itemId}`} />
      <div className={consoleCard}>
        <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Amount', money(payment.amountMinor, payment.currency)],
            ['Status', payment.status.replaceAll('_', ' ')],
            ['Provider', payment.providerCode],
            ['Ticket tier', detailValue(payment.tierId)],
            ['Created', formatEventDate(payment.createdAt, event.timezone)],
            ['Updated', formatEventDate(payment.updatedAt, event.timezone)],
          ].map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt><dd className="mt-1 text-sm font-semibold capitalize text-stone-900">{value}</dd></div>)}
        </dl>
        {registrationId ? <Link href={`${eventConsoleHref(eventId, 'registrations')}/${registrationId}`} className="mt-8 inline-block border-t border-stone-100 pt-5 text-sm font-semibold text-stone-900 hover:underline">Open linked registration →</Link> : <p className="mt-8 border-t border-stone-100 pt-5 text-sm text-stone-500">No registration is linked to this payment.</p>}
      </div>
    </div>;
  }

  if (section === 'side-events') {
    let sideEvent: AdminSideEvent;
    try { sideEvent = await ticketsApiGet<AdminSideEvent>(`/admin/side-events/${itemId}`); }
    catch (error) { unstable_rethrow(error); notFound(); }
    if (sideEvent.parent?.slug !== event.slug || normalizeDocumentId(sideEvent.parent._id) !== eventId) notFound();
    const views = [{ key: 'details', label: 'Details' }, { key: 'registrations', label: 'Registrations' }, { key: 'check-in', label: 'Check-in' }];
    const activeView = views.some((item) => item.key === view) ? view : 'details';
    return <div className="space-y-6">
      <Link href={sectionPath} className="text-sm font-medium text-stone-500 hover:text-stone-900">← Side events</Link>
      <SectionHeader eyebrow="Program / Side event" title={sideEvent.name} description={`${sideEvent.status} · ${sideEvent.slug}`} />
      <nav aria-label="Side event sections" className="flex gap-2 border-b border-stone-200 pb-2">{views.map((item) => <Link key={item.key} href={`${sectionPath}/${itemId}?view=${item.key}`} className={`rounded-md px-3 py-2 text-sm font-medium ${activeView === item.key ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>{item.label}</Link>)}</nav>
      {activeView === 'details' ? <SideEventEditor key={`${sideEvent._id}:${sideEvent.version}`} event={sideEvent} currencies={SIDE_EVENT_CURRENCIES} returnTo={`${sectionPath}/${itemId}`} lockedParentSlug={event.slug} /> : null}
      {activeView === 'registrations' ? <SideEventRegistrations eventId={sideEvent._id} basePath={sectionPath} itemId={itemId} page={Math.max(1, Number.parseInt(rawPage || '1', 10) || 1)} /> : null}
      {activeView === 'check-in' ? <SideEventCheckIn eventId={sideEvent._id} days={sideEvent.days} timezone={sideEvent.timezone} /> : null}
    </div>;
  }

  let speaker: PublicSpeaker;
  try { speaker = await ticketsApiGet<PublicSpeaker>(`/admin/public-speakers/${itemId}`); }
  catch (error) { unstable_rethrow(error); notFound(); }
  if (speaker.eventSlug !== event.slug) notFound();
  const options = await fetchEventOptions();
  return <div className="space-y-6">
    <Link href={sectionPath} className="text-sm font-medium text-stone-500 hover:text-stone-900">← Speakers</Link>
    <SectionHeader eyebrow="People / Speaker" title={`Edit ${speaker.name}`} description="Manage this event's public speaker profile, order and visibility." />
    <PublicSpeakerForm speaker={speaker} events={options} lockedEventSlug={event.slug} returnTo={sectionPath} />
  </div>;
}

async function SideEventRegistrations({ eventId, basePath, itemId, page }: { eventId: string; basePath: string; itemId: string; page: number }) {
  const { data, total } = await ticketsApiGet<{ data: Array<{ _id: string; email: string; name?: string; status: string }>; total: number }>(`/admin/events/${eventId}/registrations?page=${page}&limit=20`);
  return <div className={consoleCard}>
    <h3 className="text-base font-semibold text-stone-900">Registrations <span className="text-stone-500">({total})</span></h3>
    {data.length === 0 ? <p className="mt-5 text-sm text-stone-500">No registrations yet.</p> : <ul className="mt-5 divide-y divide-stone-100">{data.map((registration) => <li key={registration._id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-stone-900">{registration.name || registration.email}</p><p className="text-xs text-stone-500">{registration.email} · {registration.status}</p></div><Link href={`${basePath}/${itemId}/registrations/${registration._id}`} className="text-sm font-semibold text-stone-900 hover:underline">Open</Link></li>)}</ul>}
    <div className="mt-5"><Pagination basePath={`${basePath}/${itemId}`} page={page} limit={20} total={total} params={{ view: 'registrations' }} /></div>
  </div>;
}
