// src/api/blog.ts
import { GET } from '@/lib/api';
import type { BlogPostRead, PaginatedResponse } from '@/types/api';

export const listBlogPosts = (params: { skip?: number; limit?: number }) =>
  GET<PaginatedResponse<BlogPostRead>>('/api/v1/blog/posts', { params });

export const getBlogPost = (slug: string) =>
  GET<BlogPostRead>(`/api/v1/blog/posts/${slug}`);
