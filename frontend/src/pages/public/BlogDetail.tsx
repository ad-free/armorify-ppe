// src/pages/public/BlogDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useBlogPost, useBlogPosts } from '@/hooks/useBlog';
import { BlogCard } from '@/components/blog/BlogCard';
import { getMediaUrl } from '@/lib/api';
import { Calendar, Clock, ArrowLeft, Share2, MessageSquare, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug || '');
  const { data: recentPosts } = useBlogPosts(0, 4);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-28 animate-pulse max-w-4xl space-y-8">
        <div className="h-4 bg-slate-200 w-24 rounded-full"></div>
        <div className="h-10 bg-slate-200 w-3/4 rounded-2xl"></div>
        <div className="flex gap-4">
          <div className="h-4 bg-slate-200 w-32 rounded"></div>
          <div className="h-4 bg-slate-200 w-24 rounded"></div>
        </div>
        <div className="aspect-[21/9] bg-slate-200 rounded-[2.5rem] w-full"></div>
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 w-full rounded"></div>
          <div className="h-4 bg-slate-200 w-full rounded"></div>
          <div className="h-4 bg-slate-200 w-5/6 rounded flex-1"></div>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return <Navigate to="/blog" replace />;
  }

  const publishedDate = post.published_at || post.created_at;
  const formattedDate = new Date(publishedDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Get related posts (excluding current)
  const relatedPosts = recentPosts?.items.filter(p => p.id !== post.id).slice(0, 3) || [];
  const breadcrumbName = post.title.length > 30 ? post.title.substring(0, 30) + '...' : post.title;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép liên kết bài viết vào khay nhớ tạm!");
  };

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8fafc] min-h-screen pb-28 relative"
    >
      <SeoHead
        title={post.seo_title ?? `${post.title} - Kiến Thức An Toàn NBE Hoang Duy`}
        description={post.seo_description ?? (post.excerpt || '')}
        ogImage={post.cover_image_url || undefined}
        canonical={`/blog/${slug}`}
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100 z-50">
        <div 
          className="h-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="container mx-auto px-6 max-w-7xl pt-10">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tin tức', href: '/blog' },
            { label: breadcrumbName }
          ]}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12 relative">
          
          {/* Left Sticky Sidebar (Desktop only) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-28 space-y-6 flex flex-col items-center">
              <Link 
                to="/blog"
                className="w-12 h-12 rounded-2xl bg-white hover:bg-primary hover:text-white border border-slate-100 flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md group"
                title="Quay lại danh sách"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              
              <div className="w-[1px] h-10 bg-slate-200" />
              
              <button 
                onClick={handleShare}
                className="w-12 h-12 rounded-2xl bg-white hover:bg-primary hover:text-white border border-slate-100 flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                title="Chia sẻ liên kết"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* Main Article Content Card */}
          <div className="lg:col-span-10 xl:col-span-8 lg:col-start-3 xl:col-start-3">
            
            {/* Mobile Back Button */}
            <div className="lg:hidden mb-6">
              <Link 
                to="/blog"
                className="inline-flex items-center gap-2 text-slate-500 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
              </Link>
            </div>

            {/* Premium Article Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_30px_70px_rgba(15,23,42,0.03)] overflow-hidden">
              
              {/* Cover Image Banner */}
              <div className="aspect-[16/9] md:aspect-[21/9] w-full bg-slate-900 relative overflow-hidden">
                {post.cover_image_url ? (
                  <img 
                    src={getMediaUrl(post.cover_image_url)} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-900 via-teal-950 to-zinc-950 flex flex-col items-center justify-center p-8 text-center select-none relative">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-2xl">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">NBE Hoang Duy Safety</span>
                    <h2 className="text-sm md:text-base font-bold text-slate-300 mt-2 max-w-[80%] uppercase tracking-wide truncate">{post.title}</h2>
                  </div>
                )}
              </div>

              {/* Editorial Content area */}
              <div className="px-6 py-8 md:px-12 md:py-14 lg:px-16 lg:py-16">
                
                {/* Meta Header */}
                <div className="space-y-6 mb-8">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black bg-primary/10 text-primary tracking-widest uppercase border border-primary/5">
                    <Award size={12} className="fill-primary text-slate-900" /> Kiến Thức Chuyên Ngành
                  </span>
                  
                  <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-[42px] font-black text-slate-900 leading-[1.2] tracking-tight">
                    {post.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-tight pt-2 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center font-black text-white border border-white shadow-sm shrink-0">
                        {(post.author_name || 'Quản trị viên').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-700 font-black">{post.author_name || 'Quản trị viên'}</span>
                    </div>
                    <span className="hidden md:inline text-slate-200">|</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {formattedDate}</span>
                    <span className="hidden md:inline text-slate-200">|</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> 5 phút đọc</span>
                  </div>
                </div>

                {/* Excerpt Summary */}
                {post.excerpt && (
                  <div className="bg-slate-50 border-l-4 border-primary rounded-r-2xl p-6 md:p-8 text-slate-600 mb-10 font-semibold text-base md:text-lg leading-relaxed shadow-sm">
                    {post.excerpt}
                  </div>
                )}

                {/* Enhanced Dynamic Body Content */}
                <div 
                  className="prose prose-slate prose-lg max-w-none mb-12 
                    prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium prose-p:text-base md:prose-p:text-[17px] prose-p:mb-6
                    prose-headings:text-slate-900 prose-headings:font-black prose-headings:tracking-tight
                    prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-slate-100
                    prose-h3:text-xl md:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                    prose-strong:text-slate-900 prose-strong:font-black
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2.5 prose-ul:font-medium prose-ul:text-slate-600 prose-ul:my-6
                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2.5 prose-ol:font-medium prose-ol:text-slate-600 prose-ol:my-6
                    prose-li:marker:text-primary
                    prose-blockquote:border-l-primary prose-blockquote:bg-slate-50 prose-blockquote:px-8 prose-blockquote:py-6 prose-blockquote:rounded-r-2xl prose-blockquote:font-semibold prose-blockquote:italic prose-blockquote:text-slate-700 prose-blockquote:my-8 prose-blockquote:shadow-sm
                    prose-a:text-primary prose-a:font-black prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-3xl prose-img:shadow-lg prose-img:border prose-img:border-slate-100 prose-img:my-10"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(
                      (function() {
                        try {
                          return marked.parse(post.body, { async: false }) as string;
                        } catch {
                          return post.body;
                        }
                      })()
                    ) 
                  }}
                />

                {/* Editorial Author Bio Card */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 md:p-8 mt-14 flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-white/20 shrink-0 select-none">
                    {(post.author_name || 'Quản trị viên').charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-2 text-center md:text-left flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <h4 className="text-base font-black text-slate-900">{post.author_name || 'Quản trị viên'}</h4>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg w-fit mx-auto md:mx-0 select-none">Ban Biên Tập NBE</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                      Chuyên gia tư vấn an toàn lao động, cung cấp thông tin kỹ thuật chính xác, tiêu chuẩn thiết bị bảo hộ cá nhân (PPE) cao cấp giúp bảo vệ sức khỏe người lao động Việt Nam.
                    </p>
                  </div>
                </div>

                {/* Share Row (Mobile only) */}
                <div className="flex items-center justify-between gap-4 pt-8 border-t border-slate-100 mt-10 lg:hidden">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Chia sẻ:</span>
                  <button 
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-primary hover:text-white border border-slate-100 text-slate-500 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Share2 size={14} /> Sao chép liên kết
                  </button>
                </div>

              </div>
            </div>

            {/* Related Articles Section */}
            {relatedPosts.length > 0 && (
              <div className="border-t border-slate-200/60 pt-16 mt-16">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <MessageSquare size={16} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Bài viết liên quan</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedPosts.map(rp => (
                    <BlogCard key={rp.id} post={rp} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogDetail;
