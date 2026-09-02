'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, X } from 'lucide-react';
import clsx from 'clsx';
import {
  updateInfluencerApplicationStatusAction,
  updateVolunteerApplicationStatusAction,
} from '@/tickets-portal/actions/applications';
import type {
  ApplicationStatus,
  InfluencerApplication,
  VolunteerApplication,
} from '@/tickets-portal/types/admin-applications';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';

const STATUSES: ApplicationStatus[] = ['pending', 'reviewing', 'accepted', 'rejected', 'withdrawn'];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  reviewing: 'border-blue-200 bg-blue-50 text-blue-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  withdrawn: 'border-stone-200 bg-stone-100 text-stone-600',
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status],
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

type AnyApplication = VolunteerApplication | InfluencerApplication;

type Props =
  | { kind: 'volunteer'; items: VolunteerApplication[] }
  | { kind: 'influencer'; items: InfluencerApplication[] };

export function ApplicationsManager(props: Props) {
  const { kind } = props;
  const items: AnyApplication[] = props.items;
  const router = useRouter();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [selected, setSelected] = useState<AnyApplication | null>(null);

  const filtered = useMemo(
    () => (statusFilter === 'all' ? items : items.filter((it) => it.status === statusFilter)),
    [items, statusFilter],
  );

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
  const td = 'px-4 py-3 align-top text-sm text-stone-700';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {filtered.length} of {items.length} {items.length === 1 ? 'application' : 'applications'}
        </p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ApplicationStatus)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm capitalize text-stone-800 outline-none focus:border-stone-400"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-stone-500">
            {items.length === 0 ? 'No applications yet.' : 'No applications match this filter.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-stone-200/80 bg-stone-50/75">
                <tr>
                  <th className={th}>Applicant</th>
                  <th className={th}>{kind === 'volunteer' ? 'Tracks' : 'Message'}</th>
                  <th className={th}>Submitted</th>
                  <th className={th}>Status</th>
                  <th className={clsx(th, 'w-8')} />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item) => (
                  <tr
                    key={item._id}
                    onClick={() => setSelected(item)}
                    className="cursor-pointer transition-colors hover:bg-stone-50/70"
                  >
                    <td className={td}>
                      <p className="font-medium text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-500">{item.email}</p>
                    </td>
                    <td className={clsx(td, 'max-w-xs')}>
                      <p className="line-clamp-1 text-stone-600">
                        {props.kind === 'volunteer'
                          ? (item as VolunteerApplication).selectedTracks.join(', ') || '—'
                          : (item as InfluencerApplication).message || '—'}
                      </p>
                    </td>
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
        <ApplicationDetailModal
          kind={kind}
          application={selected}
          onClose={() => setSelected(null)}
          onSaved={(status) => {
            setSelected(null);
            toast.success('Status updated', `${selected.name} is now "${status}".`);
            router.refresh();
          }}
          onError={(message) => toast.error('Could not update status', message)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className="text-stone-700">{children}</dd>
    </div>
  );
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return <>—</>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
          {v}
        </span>
      ))}
    </div>
  );
}

function ApplicationDetailModal({
  kind,
  application,
  onClose,
  onSaved,
  onError,
}: {
  kind: 'volunteer' | 'influencer';
  application: AnyApplication;
  onClose: () => void;
  onSaved: (status: ApplicationStatus) => void;
  onError: (message: string) => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const formData = new FormData();
    formData.set('id', application._id);
    formData.set('status', status);
    startTransition(async () => {
      const action =
        kind === 'volunteer'
          ? updateVolunteerApplicationStatusAction
          : updateInfluencerApplicationStatusAction;
      const res = await action(undefined, formData);
      if (res?.error) {
        onError(res.error);
        return;
      }
      onSaved(status);
    });
  };

  const volunteer = kind === 'volunteer' ? (application as VolunteerApplication) : null;
  const influencer = kind === 'influencer' ? (application as InfluencerApplication) : null;

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

        <h2 className="text-lg font-bold tracking-tight text-stone-900">{application.name}</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-stone-500">
          <span>{application.email}</span>
          {application.whatsapp ? <span>WhatsApp: {application.whatsapp}</span> : null}
          <span>Submitted {formatDate(application.createdAt)}</span>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          {volunteer && (
            <>
              <Field label="Tracks">
                <Chips values={volunteer.selectedTracks} />
              </Field>
              <Field label="Cover letter">
                <p className="whitespace-pre-wrap leading-relaxed text-stone-700">
                  {volunteer.coverLetter || '—'}
                </p>
              </Field>
            </>
          )}
          {influencer && (
            <>
              <Field label="Message">
                <p className="whitespace-pre-wrap leading-relaxed text-stone-700">
                  {influencer.message || '—'}
                </p>
              </Field>
              {influencer.influencerId ? (
                <Field label="Linked influencer">
                  <span className="font-mono text-xs text-stone-600">{influencer.influencerId}</span>
                </Field>
              ) : null}
            </>
          )}
          <Field label="Social handles">
            <Chips values={application.socialMediaHandles} />
          </Field>
        </dl>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm capitalize text-stone-800 outline-none focus:border-stone-400"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={save}
            disabled={isPending || status === application.status}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save status
          </button>
        </div>
      </div>
    </div>
  );
}
