import Link from 'next/link';
import { notFound, redirect, unstable_rethrow } from 'next/navigation';
import { ArrowRight, Plus } from 'lucide-react';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { eventConsoleHref, formatEventDate, loadConsoleEvent } from '@/tickets-portal/lib/event-console';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { toQuery, redirectIfPastLastPage } from '@/tickets-portal/lib/list-params';
import { Pagination } from '@/tickets-portal/components/ui/Pagination';
import { SectionHeader, consoleCard } from '@/tickets-portal/components/events-v2/SectionHeader';
import { EventSettings } from '@/tickets-portal/components/events-v2/EventSettings';
import { EventTiersSection } from '@/tickets-portal/components/events/EventTiersSection';
import { FormFieldsManager } from '@/tickets-portal/components/events/FormFieldsManager';
import { ProgramAdmissionSection } from '@/tickets-portal/components/events/ProgramAdmissionSection';
import { PromoCodesManager } from '@/tickets-portal/components/promotions/PromoCodesManager';
import { PromoCodesHowItWorks } from '@/tickets-portal/components/promotions/PromoCodesHowItWorks';
import { getBuyerSite } from '@/tickets-portal/auth/server-config';
import { fetchAllEventFormFields } from '@/tickets-portal/data/event-form-fields-read';
import { toPromoCodePage } from '@/tickets-portal/lib/admin-promo-codes';
import { normalizeAdminRegistration } from '@/tickets-portal/lib/admin-registrations';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { PublicSpeakersTable } from '@/tickets-portal/components/speakers/PublicSpeakersTable';
import type { Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type { AdminFormField } from '@/tickets-portal/types/admin-form-fields';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import type { AdminPromoCode } from '@/tickets-portal/types/admin-promo-codes';
import type { ProgramAdmission } from '@/tickets-portal/types/admin-program-admission';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import type { PublicSpeakerPage } from '@/tickets-portal/types/public-speakers';
import type { AdminPaymentDetail } from '@/tickets-portal/types/admin-payments';

type ActiveSponsor = { _id: string; name: string; logo?: string; website?: string; description?: string; tier?: string; order?: number; eventSlug?: string };

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;
const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
const td = 'px-4 py-3 text-sm text-stone-700';

function ErrorCard({ error, label }: { error: unknown; label: string }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Could not load {label}. {error instanceof Error ? error.message : 'Try again.'}</div>;
}

function DataTable({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm"><table className="w-full min-w-[600px]"><thead className="border-b border-stone-100 bg-stone-50/70"><tr>{head}</tr></thead><tbody className="divide-y divide-stone-100">{children}</tbody></table></div>;
}

async function loadTiers(eventId: string) {
  const result = await ticketsApiGet<Paginated<AdminTicketTier>>(`/admin/events/${eventId}/tiers?page=1&limit=100`);
  return result.data.map((tier) => ({ ...tier, _id: normalizeDocumentId(tier._id) }));
}

export default async function EventConsoleSection({ params, searchParams }: {
  params: Promise<{ eventId: string; section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { eventId, section } = await params;
  const { page: rawPage } = await searchParams;
  const parsed = Number.parseInt(rawPage ?? '', 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const event = await loadConsoleEvent(eventId);
  const sectionPath = eventConsoleHref(eventId, section);

  if (section === 'settings') {
    return <div className="space-y-6"><SectionHeader eyebrow="Setup" title="Event settings" description="Manage publication, dates, configured days and site integration settings." /><EventSettings event={event} /></div>;
  }

  if (section === 'tickets') {
    try {
      const tiers = await loadTiers(eventId);
      return <div className="space-y-6"><SectionHeader eyebrow="Checkout" title="Tickets & pricing" description="Manage the tiers, capacities, early bird prices and benefits sold for this event." /><div className={consoleCard}><EventTiersSection eventId={eventId} initialTiers={tiers} returnTo={sectionPath} /></div></div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="ticket tiers" />; }
  }

  if (section === 'fields') {
    let tiers: AdminTicketTier[] = [];
    let fields: AdminFormField[] = [];
    let loadError: string | null = null;
    try {
      [tiers, fields] = await Promise.all([loadTiers(eventId), fetchAllEventFormFields(eventId)]);
      fields = fields.map((field) => ({ ...field, _id: normalizeDocumentId(field._id), eventId: normalizeDocumentId(field.eventId) }));
    } catch (error) { unstable_rethrow(error); loadError = error instanceof Error ? error.message : 'Could not load fields.'; }
    return <div className="space-y-6"><SectionHeader eyebrow="Checkout" title="Registration form" description="Build the questions attendees answer during checkout. Saved fields are specific to this event." /><FormFieldsManager eventId={eventId} fields={fields} tiers={tiers} fieldsLoadError={loadError} returnTo={sectionPath} /></div>;
  }

  if (section === 'registrations') {
    try {
      const [data, tiers] = await Promise.all([
        ticketsApiGet<Paginated<AdminRegistration>>(`/admin/events/${eventId}/registrations${toQuery({ page, limit: PAGE_SIZE })}`),
        loadTiers(eventId),
      ]);
      redirectIfPastLastPage(sectionPath, page, PAGE_SIZE, data.total);
      const names = new Map(tiers.map((tier) => [tier._id, tier.name]));
      return <div className="space-y-6">
        <SectionHeader eyebrow="Attendees" title="Registrations" description="Review checkout status and open each registration for tickets, form answers and actions." />
        <p className="text-sm text-stone-500">{data.total} {data.total === 1 ? 'registration' : 'registrations'}</p>
        <DataTable head={<><th className={th}>Attendee</th><th className={th}>Ticket tier</th><th className={th}>Qty</th><th className={th}>Status</th><th className={th}>Total</th><th className={th}></th></>}>
          {data.data.length === 0 ? <tr><td colSpan={6} className={`${td} py-14 text-center text-stone-500`}>No registrations yet.</td></tr> : data.data.map((raw) => {
            const reg = normalizeAdminRegistration(raw);
            return <tr key={reg._id} className="hover:bg-stone-50/70">
              <td className={td}><p className="font-medium text-stone-900">{reg.name || reg.email}</p>{reg.name ? <p className="text-xs text-stone-500">{reg.email}</p> : null}</td>
              <td className={td}>{names.get(reg.tierId) ?? 'Unknown tier'}</td><td className={`${td} tabular-nums`}>{reg.quantity}</td>
              <td className={`${td} capitalize`}>{reg.status}</td><td className={td}>{typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}</td>
              <td className={`${td} text-right`}><Link href={`${sectionPath}/${reg._id}`} className="font-semibold text-stone-900 hover:underline">Open</Link></td>
            </tr>;
          })}
        </DataTable>
        <Pagination basePath={sectionPath} page={page} limit={PAGE_SIZE} total={data.total} />
      </div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="registrations" />; }
  }

  if (section === 'payments') {
    try {
      const data = await ticketsApiGet<Paginated<AdminPaymentDetail>>(`/admin/payments${toQuery({ eventId, page, limit: PAGE_SIZE })}`);
      redirectIfPastLastPage(sectionPath, page, PAGE_SIZE, data.total);
      return <div className="space-y-6">
        <SectionHeader eyebrow="Finance" title="Payments" description="Payment attempts for this event, with their provider and current status." />
        <p className="text-sm text-stone-500">{data.total} {data.total === 1 ? 'payment' : 'payments'}</p>
        <DataTable head={<><th className={th}>Payment</th><th className={th}>Amount</th><th className={th}>Provider</th><th className={th}>Status</th><th className={th}>Created</th><th className={th}></th></>}>
          {data.data.length === 0 ? <tr><td colSpan={6} className={`${td} py-14 text-center text-stone-500`}>No payments yet.</td></tr> : data.data.map((payment) => {
            const id = normalizeDocumentId(payment._id);
            return <tr key={id} className="hover:bg-stone-50/70"><td className={`${td} font-mono text-xs`}>{id.slice(-10)}</td><td className={td}>{formatMinorToNgn(payment.amountMinor)}</td><td className={td}>{payment.providerCode}</td><td className={`${td} capitalize`}>{payment.status.replaceAll('_', ' ')}</td><td className={td}>{formatEventDate(payment.createdAt, event.timezone)}</td><td className={`${td} text-right`}><Link href={`${sectionPath}/${id}`} className="font-semibold text-stone-900 hover:underline">Open</Link></td></tr>;
          })}
        </DataTable>
        <Pagination basePath={sectionPath} page={page} limit={PAGE_SIZE} total={data.total} />
      </div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="payments" />; }
  }

  if (section === 'promotions') {
    try {
      const res = toPromoCodePage(await ticketsApiGet<Paginated<AdminPromoCode> | AdminPromoCode[]>(`/admin/promo-codes${toQuery({ eventId, owner: 'none', page, limit: PAGE_SIZE })}`));
      redirectIfPastLastPage(sectionPath, page, PAGE_SIZE, res.total);
      return <div className="space-y-6"><SectionHeader eyebrow="Growth" title="Promo codes" description="Event-owned discounts and tracking codes. These codes apply only to this event." /><PromoCodesHowItWorks owner="event" /><PromoCodesManager codes={res.codes} total={res.total} ownerKind="event" ownerId={eventId} buyerSite={getBuyerSite()} /><Pagination basePath={sectionPath} page={page} limit={PAGE_SIZE} total={res.total} /></div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="promo codes" />; }
  }

  if (section === 'programs') {
    try {
      const [tiers, admission] = await Promise.all([
        loadTiers(eventId),
        ticketsApiGet<ProgramAdmission[]>(`/admin/events/${eventId}/program-admission`),
      ]);
      return <div className="space-y-6"><SectionHeader eyebrow="Eligibility" title="Program access" description="Choose which ticket tiers qualify attendees for hackathon and founders pitch applications." /><div className={consoleCard}><ProgramAdmissionSection eventId={eventId} tiers={tiers} admission={admission} returnTo={sectionPath} /></div><div className="grid gap-3 sm:grid-cols-2"><Link href="/tickets-command/programs/hackathon" className="rounded-xl border border-stone-200 bg-white p-4 text-sm font-medium text-stone-800 hover:bg-stone-50">Review hackathon applications <ArrowRight className="ml-1 inline h-4 w-4" /></Link><Link href="/tickets-command/programs/pitch" className="rounded-xl border border-stone-200 bg-white p-4 text-sm font-medium text-stone-800 hover:bg-stone-50">Review pitch applications <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div></div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="program access" />; }
  }

  if (section === 'side-events') {
    try {
      const data = await ticketsApiGet<Paginated<AdminSideEvent>>(`/admin/side-events${toQuery({ eventSlug: event.slug, page, limit: PAGE_SIZE })}`);
      redirectIfPastLastPage(sectionPath, page, PAGE_SIZE, data.total);
      const items = data.data.filter((item) => item.parent?.slug === event.slug);
      return <div className="space-y-6">
        <SectionHeader eyebrow="Program" title="Side events" description="Activities attached to this main event. Standalone and other event activities stay outside this workspace." action={<Link href={`${sectionPath}/new`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> New side event</Link>} />
        <p className="text-sm text-stone-500">{data.total} attached {data.total === 1 ? 'activity' : 'activities'}</p>
        <DataTable head={<><th className={th}>Activity</th><th className={th}>Status</th><th className={th}>Dates</th><th className={th}></th></>}>
          {items.length === 0 ? <tr><td colSpan={4} className={`${td} py-14 text-center text-stone-500`}>No side events attached yet.</td></tr> : items.map((item) => <tr key={item._id} className="hover:bg-stone-50/70"><td className={td}><p className="font-semibold text-stone-900">{item.name}</p><p className="font-mono text-xs text-stone-500">{item.slug}</p></td><td className={`${td} capitalize`}>{item.status}</td><td className={td}>{formatEventDate(item.startsAt, item.timezone)}</td><td className={`${td} text-right`}><Link href={`${sectionPath}/${item._id}`} className="font-semibold text-stone-900 hover:underline">Open</Link></td></tr>)}
        </DataTable>
        <Pagination basePath={sectionPath} page={page} limit={PAGE_SIZE} total={data.total} />
      </div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="side events" />; }
  }

  if (section === 'speakers') {
    try {
      const data = await ticketsApiGet<PublicSpeakerPage>(`/admin/public-speakers${toQuery({ event: event.slug, page, limit: PAGE_SIZE })}`);
      redirectIfPastLastPage(sectionPath, page, PAGE_SIZE, data.total);
      const items = data.items.filter((speaker) => speaker.eventSlug === event.slug);
      return <div className="space-y-6"><SectionHeader eyebrow="People" title="Speakers" description="Current public speaker profiles for this event, including profiles that are hidden from the site." action={<Link href={`${sectionPath}/new`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add speaker</Link>} /><p className="text-sm text-stone-500">{data.total} {data.total === 1 ? 'speaker' : 'speakers'}</p><PublicSpeakersTable speakers={items} basePath={sectionPath} /><Pagination basePath={sectionPath} page={page} limit={PAGE_SIZE} total={data.total} /></div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="speakers" />; }
  }

  if (section === 'sponsors') {
    try {
      const sponsors = await ticketsApiGet<ActiveSponsor[]>(`/sponsors${toQuery({ event: event.slug })}`);
      const items = sponsors.filter((sponsor) => !sponsor.eventSlug || sponsor.eventSlug === event.slug);
      return <div className="space-y-6">
        <SectionHeader eyebrow="People" title="Sponsors" description="Active sponsor profiles displayed for this event, including shared sponsors." />
        <p className="text-sm text-slate-500">{items.length} active {items.length === 1 ? 'sponsor' : 'sponsors'}</p>
        <DataTable head={<><th className={th}>Sponsor</th><th className={th}>Tier</th><th className={th}>Scope</th><th className={th}>Order</th><th className={th}>Website</th></>}>
          {items.length === 0 ? <tr><td colSpan={5} className={`${td} py-14 text-center text-slate-500`}>No active sponsors appear for this event.</td></tr> : items.map((sponsor) => <tr key={sponsor._id} className="hover:bg-slate-50"><td className={td}><div className="flex items-center gap-3">{sponsor.logo ? <img src={sponsor.logo} alt="" className="h-10 w-10 border border-slate-200 object-contain" /> : <span className="flex h-10 w-10 items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">{sponsor.name.charAt(0)}</span>}<div><p className="font-semibold text-slate-900">{sponsor.name}</p>{sponsor.description ? <p className="line-clamp-1 max-w-sm text-xs text-slate-500">{sponsor.description}</p> : null}</div></div></td><td className={`${td} capitalize`}>{sponsor.tier || '—'}</td><td className={td}>{sponsor.eventSlug ? 'This event' : 'Shared'}</td><td className={`${td} tabular-nums`}>{sponsor.order ?? 0}</td><td className={td}>{sponsor.website && /^https?:\/\//i.test(sponsor.website) ? <a href={sponsor.website} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">Visit website</a> : '—'}</td></tr>)}
        </DataTable>
      </div>;
    } catch (error) { unstable_rethrow(error); return <ErrorCard error={error} label="sponsors" />; }
  }

  if (section === 'applications') {
    redirect(`${sectionPath}/speakers`);
  }

  notFound();
}
