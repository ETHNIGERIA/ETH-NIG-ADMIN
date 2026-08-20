'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Plus, Trash2, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import type { AdminSite } from '@/tickets-portal/types/admin-sites';
import { createSiteAction, deleteSiteAction, updateSiteAction } from '@/tickets-portal/actions/sites';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';

interface SitesManagerProps {
  initialSites: AdminSite[];
}

interface ConfirmSiteState {
  type: 'toggle-active' | 'delete';
  site: AdminSite;
}

export function SitesManager({ initialSites }: SitesManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const [sites, setSites] = useState<AdminSite[]>(initialSites);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmSiteState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const siteName = String(formData.get('name') || 'Site');

    startTransition(async () => {
      const res = await createSiteAction(undefined, formData);
      if (res?.error) {
        setError(res.error);
        toast.error('Failed to register website', res.error);
      } else {
        setShowCreateModal(false);
        toast.success('Website Registered', `"${siteName}" is now registered.`);
        router.refresh();
      }
    });
  };

  const handleExecuteDelete = async (site: AdminSite) => {
    startTransition(async () => {
      const res = await deleteSiteAction(site._id);
      if (res?.error) {
        toast.error('Failed to delete website', res.error);
      } else {
        setSites((prev) => prev.filter((s) => s._id !== site._id));
        toast.success('Website Deleted', `"${site.name}" has been removed.`);
        setConfirmState(null);
      }
    });
  };

  const handleExecuteToggleActive = async (site: AdminSite) => {
    const nextActive = !site.isActive;
    const formData = new FormData();
    formData.append('name', site.name);
    formData.append('domain', site.domain || '');
    formData.append('description', site.description || '');
    formData.append('isActive', String(nextActive));

    startTransition(async () => {
      const res = await updateSiteAction(site._id, undefined, formData);
      if (res?.error) {
        toast.error('Failed to update website status', res.error);
      } else {
        setSites((prev) =>
          prev.map((s) => (s._id === site._id ? { ...s, isActive: nextActive } : s)),
        );
        if (nextActive) {
          toast.success('Website Activated', `"${site.name}" is now active.`);
        } else {
          toast.warning('Website Deactivated', `"${site.name}" is now inactive.`);
        }
        setConfirmState(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <Globe className="h-3.5 w-3.5" />
            Content Module
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Web Sites</h1>
          <p className="text-sm text-stone-500">
            Manage registered websites and domain bindings for multi-site scoped blogs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Website
        </button>
      </div>

      {/* Sites List */}
      <div className="rounded-xl border border-stone-200/90 bg-white shadow-sm overflow-hidden">
        {sites.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <Globe className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <p className="font-semibold text-stone-800">No websites registered yet</p>
            <p className="text-xs text-stone-400 mt-1">
              Add your first website (e.g. Lagos, Abuja, ETH Nigeria) to start publishing scoped blogs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="border-b border-stone-200/80 bg-stone-50/75 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-3.5">Site Name</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Domain</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sites.map((site) => (
                  <tr key={site._id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      {site.name}
                      {site.description && (
                        <p className="text-xs font-normal text-stone-500 truncate max-w-xs">
                          {site.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <span className="rounded bg-stone-100 px-2 py-1 text-stone-800 font-semibold">
                        {site.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-600">
                      {site.domain ? (
                        <span className="inline-flex items-center gap-1 font-mono">
                          {site.domain}
                          <ExternalLink className="h-3 w-3 text-stone-400" />
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setConfirmState({ type: 'toggle-active', site })}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          site.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {site.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setConfirmState({ type: 'delete', site })}
                        disabled={isPending}
                        className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete site"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Site Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-stone-900">Register New Website</h2>
            <p className="text-xs text-stone-500 mt-1">
              Add a new website for content scoping and slug isolation.
            </p>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Website Display Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Lagos Blockchain Week"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Website Slug * (Immutable once created)
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="e.g. lagos"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-mono focus:border-stone-800 focus:outline-none"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Lowercase alphanumeric characters with hyphens only.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Domain *
                </label>
                <input
                  type="text"
                  name="domain"
                  required
                  placeholder="lagosblockchainweek.ng"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Flagship blockchain conference and hackathon in Lagos."
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-stone-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rich Confirmation Modal */}
      {confirmState && (
        <ConfirmDialog
          isOpen={!!confirmState}
          isLoading={isPending}
          onClose={() => setConfirmState(null)}
          onConfirm={() => {
            if (confirmState.type === 'toggle-active') {
              handleExecuteToggleActive(confirmState.site);
            } else if (confirmState.type === 'delete') {
              handleExecuteDelete(confirmState.site);
            }
          }}
          variant={
            confirmState.type === 'delete'
              ? 'danger'
              : confirmState.site.isActive
              ? 'warning'
              : 'success'
          }
          title={
            confirmState.type === 'delete'
              ? 'Delete Website'
              : confirmState.site.isActive
              ? 'Deactivate Website'
              : 'Activate Website'
          }
          description={
            confirmState.type === 'delete'
              ? `Are you sure you want to delete website "${confirmState.site.name}" (${confirmState.site.slug})?`
              : confirmState.site.isActive
              ? `Deactivate website "${confirmState.site.name}" (${confirmState.site.domain})?`
              : `Activate website "${confirmState.site.name}" (${confirmState.site.domain})?`
          }
          implications={
            confirmState.type === 'delete'
              ? [
                  'The website entry will be soft-deleted in the backend.',
                  `Articles associated with site slug "${confirmState.site.slug}" will no longer have an active parent binding.`,
                  `Domain resolution for "${confirmState.site.domain}" will cease returning active site data.`,
                ]
              : confirmState.site.isActive
              ? [
                  'The website status will be set to inactive.',
                  'Public API endpoints scoped to this website slug may reject incoming traffic or return an inactive state.',
                  'You can reactivate this website at any time from this dashboard.',
                ]
              : [
                  'The website status will be set to active.',
                  'Public frontend requests and article queries will resume immediate operation.',
                ]
          }
          confirmLabel={
            confirmState.type === 'delete'
              ? 'Delete Website'
              : confirmState.site.isActive
              ? 'Deactivate Website'
              : 'Activate Website'
          }
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
