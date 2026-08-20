'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Globe,
  Tag,
  Sparkles,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import type { AdminBlogPost } from '@/tickets-portal/types/admin-blog';
import type { AdminSite } from '@/tickets-portal/types/admin-sites';
import { createBlogPostAction, updateBlogPostAction } from '@/tickets-portal/actions/blog';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';

interface BlogPostFormProps {
  initialPost?: AdminBlogPost | null;
  sites: AdminSite[];
  isEdit?: boolean;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const CATEGORIES = [
  'Announcements',
  'Ecosystem',
  'Hackathon',
  'DeFi',
  'Governance',
  'Keynotes',
  'Guides',
  'Community',
];

export function BlogPostForm({ initialPost, sites, isEdit = false }: BlogPostFormProps) {
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [siteSlug, setSiteSlug] = useState(initialPost?.siteSlug || sites[0]?.slug || 'lagos');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || '');
  const [category, setCategory] = useState(initialPost?.category || 'Announcements');
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') || '');
  const [authorName, setAuthorName] = useState(initialPost?.author?.name || 'LBW Editorial');
  const [authorRole, setAuthorRole] = useState(initialPost?.author?.role || 'Lead Editor');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    initialPost?.status || 'draft',
  );
  const [isFeatured, setIsFeatured] = useState(initialPost?.isFeatured || false);
  const [metaTitle, setMetaTitle] = useState(initialPost?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialPost?.seo?.metaDescription || '');

  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Image upload failed');
      const json = await res.json();
      const url = json.uploadResult?.secure_url || json.url;
      if (url) {
        setCoverImage(url);
        toast.success('Cover Image Uploaded', 'Image successfully uploaded to Cloudinary.');
      }
    } catch (err) {
      const msg = 'Failed to upload image. Please try again.';
      setError(msg);
      toast.error('Upload Failed', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleEditorUploadImg = async (
    files: Array<File>,
    callback: (urls: Array<string>) => void,
  ) => {
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const data = new FormData();
          data.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: data });
          const json = await res.json();
          return json.uploadResult?.secure_url || json.url || '';
        }),
      );
      callback(urls.filter(Boolean));
      toast.success('Images Uploaded', `${urls.filter(Boolean).length} image(s) inserted.`);
    } catch {
      toast.error('Upload Error', 'Inline markdown image upload failed.');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !excerpt || !content) {
      const msg = 'Title, excerpt, and content are required.';
      setError(msg);
      toast.warning('Missing Fields', msg);
      return;
    }

    const formData = new FormData();
    formData.append('siteSlug', siteSlug);
    formData.append('title', title);
    formData.append('slug', slug || slugify(title));
    formData.append('excerpt', excerpt);
    formData.append('content', content);
    formData.append('coverImage', coverImage);
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('authorName', authorName);
    formData.append('authorRole', authorRole);
    formData.append('status', status);
    formData.append('isFeatured', String(isFeatured));
    formData.append('metaTitle', metaTitle);
    formData.append('metaDescription', metaDescription);

    startTransition(async () => {
      const res = isEdit && initialPost
        ? await updateBlogPostAction(initialPost._id, undefined, formData)
        : await createBlogPostAction(undefined, formData);

      if (res?.error) {
        setError(res.error);
        toast.error(isEdit ? 'Failed to update article' : 'Failed to create article', res.error);
      } else {
        toast.success(
          isEdit ? 'Article Updated' : 'Article Created',
          `"${title}" has been saved.`,
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl pb-16">
      {/* Top Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/tickets-command/blogs"
            className="rounded-lg border border-stone-200 bg-white p-2 text-stone-500 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {isEdit ? 'Edit Article' : 'Write New Article'}
            </h1>
            <p className="text-xs text-stone-500">
              {isEdit ? `Editing ID: ${initialPost?._id}` : 'Draft or publish a story for your site.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Publish Immediately</option>
            <option value="archived">Archived</option>
          </select>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Update Article' : 'Publish Post'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200 font-medium">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor & Body */}
        <div className="lg:col-span-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Article Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Lagos Blockchain Week 2026: The Next Wave of Builders"
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-base font-semibold text-stone-900 placeholder-stone-400 focus:border-stone-800 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <label className="font-semibold text-stone-700">URL Slug * (Per-site unique)</label>
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-stone-500 hover:text-stone-800 underline text-[11px]"
                >
                  {autoSlug ? 'Lock Slug' : 'Auto-generate'}
                </button>
              )}
            </div>
            <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50/60 px-3 py-1.5 text-xs text-stone-500 font-mono">
              <span>/blog/</span>
              <input
                type="text"
                disabled={isEdit}
                value={slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="article-slug"
                className="flex-1 bg-transparent text-stone-800 font-mono focus:outline-none ml-1 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Short Excerpt / Teaser * (Appears on previews and cards)
            </label>
            <textarea
              required
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 2-3 sentence teaser..."
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:border-stone-800 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Article Content (Markdown) *
            </label>
            <div className="rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
              <MdEditor
                modelValue={content}
                onChange={setContent}
                onUploadImg={handleEditorUploadImg}
                language="en-US"
                previewTheme="github"
                className="min-h-[420px]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Metadata */}
        <div className="lg:col-span-4 space-y-5">
          {/* Target Site Selector */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-emerald-700" /> Target Regional Site *
            </label>
            <select
              disabled={isEdit}
              value={siteSlug}
              onChange={(e) => setSiteSlug(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-800 font-semibold focus:border-stone-800 focus:outline-none disabled:opacity-60"
            >
              {sites.length > 0 ? (
                sites.map((s) => (
                  <option key={s._id} value={s.slug}>
                    {s.name} ({s.slug})
                  </option>
                ))
              ) : (
                <>
                  <option value="lagos">Lagos (lagos)</option>
                  <option value="abuja">Abuja (abuja)</option>
                  <option value="nigeria">Nigeria (nigeria)</option>
                  <option value="ethng">ETH Nigeria (ethng)</option>
                </>
              )}
            </select>
            <p className="text-[11px] text-stone-400">
              Select which regional frontend displays this article.{' '}
              <Link href="/tickets-command/sites" className="underline hover:text-stone-700">
                Manage Sites
              </Link>
            </p>
          </div>

          {/* Cover Image Upload */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-stone-500" /> Cover Image
            </label>

            {coverImage ? (
              <div className="relative rounded-lg overflow-hidden border border-stone-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="Cover" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-lg p-5 cursor-pointer hover:border-stone-400 transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-stone-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-stone-400 mb-1" />
                    <span className="text-xs text-stone-600 font-medium">Click to upload image</span>
                    <span className="text-[10px] text-stone-400">PNG, JPG, WebP up to 10MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            )}

            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Or paste image URL"
              className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
            />
          </div>

          {/* Category & Tags */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-stone-800">Category &amp; Tags</label>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-stone-500 mb-1 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="DeFi, L2, Hackathon"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900"
                />
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Feature as Hero Story
                </span>
              </label>
            </div>
          </div>

          {/* Author Profile */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-stone-800">Author</label>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="LBW Editorial"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Author Role</label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Lead Editor"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>
          </div>

          {/* SEO Metadata */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-stone-800">SEO &amp; OpenGraph</label>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Custom Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Defaults to article title"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-stone-500 mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Defaults to excerpt"
                className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
