'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import {
  deleteCollabApplicationAction,
  updateCollabApplicationStatusAction,
} from '@/tickets-portal/actions/collab-applications';
import {
  COLLAB_APPLICATION_STATUSES,
  type CollabApplicationKind,
  type CollabApplicationStatus,
  type SpeakerApplication,
  type SponsorApplication,
} from '@/tickets-portal/types/admin-collab-applications';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import { StatusFilter } from '@/tickets-portal/components/ui/StatusFilter';

const STATUS_STYLES: Record<CollabApplicationStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  contacted: 'border-blue-200 bg-blue-50 text-blue-700',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
};

function StatusBadge({ status }: { status: CollabApplicationStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status] ?? 'border-stone-200 bg-stone-100 text-stone-600',
      )}
    >
      {status}
    </span>
  );
}

function formatDate(value?: string) {
  return value
    ? new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
}

type AnyCollab = SponsorApplication | SpeakerApplication;

type Props = { total: number; filtered: boolean } & (
  | { kind: 'sponsor'; items: SponsorApplication[] }
  | { kind: 'speaker'; items: SpeakerApplication[] }
);

function primaryLabel(kind: CollabApplicationKind, item: AnyCollab) {
  return kind === 'sponsor' ? (item as SponsorApplication).companyName : item.fullName;
}

function secondaryLabel(kind: CollabApplicationKind, item: AnyCollab) {
  if (kind === 'sponsor') return `${item.fullName} · ${item.email}`;
  const s = item as SpeakerApplication;
  return [s.role, s.company].filter(Boolean).join(' at ') || item.email;
}

function detailLabel(kind: CollabApplicationKind, item: AnyCollab) {
  if (kind === 'sponsor') return (item as SponsorApplication).sponsorType || '—';
  return (item as SpeakerApplication).topicTitle || '—';
}

export function CollabApplicationsManager(props: Props) {
  const { kind, total, filtered } = props;
  const items: AnyCollab[] = props.items;
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<AnyCollab | null>(null);

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
  const td = 'px-4 py-3 align-top text-sm text-stone-700';
  const noun = kind === 'sponsor' ? 'sponsor application' : 'speaker application';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {total} {total === 1 ? noun : `${noun}s`}
        </p>
        <StatusFilter statuses={COLLAB_APPLICATION_STATUSES} />
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm">
        {items.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-stone-500">
            {filtered ? 'No applications match this filter.' : 'No applications yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-stone-200/80 bg-stone-50/75">
                <tr>
                  <th className={th}>{kind === 'sponsor' ? 'Company' : 'Speaker'}</th>
                  <th className={th}>{kind === 'sponsor' ? 'Type' : 'Topic'}</th>
                  <th className={th}>Event</th>
                  <th className={th}>Submitted</th>
                  <th className={th}>Status</th>
                  <th className={clsx(th, 'w-8')} />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => setSelected(item)}
                    className="cursor-pointer transition-colors hover:bg-stone-50/70"
                  >
                    <td className={td}>
                      <p className="font-medium text-stone-900">{primaryLabel(kind, item)}</p>
                      <p className="text-xs text-stone-500">{secondaryLabel(kind, item)}</p>
                    </td>
                    <td className={clsx(td, 'max-w-xs')}>
                      <p className="line-clamp-1 capitalize text-stone-600">{detailLabel(kind, item)}</p>
                    </td>
                    <td className={clsx(td, 'text-xs text-stone-500')}>{item.eventSlug || '—'}</td>
                    <td className={clsx(td, 'whitespace-nowrap text-xs text-stone-500')}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td className={clsx(td, 'whitespace-nowrap')}>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className={clsx(td, 'text-right text-stone-300')}>
                      <ChevronRight className="h-4 w-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          kind={kind}
          application={selected}
          onClose={() => setSelected(null)}
          onDone={(title, message) => {
            setSelected(null);
            toast.success(title, message);
            router.refresh();
          }}
          onError={(title, message) => toast.error(title, message)}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="whitespace-pre-wrap break-words leading-relaxed text-stone-700">{value}</dd>
    </div>
  );
}

function ExternalLink({ href }: { href?: string }) {
  if (!href) return null;
  const safe = /^https?:\/\//i.test(href) ? href : null;
  return safe ? (
    <a href={safe} target="_blank" rel="noopener noreferrer" className="text-stone-900 underline">
      {href}
    </a>
  ) : (
    <>{href}</>
  );
}

function DetailModal({
  kind,
  application,
  onClose,
  onDone,
  onError,
}: {
  kind: CollabApplicationKind;
  application: AnyCollab;
  onClose: () => void;
  onDone: (title: string, message: string) => void;
  onError: (title: string, message: string) => void;
}) {
  const [status, setStatus] = useState<CollabApplicationStatus>(application.status);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const title = primaryLabel(kind, application);

  const save = () =>
    startTransition(async () => {
      const res = await updateCollabApplicationStatusAction(kind, application._id, status);
      if (res.error) onError('Could not update status', res.error);
      else onDone('Status updated', `${title} is now "${status}".`);
    });

  const remove = () =>
    startTransition(async () => {
      const res = await deleteCollabApplicationAction(kind, application._id);
      if (res.error) {
        setConfirmDelete(false);
        onError('Could not delete application', res.error);
      } else {
        onDone('Application deleted', `${title} was removed.`);
      }
    });

  const sponsor = kind === 'sponsor' ? (application as SponsorApplication) : null;
  const speaker = kind === 'speaker' ? (application as SpeakerApplication) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-900/50 p-4 backdrop-blur-xs sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 text-lg font-bold tracking-tight text-stone-900">{title}</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-500">
          <span>{application.email}</span>
          {application.phone ? <span>{application.phone}</span> : null}
          <span>Submitted {formatDate(application.createdAt)}</span>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          <Field label="Event" value={application.eventSlug} />
          {sponsor && (
            <>
              <Field label="Contact" value={sponsor.fullName} />
              <Field label="Website" value={sponsor.website ? <ExternalLink href={sponsor.website} /> : undefined} />
              <Field label="Sponsor type" value={sponsor.sponsorType} />
              <Field label="Section" value={sponsor.section} />
              <Field label="Budget" value={sponsor.budget} />
              <Field label="Interest" value={sponsor.interest} />
              <Field label="Objective" value={sponsor.objective} />
              <Field label="Notes" value={sponsor.notes} />
            </>
          )}
          {speaker && (
            <>
              <Field label="Role" value={[speaker.role, speaker.company].filter(Boolean).join(' at ')} />
              <Field
                label="LinkedIn"
                value={speaker.linkedinUrl ? <ExternalLink href={speaker.linkedinUrl} /> : undefined}
              />
              <Field label="Topic" value={speaker.topicTitle} />
              <Field label="Track" value={speaker.topicTrack} />
              <Field label="Format" value={speaker.speakingFormat} />
              <Field label="Bio" value={speaker.bio} />
              <Field label="Audience takeaway" value={speaker.audienceTakeaway} />
              <Field label="Prior talks" value={speaker.priorTalks} />
              <Field label="Availability" value={speaker.availability} />
            </>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-stone-100 pt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-600">Delete this application?</span>
              <button
                type="button"
                onClick={remove}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isPending}
                className="rounded-lg px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CollabApplicationStatus)}
              disabled={isPending}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm capitalize text-stone-800 outline-none focus:border-stone-400"
            >
              {COLLAB_APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={save}
              disabled={isPending || confirmDelete || status === application.status}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
            >
              {isPending && !confirmDelete && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
