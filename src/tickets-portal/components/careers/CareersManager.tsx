'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, Pencil, Archive, Loader2, ExternalLink, Star } from 'lucide-react';
import { createCareerAction, deleteCareerAction, updateCareerAction } from '@/tickets-portal/actions/careers';
import type { AdminCareer } from '@/tickets-portal/types/admin-careers';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';
import { EmptyState, TableCard, tableRow, tableTd as td, tableTh as th } from '@/tickets-portal/components/ui/TableCard';
import { ModalShell } from '@/tickets-portal/components/ui/ModalShell';

const categories = ['Engineering', 'Product', 'Design', 'Business Development', 'Community', 'Marketing', 'Legal/Compliance', 'Operations', 'Other'];
const locations = ['Lagos', 'Remote', 'Hybrid', 'Other'];
const workTypes = ['Full-time', 'Contract', 'Internship', 'Part-time'];

const fieldClass =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1 block text-xs font-semibold text-stone-700';

type FormTarget = { mode: 'create' } | { mode: 'edit'; career: AdminCareer };

function CareerFormModal({
  target,
  onClose,
  onSaved,
}: {
  target: FormTarget;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const career = target.mode === 'edit' ? target.career : undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = career
        ? await updateCareerAction(undefined, formData)
        : await createCareerAction(undefined, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onSaved(career ? 'Opportunity updated.' : 'Opportunity added.');
    });
  };

  return (
    <ModalShell onClose={onClose} label={career ? 'Edit opportunity' : 'Add opportunity'} isBusy={isPending} size="2xl">
      <h2 className="text-lg font-bold tracking-tight text-stone-900">
        {career ? 'Edit opportunity' : 'Add opportunity'}
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        These roles power the API-backed public careers page.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        {career ? <input type="hidden" name="careerId" value={career._id} /> : null}

        <div>
          <label className={labelClass} htmlFor="career-partnerName">Partner / company name</label>
          <input id="career-partnerName" name="partnerName" required defaultValue={career?.partnerName} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="career-title">Role title</label>
          <input id="career-title" name="title" required defaultValue={career?.title} className={fieldClass} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="career-partnerLogo">Partner logo URL (optional)</label>
          <input id="career-partnerLogo" name="partnerLogo" type="url" defaultValue={career?.partnerLogo} className={fieldClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="career-location">Location</label>
          <select id="career-location" name="location" defaultValue={career?.location ?? 'Remote'} className={fieldClass}>
            {locations.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="career-workType">Work type</label>
          <select id="career-workType" name="workType" defaultValue={career?.workType ?? 'Full-time'} className={fieldClass}>
            {workTypes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="career-category">Category</label>
          <select id="career-category" name="category" defaultValue={career?.category ?? 'Other'} className={fieldClass}>
            {categories.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="career-applyUrl">Application URL</label>
          <input id="career-applyUrl" name="applyUrl" type="url" required defaultValue={career?.applyUrl} className={fieldClass} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="career-description">Description</label>
          <textarea id="career-description" name="description" required defaultValue={career?.description} className={`${fieldClass} min-h-28`} />
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="featured" defaultChecked={career?.featured} className="h-4 w-4 rounded border-stone-300" />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="isActive" defaultChecked={career?.isActive ?? true} className="h-4 w-4 rounded border-stone-300" />
          Published
        </label>

        <div className="flex items-center justify-end gap-2.5 border-t border-stone-100 pt-4 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {career ? 'Save changes' : 'Add opportunity'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export function CareersManager({ careers }: { careers: AdminCareer[] }) {
  const router = useRouter();
  const toast = useToast();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminCareer | null>(null);
  const [isArchiving, startArchive] = useTransition();

  const handleSaved = (message: string) => {
    setFormTarget(null);
    toast.success(message);
    router.refresh();
  };

  const handleArchive = (career: AdminCareer) => {
    const formData = new FormData();
    formData.set('careerId', career._id);
    startArchive(async () => {
      const res = await deleteCareerAction(undefined, formData);
      if (res?.error) {
        toast.error('Could not archive opportunity', res.error);
        return;
      }
      setArchiveTarget(null);
      toast.success('Opportunity archived', `"${career.title}" is no longer listed.`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {careers.length} {careers.length === 1 ? 'opportunity' : 'opportunities'}
        </p>
        <button
          type="button"
          onClick={() => setFormTarget({ mode: 'create' })}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          Add opportunity
        </button>
      </div>

      <TableCard
        isEmpty={careers.length === 0}
        empty={
          <EmptyState
            icon={Briefcase}
            title="No career opportunities yet"
            hint="Add the first opportunity to show it on the public careers page."
          />
        }
        minWidth="min-w-[760px]"
        head={
          <>
            <th className={th}>Role</th>
            <th className={th}>Category</th>
            <th className={th}>Location</th>
            <th className={th}>Type</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Actions</th>
          </>
        }
      >
        {careers.map((career) => (
          <tr key={career._id} className={tableRow}>
            <td className={`${td} max-w-sm`}>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-900" title={career.title}>{career.title}</span>
                {career.featured && (
                  <span title="Featured">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{career.partnerName}</p>
            </td>
            <td className={`${td} whitespace-nowrap text-xs text-stone-600`}>{career.category}</td>
            <td className={`${td} whitespace-nowrap text-xs text-stone-600`}>{career.location}</td>
            <td className={`${td} whitespace-nowrap text-xs text-stone-600`}>{career.workType}</td>
            <td className={`${td} whitespace-nowrap`}>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  career.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-stone-200 bg-stone-100 text-stone-600'
                }`}
              >
                {career.isActive ? 'Published' : 'Draft'}
              </span>
            </td>
            <td className={`${td} whitespace-nowrap text-right`}>
              <div className="inline-flex items-center gap-1">
                <a
                  href={career.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open application link"
                  className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setFormTarget({ mode: 'edit', career })}
                  title="Edit opportunity"
                  className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveTarget(career)}
                  title="Archive opportunity"
                  className="rounded p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {formTarget && (
        <CareerFormModal
          target={formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {archiveTarget && (
        <ConfirmDialog
          isOpen={!!archiveTarget}
          isLoading={isArchiving}
          onClose={() => setArchiveTarget(null)}
          onConfirm={() => handleArchive(archiveTarget)}
          variant="danger"
          title="Archive opportunity"
          description={`Remove "${archiveTarget.title}" (${archiveTarget.partnerName}) from the careers list?`}
          implications={[
            'The opportunity will be removed from the public careers page.',
            'The record is deleted via the admin API and cannot be restored from this dashboard.',
          ]}
          confirmLabel="Archive opportunity"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
