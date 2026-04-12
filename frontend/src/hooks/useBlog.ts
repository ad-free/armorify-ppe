// src/hooks/useBlog.ts
import { useQuery } from '@tanstack/react-query';
import { listBlogPosts, getBlogPost } from '@/api/blog';

export const useBlogPosts = (skip = 0, limit = 12) =>
  useQuery({ 
    queryKey: ['blog', 'list', skip, limit],
    queryFn: () => listBlogPosts({ skip, limit }), 
    staleTime: 5 * 60_000 
  });

export const useBlogPost = (slug: string) =>
  useQuery({ 
    queryKey: ['blog', 'post', slug],
    queryFn: () => getBlogPost(slug), 
    staleTime: 5 * 60_000 
  });
