'use client';

import Link from 'next/link';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createInfluencerAction,
  deleteInfluencerAction,
  updateInfluencerAction,
} from '@/tickets-portal/actions/influencers';
import type { AdminInfluencer } from '@/tickets-portal/types/admin-influencers';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';
import { EmptyState, TableCard, tableRow, tableTd as td, tableTh as th } from '@/tickets-portal/components/ui/TableCard';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import {
  FormModal,
  FormModalActions,
  ListToolbar,
  NETWORK_ERROR,
  dangerIconButtonClass,
  formFieldClass,
  formHintClass,
  formLabelClass,
  iconButtonClass,
  primaryButtonClass,
} from '@/tickets-portal/components/ui/FormModal';

type FormTarget = { mode: 'create' } | { mode: 'edit'; influencer: AdminInfluencer };

function InfluencerFormModal({
  target,
  onClose,
  onSaved,
}: {
  target: FormTarget;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const influencer = target.mode === 'edit' ? target.influencer : undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = influencer
          ? await updateInfluencerAction(undefined, formData)
          : await createInfluencerAction(undefined, formData);
        if (res?.error) {
          setError(res.error);
          return;
        }
        onSaved(influencer ? 'Influencer updated.' : 'Influencer added.');
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  };

  return (
    <FormModal
      title={influencer ? `Edit ${influencer.displayName}` : 'Add influencer'}
      description="After saving, open the influencer's promo codes to give them a code."
      error={error}
      isPending={isPending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {influencer ? <input type="hidden" name="influencerId" value={influencer._id} /> : null}
        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="inf-name">
            Display name
          </label>
          <input id="inf-name" name="displayName" required defaultValue={influencer?.displayName} className={formFieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="inf-email">
            Email
          </label>
          <input
            id="inf-email"
            name="email"
            type="email"
            required
            defaultValue={influencer?.email ?? ''}
            className={formFieldClass}
          />
          <p className={formHintClass}>
            Used to sign in to the influencer portal and to match influencer applications. Must be unique.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="inf-notes">
            Internal notes (optional)
          </label>
          <textarea id="inf-notes" name="notes" rows={2} defaultValue={influencer?.notes ?? ''} className={formFieldClass} />
        </div>
        <FormModalActions
          isPending={isPending}
          onCancel={onClose}
          submitLabel={influencer ? 'Save changes' : 'Add influencer'}
        />
      </form>
    </FormModal>
  );
}

export function InfluencersManager({ influencers }: { influencers: AdminInfluencer[] }) {
  const router = useRouter();
  const toast = useToast();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminInfluencer | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleSaved = (message: string) => {
    setFormTarget(null);
    toast.success(message);
    router.refresh();
  };

  const handleDelete = (inf: AdminInfluencer) => {
    const fd = new FormData();
    fd.set('influencerId', inf._id);
    startDelete(async () => {
      const res = await deleteInfluencerAction(undefined, fd).catch(() => ({ error: NETWORK_ERROR }));
      if (res?.error) {
        toast.error('Could not delete influencer', res.error);
        return;
      }
      setDeleteTarget(null);
      toast.success('Influencer deleted', `"${inf.displayName}" was removed.`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <ListToolbar
        summary={`${influencers.length} ${influencers.length === 1 ? 'influencer' : 'influencers'}`}
        action={
          <button type="button" onClick={() => setFormTarget({ mode: 'create' })} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            Add influencer
          </button>
        }
      />

      <TableCard
        isEmpty={influencers.length === 0}
        empty={
          <EmptyState
            icon={Megaphone}
            title="No influencers yet"
            hint="Add one here, or accept an influencer application under Applications."
          />
        }
        minWidth="min-w-[560px]"
        head={
          <>
            <th className={th}>Name</th>
            <th className={`${th} hidden sm:table-cell`}>Email</th>
            <th className={th}>Promo codes</th>
            <th className={`${th} text-right`}>Actions</th>
          </>
        }
      >
        {influencers.map((inf) => (
          <tr key={inf._id} className={tableRow}>
            <td className={`${td} font-semibold text-stone-900`}>{inf.displayName}</td>
            <td className={`${td} hidden text-xs text-stone-600 sm:table-cell`}>{inf.email ?? '—'}</td>
            <td className={`${td} whitespace-nowrap text-xs text-stone-600`}>
              {inf.codeCount ?? 0} {(inf.codeCount ?? 0) === 1 ? 'code' : 'codes'}
              {(inf.codeCount ?? 0) > 0 ? (
                <span className="text-stone-400"> · {inf.activeCodeCount ?? 0} active</span>
              ) : null}
            </td>
            <td className={`${td} whitespace-nowrap text-right`}>
              <div className="inline-flex items-center gap-1">
                <Link
                  href={`/tickets-command/influencers/${inf._id}/promo-codes`}
                  className="mr-2 rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Promo codes
                </Link>
                <button
                  type="button"
                  onClick={() => setFormTarget({ mode: 'edit', influencer: inf })}
                  title="Edit influencer"
                  aria-label={`Edit ${inf.displayName}`}
                  className={iconButtonClass}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(inf)}
                  title="Delete influencer"
                  aria-label={`Delete ${inf.displayName}`}
                  className={dangerIconButtonClass}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {formTarget && (
        <InfluencerFormModal target={formTarget} onClose={() => setFormTarget(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          isLoading={isDeleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          variant="danger"
          title="Delete influencer"
          description={`Remove "${deleteTarget.displayName}" from the influencer list?`}
          implications={[
            'All of their promo codes are deactivated and stop working at checkout.',
            'Past sales stay recorded against their codes.',
          ]}
          confirmLabel="Delete influencer"
        />
      )}
    </div>
  );
}
