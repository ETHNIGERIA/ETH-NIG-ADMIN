import { fetchAdminSites } from '@/tickets-portal/actions/sites';
import { BlogPostForm } from '@/tickets-portal/components/blogs/BlogPostForm';

export const dynamic = 'force-dynamic';

export default async function NewBlogPostPage() {
  const sites = await fetchAdminSites();

  return <BlogPostForm sites={sites} isEdit={false} />;
}
