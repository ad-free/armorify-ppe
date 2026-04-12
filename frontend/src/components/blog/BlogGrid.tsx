// src/components/blog/BlogGrid.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { BlogCard } from './BlogCard';
import type { BlogPostRead } from '@/types/api';

interface Props {
  posts: BlogPostRead[];
  loading?: boolean;
}

export const BlogGrid: React.FC<Props> = ({ posts, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden animate-pulse bg-white">
            <div className="aspect-[16/9] bg-gray-200"></div>
            <div className="p-5">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v10a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có bài viết nào</h3>
        <p className="text-muted-foreground">Hiện tại chưa có bài viết nào trong mục này.</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={itemVariants}>
          <BlogCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};
