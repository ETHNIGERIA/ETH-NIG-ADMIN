'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  ticketsApiDelete,
  ticketsApiGet,
  ticketsApiPatch,
  ticketsApiPost,
} from '@/tickets-portal/lib/tickets-api.server';
import type {
  AdminBlogPost,
  AdminBlogListResponse,
  BlogPostStatus,
} from '@/tickets-portal/types/admin-blog';

export type ActionState = { error?: string; success?: boolean } | undefined;

export async function fetchAdminBlogPosts(params: {
  site?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminBlogListResponse> {
  const query = new URLSearchParams();
  if (params.site && params.site !== 'all') query.set('site', params.site);
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  try {
    const qs = query.toString();
    return await ticketsApiGet<AdminBlogListResponse>(`/admin/blog${qs ? `?${qs}` : ''}`);
  } catch (err) {
    console.error('[fetchAdminBlogPosts error]', err);
    return { data: [], total: 0, page: 1, limit: 20, pages: 1 };
  }
}

export async function fetchAdminBlogPostById(id: string): Promise<AdminBlogPost | null> {
  try {
    return await ticketsApiGet<AdminBlogPost>(`/admin/blog/${id}`);
  } catch (err) {
    console.error('[fetchAdminBlogPostById error]', err);
    return null;
  }
}

export async function createBlogPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const siteSlug = String(formData.get('siteSlug') ?? '').trim().toLowerCase();
  const title = String(formData.get('title') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const excerpt = String(formData.get('excerpt') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const coverImage = String(formData.get('coverImage') ?? '').trim();
  const category = String(formData.get('category') ?? 'General').trim();
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const authorName = String(formData.get('authorName') ?? 'Admin').trim();
  const authorRole = String(formData.get('authorRole') ?? 'Editorial Team').trim();
  const status = (String(formData.get('status') ?? 'draft') as BlogPostStatus);
  const isFeatured = formData.get('isFeatured') === 'true';
  const metaTitle = String(formData.get('metaTitle') ?? '').trim();
  const metaDescription = String(formData.get('metaDescription') ?? '').trim();

  if (!siteSlug || !title || !excerpt || !content) {
    return { error: 'Target Site, Title, Excerpt, and Content are required.' };
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  try {
    await ticketsApiPost<AdminBlogPost>('/admin/blog', {
      siteSlug,
      title,
      ...(slug ? { slug } : {}),
      excerpt,
      content,
      coverImage,
      category,
      tags,
      author: {
        name: authorName,
        role: authorRole,
      },
      status,
      isFeatured,
      seo: {
        metaTitle,
        metaDescription,
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not create blog post.' };
  }

  revalidatePath('/tickets-command/blogs');
  redirect('/tickets-command/blogs');
}

export async function updateBlogPostAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get('title') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const excerpt = String(formData.get('excerpt') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const coverImage = String(formData.get('coverImage') ?? '').trim();
  const category = String(formData.get('category') ?? 'General').trim();
  const tagsRaw = String(formData.get('tags') ?? '').trim();
  const authorName = String(formData.get('authorName') ?? 'Admin').trim();
  const authorRole = String(formData.get('authorRole') ?? 'Editorial Team').trim();
  const status = (String(formData.get('status') ?? 'draft') as BlogPostStatus);
  const isFeatured = formData.get('isFeatured') === 'true';
  const metaTitle = String(formData.get('metaTitle') ?? '').trim();
  const metaDescription = String(formData.get('metaDescription') ?? '').trim();

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  try {
    await ticketsApiPatch<AdminBlogPost>(`/admin/blog/${id}`, {
      ...(title ? { title } : {}),
      ...(slug ? { slug } : {}),
      ...(excerpt ? { excerpt } : {}),
      ...(content ? { content } : {}),
      coverImage,
      category,
      tags,
      author: {
        name: authorName,
        role: authorRole,
      },
      status,
      isFeatured,
      seo: {
        metaTitle,
        metaDescription,
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not update blog post.' };
  }

  revalidatePath('/tickets-command/blogs');
  redirect('/tickets-command/blogs');
}

export async function toggleBlogPostStatusAction(
  id: string,
  currentStatus: BlogPostStatus,
): Promise<ActionState> {
  const nextStatus: BlogPostStatus = currentStatus === 'published' ? 'draft' : 'published';
  try {
    await ticketsApiPatch<AdminBlogPost>(`/admin/blog/${id}`, { status: nextStatus });
    revalidatePath('/tickets-command/blogs');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not toggle status.' };
  }
}

export async function deleteBlogPostAction(id: string): Promise<ActionState> {
  try {
    await ticketsApiDelete(`/admin/blog/${id}`);
    revalidatePath('/tickets-command/blogs');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Could not delete blog post.' };
  }
}
