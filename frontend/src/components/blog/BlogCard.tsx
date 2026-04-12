// src/components/blog/BlogCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { BlogPostRead } from '@/types/api';

interface Props {
  post: BlogPostRead;
}

export const BlogCard: React.FC<Props> = ({ post }) => {
  const publishedDate = post.published_at || post.created_at;
  const formattedDate = new Date(publishedDate).toLocaleDateString('vi-VN');

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg overflow-hidden border shadow-sm flex flex-col h-full"
    >
      <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/9] bg-gray-100 overflow-hidden">
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        )}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-semibold rounded shadow-sm">
          {formattedDate}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <Link to={`/blog/${post.slug}`}>
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>
        
        {post.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
          <Link to={`/blog/${post.slug}`} className="text-primary text-sm font-medium hover:underline underline-offset-2">
            Đọc thêm &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
