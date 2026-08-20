export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPostAuthor {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export interface BlogPostSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

export interface AdminBlogPost {
  _id: string;
  siteSlug: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: BlogPostAuthor;
  status: BlogPostStatus;
  isFeatured: boolean;
  readingTimeMinutes: number;
  viewCount: number;
  publishedAt: string | null;
  seo?: BlogPostSeo;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogListResponse {
  data: AdminBlogPost[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
