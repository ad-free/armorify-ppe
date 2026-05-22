// src/components/blog/BlogCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { BlogPostRead } from '@/types/api';
import { getMediaUrl } from '@/lib/api';

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
      <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/9] bg-slate-900 overflow-hidden group/image">
        {post.cover_image_url ? (
          <img
            src={getMediaUrl(post.cover_image_url)}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-teal-950 to-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-lg group-hover/image:scale-110 transition-transform duration-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">NBE Hoang Duy</span>
            <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase max-w-[85%] truncate">{post.title}</span>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold rounded-lg shadow-sm text-slate-800">
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
