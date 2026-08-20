import { notFound } from 'next/navigation';
import { fetchAdminBlogPostById } from '@/tickets-portal/actions/blog';
import { fetchAdminSites } from '@/tickets-portal/actions/sites';
import { BlogPostForm } from '@/tickets-portal/components/blogs/BlogPostForm';

export const dynamic = 'force-dynamic';

interface EditBlogPostPageProps {
  params: Promise<{ blogId: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { blogId } = await params;
  const [post, sites] = await Promise.all([
    fetchAdminBlogPostById(blogId),
    fetchAdminSites(),
  ]);

  if (!post) {
    notFound();
  }

  return <BlogPostForm initialPost={post} sites={sites} isEdit={true} />;
}
