import { fetchAdminBlogPosts } from '@/tickets-portal/actions/blog';
import { fetchAdminSites } from '@/tickets-portal/actions/sites';
import { BlogsManager } from '@/tickets-portal/components/blogs/BlogsManager';

export const dynamic = 'force-dynamic';

export default async function AdminBlogsPage() {
  const [blogRes, sites] = await Promise.all([
    fetchAdminBlogPosts(),
    fetchAdminSites(),
  ]);

  return (
    <BlogsManager
      initialPosts={blogRes.data || []}
      sites={sites}
      total={blogRes.total || 0}
    />
  );
}
