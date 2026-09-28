'use client';

import Link from 'next/link';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import {
  createCommunityAction,
  deleteCommunityAction,
  updateCommunityAction,
} from '@/tickets-portal/actions/communities';
import type { AdminCommunity } from '@/tickets-portal/types/admin-communities';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import {
  FormModal,
  FormModalActions,
  ListToolbar,
  NETWORK_ERROR,
  dangerIconButtonClass,
  formFieldClass,
  formLabelClass,
  iconButtonClass,
  primaryButtonClass,
} from '@/tickets-portal/components/ui/FormModal';

type FormTarget = { mode: 'create' } | { mode: 'edit'; community: AdminCommunity };

function CommunityFormModal({
  target,
  onClose,
  onSaved,
}: {
  target: FormTarget;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const community = target.mode === 'edit' ? target.community : undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = community
          ? await updateCommunityAction(undefined, formData)
          : await createCommunityAction(undefined, formData);
        if (res?.error) {
          setError(res.error);
          return;
        }
        onSaved(community ? 'Community updated.' : 'Community added.');
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  };

  return (
    <FormModal
      title={community ? `Edit ${community.name}` : 'Add community'}
      description="After saving, open the community's promo codes to give them a code."
      error={error}
      isPending={isPending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        {community ? <input type="hidden" name="communityId" value={community._id} /> : null}
        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="com-name">
            Name
          </label>
          <input id="com-name" name="name" required defaultValue={community?.name} className={formFieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="com-region">
            Region (optional)
          </label>
          <input id="com-region" name="region" defaultValue={community?.region ?? ''} className={formFieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="com-description">
            Description (optional)
          </label>
          <textarea
            id="com-description"
            name="description"
            rows={2}
            defaultValue={community?.description ?? ''}
            className={formFieldClass}
          />
        </div>
        <FormModalActions
          isPending={isPending}
          onCancel={onClose}
          submitLabel={community ? 'Save changes' : 'Add community'}
        />
      </form>
    </FormModal>
  );
}

export function CommunitiesManager({ communities }: { communities: AdminCommunity[] }) {
  const router = useRouter();
  const toast = useToast();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCommunity | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleSaved = (message: string) => {
    setFormTarget(null);
    toast.success(message);
    router.refresh();
  };

  const handleDelete = (c: AdminCommunity) => {
    const fd = new FormData();
    fd.set('communityId', c._id);
    startDelete(async () => {
      const res = await deleteCommunityAction(undefined, fd).catch(() => ({ error: NETWORK_ERROR }));
      if (res?.error) {
        toast.error('Could not delete community', res.error);
        return;
      }
      setDeleteTarget(null);
      toast.success('Community deleted', `"${c.name}" was removed.`);
      router.refresh();
    });
  };

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
  const td = 'px-4 py-3 align-top text-sm text-stone-700';

  return (
    <div className="space-y-5">
      <ListToolbar
        summary={`${communities.length} ${communities.length === 1 ? 'community' : 'communities'}`}
        action={
          <button type="button" onClick={() => setFormTarget({ mode: 'create' })} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            Add community
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm">
        {communities.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <UsersRound className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            <p className="font-semibold text-stone-800">No communities yet</p>
            <p className="mt-1 text-xs text-stone-400">Add a community, then give it a promo code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="border-b border-stone-200/80 bg-stone-50/75">
                <tr>
                  <th className={th}>Name</th>
                  <th className={`${th} hidden sm:table-cell`}>Region</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {communities.map((c) => (
                  <tr key={c._id} className="transition-colors hover:bg-stone-50/50">
                    <td className={td}>
                      <p className="font-semibold text-stone-900">{c.name}</p>
                      {c.description ? <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{c.description}</p> : null}
                    </td>
                    <td className={`${td} hidden text-xs text-stone-600 sm:table-cell`}>{c.region || '—'}</td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/tickets-command/communities/${c._id}/promo-codes`}
                          className="mr-2 rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
                        >
                          Promo codes
                        </Link>
                        <button
                          type="button"
                          onClick={() => setFormTarget({ mode: 'edit', community: c })}
                          title="Edit community"
                          aria-label={`Edit ${c.name}`}
                          className={iconButtonClass}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete community"
                          aria-label={`Delete ${c.name}`}
                          className={dangerIconButtonClass}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formTarget && (
        <CommunityFormModal target={formTarget} onClose={() => setFormTarget(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          isLoading={isDeleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          variant="danger"
          title="Delete community"
          description={`Remove "${deleteTarget.name}" from the community list?`}
          implications={[
            'All of its promo codes are deactivated and stop working at checkout.',
            'Past sales stay recorded against its codes.',
          ]}
          confirmLabel="Delete community"
        />
      )}
    </div>
  );
}
