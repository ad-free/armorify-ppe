// src/pages/public/BlogList.tsx
import React, { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { PaginationControls } from '@/components/common/PaginationControls';
import { BlogCard } from '@/components/blog/BlogCard';
import { useBlogPosts } from '@/hooks/useBlog';
import { Calendar, User, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { getMediaUrl } from '@/lib/api';

const BlogList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10; // 1 featured + 9 grid items
  const skip = (page - 1) * limit;

  const { data, isLoading } = useBlogPosts(skip, limit);

  // Separate the first post as "Featured" on page 1
  const { featuredPost, listPosts } = useMemo(() => {
    const posts = data?.items || [];
    if (page === 1 && posts.length > 0) {
      return {
        featuredPost: posts[0],
        listPosts: posts.slice(1)
      };
    }
    return {
      featuredPost: null,
      listPosts: posts
    };
  }, [data, page]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#f8fafc] min-h-screen pb-24"
    >
      <SeoHead
        title="Tin Tức & Kiến Thức Bảo Hộ Lao Động - NBE Hoang Duy"
        description="Cập nhật kiến thức bảo hộ lao động mới nhất, review trang thiết bị thực tế, và cẩm nang quy trình an toàn chuẩn quốc tế từ NBE Hoang Duy."
      />

      {/* Hero Banner with Embedded Breadcrumb */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden border-b border-slate-800/80">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="py-12 md:py-16">
            <Breadcrumb
              variant="dark"
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: 'Tin tức' }
              ]}
            />
            <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <motion.span 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-block text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary"
                >
                  Cẩm Nang An Toàn & Bảo Hộ
                </motion.span>
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase leading-none"
                >
                  Kiến Thức An Toàn Lao Động
                </motion.h1>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 max-w-3xl text-xs md:text-sm font-semibold leading-relaxed"
                >
                  Cập nhật tin tức chuyên ngành, cẩm nang sử dụng thiết bị bảo hộ, hướng dẫn quy trình an toàn lao động quốc tế từ đội ngũ chuyên gia của NBE Hoang Duy.
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl py-16">
        {isLoading ? (
          <div className="space-y-12 animate-pulse">
            <div className="h-[400px] bg-white rounded-[2.5rem] border border-slate-100"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white aspect-[4/3] rounded-[2rem] border border-slate-100"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* 1. Featured Post (Page 1) */}
            {featuredPost && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group"
              >
                <div className="grid lg:grid-cols-2">
                  <Link to={`/blog/${featuredPost.slug}`} className="relative overflow-hidden block aspect-[16/10] lg:aspect-auto lg:h-[450px] bg-slate-900 group-hover:opacity-95 transition-opacity">
                    {featuredPost.cover_image_url ? (
                      <img 
                        src={getMediaUrl(featuredPost.cover_image_url)} 
                        alt={featuredPost.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-teal-950 to-zinc-950 flex flex-col items-center justify-center p-8 text-center select-none relative min-h-[300px] lg:h-full">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">NBE Hoang Duy</span>
                        <span className="text-sm font-medium text-slate-400 mt-2 max-w-[80%] uppercase tracking-widest leading-relaxed">Cẩm nang bảo hộ chuyên nghiệp</span>
                      </div>
                    )}
                    <div className="absolute top-6 left-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                      Nổi bật
                    </div>
                  </Link>
                  <div className="p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-bold uppercase tracking-tight mb-6">
                        <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString('vi-VN')}</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> 5 phút đọc</span>
                        <span className="flex items-center gap-1.5"><User size={14} className="text-primary" /> {featuredPost.author_name || 'Quản trị viên'}</span>
                      </div>
                      <Link to={`/blog/${featuredPost.slug}`} className="block group-hover:text-primary transition-colors">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium mb-8 line-clamp-3">
                        {featuredPost.excerpt || 'Đọc cẩm nang chi tiết hướng dẫn an toàn lao động, các lưu ý quan trọng khi chọn thiết bị phòng hộ cao cấp.'}
                      </p>
                    </div>
                    <Link 
                      to={`/blog/${featuredPost.slug}`}
                      className="inline-flex items-center gap-3 bg-slate-900 text-white font-black text-xs px-8 py-4 rounded-xl hover:bg-primary transition-all duration-300 w-fit shadow-lg hover:shadow-primary/30 uppercase tracking-widest"
                    >
                      Đọc bài viết <ArrowRight size={14} strokeWidth={3} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Grid List */}
            <div className="space-y-8">
              {featuredPost && (
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <BookOpen size={18} className="text-primary" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tất cả bài viết</h3>
                </div>
              )}
              
              {listPosts.length === 0 ? (
                <div className="py-20 text-center text-slate-400 border border-dashed border-slate-200 rounded-[2rem] bg-white">
                  Chưa có thêm bài viết nào khác được xuất bản.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {listPosts.map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ y: 30, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                    >
                      <BlogCard post={post} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Pagination */}
            {data && data.total > limit && (
              <div className="pt-6 border-t border-slate-100">
                <PaginationControls total={data.total} skip={skip} limit={limit} />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BlogList;
