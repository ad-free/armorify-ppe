// src/pages/public/BlogDetail.tsx
import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlog';
import { BlogCard } from '@/components/blog/BlogCard';

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug || '');
  const { data: recentPosts } = useBlogPosts(0, 4);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 animate-pulse max-w-4xl">
        <div className="h-8 bg-gray-200 w-3/4 mb-4 rounded"></div>
        <div className="h-4 bg-gray-200 w-1/4 mb-8 rounded"></div>
        <div className="aspect-[21/9] bg-gray-200 rounded-lg mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 w-full rounded"></div>
          <div className="h-4 bg-gray-200 w-full rounded"></div>
          <div className="h-4 bg-gray-200 w-5/6 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return <Navigate to="/blog" replace />;
  }

  const publishedDate = post.published_at || post.created_at;
  const formattedDate = new Date(publishedDate).toLocaleDateString('vi-VN');

  // get related posts (excluding current)
  const relatedPosts = recentPosts?.items.filter(p => p.id !== post.id).slice(0, 3) || [];

  const breadcrumbName = post.title.length > 40 ? post.title.substring(0, 40) + '...' : post.title;

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <SeoHead
        title={post.seo_title ?? post.title}
        description={post.seo_description ?? (post.excerpt || '')}
        ogImage={post.cover_image_url || undefined}
        canonical={`/blog/${slug}`}
      />

      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Tin tức', href: '/blog' },
          { label: breadcrumbName }
        ]}
      />

      <div className="max-w-4xl mx-auto mt-6">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">{post.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8 text-sm">
          <span className="font-medium text-foreground">{post.author_id ? 'Quản trị viên' : 'NBE Hoang Duy'}</span>
          <span>&bull;</span>
          <span>{formattedDate}</span>
        </div>

        {post.cover_image_url && (
          <div className="mb-10 rounded-xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
            <img 
              src={post.cover_image_url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {post.excerpt && (
          <div className="text-xl text-gray-600 mb-8 font-medium leading-relaxed border-l-4 border-primary pl-4">
            {post.excerpt}
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none prose-img:rounded-lg mb-16 prose-a:text-primary hover:prose-a:text-primary/80 prose-headings:text-gray-900"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}
        />
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 border-t pt-10">
            <h2 className="text-2xl font-bold mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rp => (
                <BlogCard key={rp.id} post={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default BlogDetail;
