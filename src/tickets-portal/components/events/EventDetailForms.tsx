'use client';

import { useActionState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  deleteEventAction,
  setEventStatusAction,
  updateEventAction,
  type ActionState,
} from '@/tickets-portal/actions/events';
import type { AdminEvent, EventStatus } from '@/tickets-portal/types/admin-events';
import type { AdminFormField } from '@/tickets-portal/types/admin-form-fields';
import { toDatetimeLocalValue } from '@/tickets-portal/lib/datetime-local';
import { DetailIntegrationHint } from '@/tickets-portal/components/events/IntegrationHintCollapsible';
import { EventTiersSection } from '@/tickets-portal/components/events/EventTiersSection';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

const FIELDS_PREVIEW = 5;

function sortFormFields(fields: AdminFormField[]): AdminFormField[] {
  return [...fields].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  const styles: Record<EventStatus, string> = {
    draft: 'bg-stone-100 text-stone-700',
    published: 'bg-emerald-50 text-emerald-800',
    archived: 'bg-amber-50 text-amber-900',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function DetailSection({
  id,
  eyebrow,
  title,
  aside,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-l-2 border-stone-300 pl-5 sm:scroll-mt-28 sm:pl-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{eyebrow}</p>
          ) : null}
          <h2 className={`text-[15px] font-semibold text-stone-900 ${eyebrow ? 'mt-1' : ''}`}>{title}</h2>
        </div>
        {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EventPageNav({ eventId }: { eventId: string }) {
  const jump = [
    { href: '#section-status', label: 'Status' },
    { href: '#section-details', label: 'Details' },
    { href: '#section-registration-fields', label: 'Fields' },
    { href: '#section-tiers', label: 'Tiers' },
    { href: '#section-danger', label: 'Danger' },
  ];

  return (
    <nav
      className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-lg border border-stone-200 bg-white/80 px-3 py-2.5 text-[13px] shadow-sm sm:gap-x-0"
      aria-label="On this page"
    >
      {jump.map((item, i) => (
        <span key={item.href} className="inline-flex items-center">
          {i > 0 ? (
            <span className="mx-2 h-3 w-px bg-stone-300" aria-hidden />
          ) : null}
          <a
            href={item.href}
            className="text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
          >
            {item.label}
          </a>
        </span>
      ))}
      <span className="mx-2 h-3 w-px bg-stone-300" aria-hidden />
      <Link
        href={`/tickets-command/events/${eventId}/fields`}
        className="font-medium text-stone-800 underline-offset-4 hover:underline"
      >
        Manage fields
      </Link>
      <span className="mx-2 h-3 w-px bg-stone-300" aria-hidden />
      <Link
        href={`/tickets-command/events/${eventId}/registrations`}
        className="font-medium text-stone-800 underline-offset-4 hover:underline"
      >
        Registrations
      </Link>
      <span className="mx-2 h-3 w-px bg-stone-300" aria-hidden />
      <Link
        href={`/tickets-command/events/${eventId}/discounts`}
        className="font-medium text-stone-800 underline-offset-4 hover:underline"
      >
        Discounts
      </Link>
    </nav>
  );
}

export function EventDetailForms({
  event,
  eventId,
  tiers,
  formFields,
  formFieldsLoadError,
}: {
  event: AdminEvent;
  eventId: string;
  tiers: AdminTicketTier[];
  formFields: AdminFormField[];
  /** When set, form fields failed to load — summary counts may be wrong. */
  formFieldsLoadError?: string | null;
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateEventAction, undefined as ActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteEventAction, undefined as ActionState);
  const [statusState, statusAction, statusPending] = useActionState(setEventStatusAction, undefined as ActionState);

  const originsText = (event.allowedOrigins ?? []).join('\n');

  const tierCount = tiers.length;
  const sortedFields = sortFormFields(formFields);
  const fieldCount = sortedFields.length;
  const previewFields = sortedFields.slice(0, FIELDS_PREVIEW);
  const moreCount = Math.max(0, fieldCount - FIELDS_PREVIEW);

  return (
    <div className="space-y-10">
      <EventPageNav eventId={eventId} />

      <DetailSection id="section-status" eyebrow="Event" title="Status & listing">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={event.status} />
          <span className="text-[13px] text-stone-400" aria-hidden>
            |
          </span>
          <span className="text-[13px] text-stone-600">
            {tierCount === 0
              ? 'No ticket tiers yet'
              : tierCount === 1
                ? '1 ticket tier'
                : `${tierCount} ticket tiers`}
          </span>
        </div>

        {statusState?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
            {statusState.error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="w-full text-[13px] font-medium text-stone-500">Set status</span>
          {(['draft', 'published', 'archived'] as const).map((s) => (
            <form key={s} action={statusAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                disabled={statusPending || event.status === s}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-[13px] capitalize text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                {s}
              </button>
            </form>
          ))}
        </div>
      </DetailSection>
      <br />
      <hr />
      <br />

      <DetailSection
        id="section-details"
        eyebrow="Basics"
        title="Event details"
        aside={
          <>

          </>
        }
      >
        <p className="font-mono text-[14px] text-stone-600">{event.slug}</p>
        <DetailIntegrationHint />

        {updateState?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
            {updateState.error}
          </div>
        ) : null}

        <form action={updateAction} className="mt-6 max-w-lg space-y-5">
          <input type="hidden" name="eventId" value={eventId} />

          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input id="name" name="name" required defaultValue={event.name} className={fieldClass} />
          </div>

          <div>
            <label htmlFor="startsAt" className={labelClass}>
              Starts
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(event.startsAt)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="endsAt" className={labelClass}>
              Ends
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(event.endsAt)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="allowedOrigins" className={labelClass}>
              Allowed origins
            </label>
            <textarea
              id="allowedOrigins"
              name="allowedOrigins"
              rows={3}
              defaultValue={originsText}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <button
            type="submit"
            disabled={updatePending}
            className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {updatePending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </DetailSection>
      <br />
      <hr />
      <br />

      <DetailSection
        id="section-registration-fields"
        eyebrow="Checkout"
        title="Registration fields"
        aside={
          <>
            <Link
              href={`/tickets-command/events/${eventId}/fields`}
              className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
            >
              Manage fields
            </Link>
          </>
        }
      >
        {formFieldsLoadError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-950">
            <p className="font-medium">Could not load field list for this summary.</p>
            <p className="mt-1 text-amber-900/90">{formFieldsLoadError}</p>
            <p className="mt-2 text-[12px] text-amber-900/80">
              Open <strong className="font-medium">Manage fields</strong> to see saved questions.
            </p>
          </div>
        ) : null}

        {!formFieldsLoadError ? (
          <p className="text-[14px] text-stone-600">
            {fieldCount === 0
              ? 'No custom questions yet — attendees only pick a tier and pay.'
              : fieldCount === 1
                ? 'Collecting 1 field at checkout.'
                : `Collecting ${fieldCount} fields at checkout.`}
          </p>
        ) : null}

        {!formFieldsLoadError && fieldCount > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {previewFields.map((f) => (
              <span
                key={f.fieldKey}
                className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[12px] text-stone-700"
              >
                {f.label}
              </span>
            ))}
            {moreCount > 0 ? (
              <span className="rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-[12px] text-stone-500">
                + {moreCount} more
              </span>
            ) : null}
          </div>
        ) : null}
      </DetailSection>
      <br />
      <hr />
      <br />


      <div id="section-tiers" className="scroll-mt-24 border-l-2 border-stone-300 pl-5 sm:scroll-mt-28 sm:pl-6">
        <EventTiersSection eventId={eventId} initialTiers={tiers} />
      </div>

      <br />
      <hr />
      <br />

      <section id="section-danger" className="scroll-mt-24 border-l-2 border-red-300/90 pl-5 sm:scroll-mt-28 sm:pl-6">
        <details className="group rounded-lg border-2 border-red-400 bg-red-50/50">
          <summary className="cursor-pointer list-none px-4 py-3 text-[13px] font-semibold text-red-900 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>▸</span>
              Danger zone
              <span className="font-normal text-red-800/70">(expand)</span>
            </span>
          </summary>
          <div className="border-t border-red-200/90 px-4 pb-4 pt-3">
            {deleteState?.error ? (
              <div className="mb-3 rounded-md border border-red-200 bg-white px-3 py-2 text-[14px] text-red-800">
                {deleteState.error}
              </div>
            ) : null}
            <p className="text-[13px] text-red-900/90">Soft-deletes this event in the API.</p>
            <form action={deleteAction} className="mt-4">
              <input type="hidden" name="eventId" value={eventId} />
              <button
                type="submit"
                disabled={deletePending}
                className="rounded-md border border-red-500 bg-white px-4 py-2 text-[14px] font-medium text-red-800 hover:bg-red-100/80 disabled:opacity-50"
              >
                {deletePending ? 'Deleting…' : 'Delete event'}
              </button>
            </form>
          </div>
        </details>
        <div className="mt-6">
          <Link href="/tickets-command/events" className="text-[14px] text-stone-600 hover:text-stone-900">
            ← All events
          </Link>
        </div>
      </section>
    </div>
  );
}
