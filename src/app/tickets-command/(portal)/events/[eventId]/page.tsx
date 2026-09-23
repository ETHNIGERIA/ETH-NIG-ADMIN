import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { AdminEvent, Paginated } from '@/tickets-portal/types/admin-events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type { AdminFormField } from '@/tickets-portal/types/admin-form-fields';
import type { ProgramAdmission } from '@/tickets-portal/types/admin-program-admission';
import type { AdminDiscount } from '@/tickets-portal/types/admin-discounts';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { normalizeAdminRegistration } from '@/tickets-portal/lib/admin-registrations';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { EventDetailForms } from '@/tickets-portal/components/events/EventDetailForms';
import { FormFieldsManager } from '@/tickets-portal/components/events/FormFieldsManager';
import { EventDiscountsManager } from '@/tickets-portal/components/discounts/EventDiscountsManager';
import { fetchAllEventFormFields } from '@/tickets-portal/data/event-form-fields-read';

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

function sortFormFields(fields: AdminFormField[]): AdminFormField[] {
  return [...fields].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );
}

function fmt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: AdminRegistration['status'] }) {
  const styles: Record<AdminRegistration['status'], string> = {
    pending: 'bg-amber-50 text-amber-900',
    confirmed: 'bg-emerald-50 text-emerald-800',
    cancelled: 'bg-stone-100 text-stone-600',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<{ tab?: string; page?: string }>;
}) {
  const { eventId } = await params;
  const sp = (await searchParams) ?? {};
  const activeTab = sp.tab ?? 'overview';
  const regPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  let raw: AdminEvent;
  try {
    raw = await ticketsApiGet<AdminEvent>(`/admin/events/${eventId}`);
  } catch {
    notFound();
  }

  const id = normalizeDocumentId(raw._id);
  const event: AdminEvent = { ...raw, _id: id };

  // Fetch tiers
  let tiers: AdminTicketTier[] = [];
  try {
    const p = await ticketsApiGet<Paginated<AdminTicketTier>>(
      `/admin/events/${id}/tiers?page=1&limit=100`,
    );
    tiers = p.data.map((t) => ({ ...t, _id: normalizeDocumentId(t._id) }));
  } catch {
    tiers = [];
  }

  // Fetch form fields
  let formFields: AdminFormField[] = [];
  let formFieldsLoadError: string | null = null;
  try {
    const rawFields = await fetchAllEventFormFields(id);
    formFields = sortFormFields(
      rawFields.map((f) => ({
        ...f,
        _id: normalizeDocumentId(f._id),
        eventId: normalizeDocumentId(f.eventId),
      })),
    );
  } catch (e) {
    formFieldsLoadError = e instanceof Error ? e.message : 'Could not load registration fields.';
  }

  // Fetch program admission
  let programAdmission: ProgramAdmission[] = [];
  let programAdmissionLoadError: string | null = null;
  try {
    programAdmission = await ticketsApiGet<ProgramAdmission[]>(
      `/admin/events/${id}/program-admission`,
    );
  } catch (e) {
    programAdmissionLoadError =
      e instanceof Error ? e.message : 'Could not load program admission.';
  }

  // Fetch discounts if needed
  let discounts: AdminDiscount[] = [];
  let discountsLoadError: string | null = null;
  if (activeTab === 'discounts') {
    try {
      const rawDiscounts = await ticketsApiGet<AdminDiscount[]>(
        `/admin/discounts?eventId=${encodeURIComponent(id)}`,
      );
      discounts = rawDiscounts.map((d) => ({
        ...d,
        _id: normalizeDocumentId(d._id),
        eventId: d.eventId != null ? normalizeDocumentId(String(d.eventId)) : d.eventId,
        validFrom: typeof d.validFrom === 'string' ? d.validFrom : new Date(d.validFrom).toISOString(),
        validUntil: typeof d.validUntil === 'string' ? d.validUntil : new Date(d.validUntil).toISOString(),
      }));
    } catch (e) {
      discountsLoadError = e instanceof Error ? e.message : 'Could not load discounts.';
    }
  }

  // Fetch registrations if needed
  let regResult: Paginated<AdminRegistration> | null = null;
  let regLoadError: string | null = null;
  if (activeTab === 'registrations') {
    try {
      regResult = await ticketsApiGet<Paginated<AdminRegistration>>(
        `/admin/events/${id}/registrations?page=${regPage}&limit=20`,
      );
    } catch (e) {
      regLoadError = e instanceof Error ? e.message : 'Could not load registrations.';
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview & Tiers' },
    { key: 'fields', label: 'Registration Fields' },
    { key: 'discounts', label: 'Discounts & Promo Codes' },
    { key: 'registrations', label: 'Registrations' },
  ];

  const tierNameById = new Map(tiers.map((t) => [normalizeDocumentId(t._id), t.name]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tickets-command/events"
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Events
        </Link>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-stone-900">{event.name}</h1>
        <p className="mt-1 text-sm text-stone-500">Slug: <span className="font-mono text-stone-700">{event.slug}</span></p>
      </div>

      {/* Consolidated Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6 overflow-x-auto">
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={`/tickets-command/events/${id}?tab=${t.key}`}
              className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <EventDetailForms
          event={event}
          eventId={id}
          tiers={tiers}
          formFields={formFields}
          formFieldsLoadError={formFieldsLoadError}
          programAdmission={programAdmission}
          programAdmissionLoadError={programAdmissionLoadError}
        />
      )}

      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 text-sm text-stone-600">
            Manage custom registration questions collected during checkout for <strong className="text-stone-900">{event.name}</strong>.
          </div>
          <FormFieldsManager
            eventId={id}
            fields={formFields}
            tiers={tiers}
            fieldsLoadError={formFieldsLoadError}
          />
        </div>
      )}

      {activeTab === 'discounts' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 text-sm text-stone-600">
            Create and manage promotional discount codes for <strong className="text-stone-900">{event.name}</strong>.
          </div>
          {discountsLoadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
              <p className="font-semibold">Could not load discounts</p>
              <p className="mt-2 text-[14px]">{discountsLoadError}</p>
            </div>
          ) : (
            <EventDiscountsManager eventId={id} eventName={event.name} discounts={discounts} />
          )}
        </div>
      )}

      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4 text-sm text-stone-600">
            Review attendee checkouts and registration status for <strong className="text-stone-900">{event.name}</strong>.
          </div>
          {regLoadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
              <p className="font-semibold">Could not load registrations</p>
              <p className="mt-2 text-[14px]">{regLoadError}</p>
            </div>
          ) : regResult ? (
            <div className="space-y-4">
              <div className={tableWrap}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-100">
                      <th className={th}>Contact</th>
                      <th className={th}>Tier</th>
                      <th className={`${th} hidden sm:table-cell`}>Qty</th>
                      <th className={th}>Status</th>
                      <th className={`${th} hidden md:table-cell`}>Total</th>
                      <th className={`${th} hidden lg:table-cell`}>Created</th>
                      <th className={`${th} text-right`}><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {regResult.data.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={`${td} py-16 text-center text-stone-400`}>
                          No registrations for this event yet.
                        </td>
                      </tr>
                    ) : (
                      regResult.data.map((r) => {
                        const reg = normalizeAdminRegistration(r);
                        const rid = reg._id;
                        const tierLabel = tierNameById.get(reg.tierId) ?? reg.tierId.slice(-6);
                        return (
                          <tr key={rid} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                            <td className={td}>
                              <Link
                                href={`/tickets-command/events/${id}/registrations/${rid}`}
                                className="font-medium text-stone-900 hover:underline"
                              >
                                {reg.email}
                              </Link>
                              {reg.name && <p className="mt-0.5 text-[13px] text-stone-500">{reg.name}</p>}
                            </td>
                            <td className={`${td} text-[13px] text-stone-600`}>{tierLabel}</td>
                            <td className={`${td} hidden sm:table-cell`}>{reg.quantity}</td>
                            <td className={td}><StatusBadge status={reg.status} /></td>
                            <td className={`${td} hidden text-[13px] md:table-cell`}>
                              {typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}
                            </td>
                            <td className={`${td} hidden text-[13px] text-stone-500 lg:table-cell`}>
                              {fmt(reg.createdAt)}
                            </td>
                            <td className={`${td} whitespace-nowrap text-right`}>
                              <Link
                                href={`/tickets-command/events/${id}/registrations/${rid}`}
                                className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {regResult.pages > 1 && (
                <div className="flex items-center justify-between gap-4 text-[14px] text-stone-600">
                  <span>Page {regPage} of {regResult.pages} · {regResult.total} total</span>
                  <div className="flex gap-2">
                    {regPage > 1 ? (
                      <Link
                        href={`/tickets-command/events/${id}?tab=registrations&page=${regPage - 1}`}
                        className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="rounded-md px-3 py-1.5 text-stone-300">Previous</span>
                    )}
                    {regPage < regResult.pages ? (
                      <Link
                        href={`/tickets-command/events/${id}?tab=registrations&page=${regPage + 1}`}
                        className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="rounded-md px-3 py-1.5 text-stone-300">Next</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
