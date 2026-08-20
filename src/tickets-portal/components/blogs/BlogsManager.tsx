'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Eye,
  Filter,
} from 'lucide-react';
import type { AdminBlogPost, BlogPostStatus } from '@/tickets-portal/types/admin-blog';
import type { AdminSite } from '@/tickets-portal/types/admin-sites';
import { deleteBlogPostAction, toggleBlogPostStatusAction } from '@/tickets-portal/actions/blog';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';

interface BlogsManagerProps {
  initialPosts: AdminBlogPost[];
  sites: AdminSite[];
  total: number;
}

interface ConfirmState {
  type: 'toggle-status' | 'delete';
  post: AdminBlogPost;
}

export function BlogsManager({ initialPosts, sites, total }: BlogsManagerProps) {
  const toast = useToast();
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPosts = posts.filter((post) => {
    if (selectedSite !== 'all' && post.siteSlug !== selectedSite) return false;
    if (selectedStatus !== 'all' && post.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.slug.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExecuteStatusToggle = (post: AdminBlogPost) => {
    const nextStatus: BlogPostStatus = post.status === 'published' ? 'draft' : 'published';
    startTransition(async () => {
      const res = await toggleBlogPostStatusAction(post._id, post.status);
      if (res?.error) {
        toast.error('Failed to change article status', res.error);
      } else {
        setPosts((prev) =>
          prev.map((p) => (p._id === post._id ? { ...p, status: nextStatus } : p)),
        );
        if (nextStatus === 'published') {
          toast.success('Article Published', `"${post.title}" is now live on ${post.siteSlug}.`);
        } else {
          toast.info('Article Moved to Drafts', `"${post.title}" has been unpublished.`);
        }
        setConfirmState(null);
      }
    });
  };

  const handleExecuteDelete = (post: AdminBlogPost) => {
    startTransition(async () => {
      const res = await deleteBlogPostAction(post._id);
      if (res?.error) {
        toast.error('Failed to delete article', res.error);
      } else {
        setPosts((prev) => prev.filter((p) => p._id !== post._id));
        toast.success('Article Deleted', `"${post.title}" has been removed.`);
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
            <BookOpen className="h-3.5 w-3.5" />
            Content Module
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Blog Articles</h1>
          <p className="text-sm text-stone-500">
            Publish and manage stories scoped across websites.
          </p>
        </div>

        <Link
          href="/tickets-command/blogs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-stone-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Write New Article
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border border-stone-200/90 bg-white p-3 shadow-xs">
        {/* Site Filter */}
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Target Website
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
          >
            <option value="all">All Websites ({sites.length})</option>
            {sites.map((s) => (
              <option key={s._id} value={s.slug}>
                {s.name} ({s.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-stone-800 focus:border-stone-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>

        {/* Search */}
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or slug..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50/50 pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="rounded-xl border border-stone-200/90 bg-white shadow-sm overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <BookOpen className="h-10 w-10 text-stone-300 mx-auto mb-3" />
            <p className="font-semibold text-stone-800">No blog articles found</p>
            <p className="text-xs text-stone-400 mt-1">
              Create your first article or adjust your active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="border-b border-stone-200/80 bg-stone-50/75 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Site</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Views</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 truncate" title={post.title}>
                          {post.title}
                        </span>
                        {post.isFeatured && (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 font-mono truncate mt-0.5">
                        /{post.slug}
                      </p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 uppercase">
                        {post.siteSlug}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-600">
                      {post.category}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setConfirmState({ type: 'toggle-status', post })}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          post.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {post.status === 'published' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Published
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-stone-400" />
                        {post.viewCount}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                      <Link
                        href={`/tickets-command/blogs/${post._id}/edit`}
                        className="inline-block rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                        title="Edit article"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmState({ type: 'delete', post })}
                        disabled={isPending}
                        className="rounded p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete article"
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

      {/* Rich Confirmation Modal */}
      {confirmState && (
        <ConfirmDialog
          isOpen={!!confirmState}
          isLoading={isPending}
          onClose={() => setConfirmState(null)}
          onConfirm={() => {
            if (confirmState.type === 'toggle-status') {
              handleExecuteStatusToggle(confirmState.post);
            } else if (confirmState.type === 'delete') {
              handleExecuteDelete(confirmState.post);
            }
          }}
          variant={
            confirmState.type === 'delete'
              ? 'danger'
              : confirmState.post.status === 'draft'
              ? 'success'
              : 'warning'
          }
          title={
            confirmState.type === 'delete'
              ? 'Delete Article'
              : confirmState.post.status === 'draft'
              ? 'Publish Article Live'
              : 'Unpublish Article to Draft'
          }
          description={
            confirmState.type === 'delete'
              ? `Are you sure you want to delete "${confirmState.post.title}"?`
              : confirmState.post.status === 'draft'
              ? `Publish "${confirmState.post.title}" to the live ${confirmState.post.siteSlug.toUpperCase()} website?`
              : `Move "${confirmState.post.title}" back to draft status?`
          }
          implications={
            confirmState.type === 'delete'
              ? [
                  'The article will be soft-deleted and removed from the active database collection.',
                  'Public visitors and search engine crawlers will no longer be able to access this page.',
                  'This action can only be restored via database administration.',
                ]
              : confirmState.post.status === 'draft'
              ? [
                  `The post will become immediately visible to all visitors on the ${confirmState.post.siteSlug.toUpperCase()} frontend.`,
                  'Public metadata and OpenGraph social previews will be made accessible to crawlers.',
                  'The published timestamp will be set if this is the first publication.',
                ]
              : [
                  'The post will be immediately removed from the live website feed.',
                  'Direct visitors navigating to the URL will see a 404 Not Found error.',
                  'The article content is safely preserved for future editing and republication.',
                ]
          }
          confirmLabel={
            confirmState.type === 'delete'
              ? 'Delete Article'
              : confirmState.post.status === 'draft'
              ? 'Publish Now'
              : 'Unpublish to Draft'
          }
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
