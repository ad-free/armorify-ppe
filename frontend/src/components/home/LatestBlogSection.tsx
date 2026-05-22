import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { getMediaUrl } from '@/lib/api';

export const LatestBlogSection: React.FC = () => {
  const { data: blogsData, isLoading } = useBlogPosts(0, 3);
  const posts = blogsData?.items || [];

  return (
    <section className="py-20 bg-[#f4f7f7]">
      <div className="container mx-auto">
        <div className="flex justify-between items-end mb-12 px-4 md:px-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase">Kiến Thức An Toàn</h2>
            <p className="text-gray-500 font-medium text-sm md:text-[15px]">Cập nhật tin tức và hướng dẫn sử dụng trang thiết bị bảo hộ mới nhất</p>
          </div>
          <Link to="/blog" className="hidden sm:flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:translate-x-2 transition-transform">
            Xem Tất Cả <ArrowRight size={18} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm p-8 space-y-6 animate-pulse">
                <div className="aspect-[16/10] bg-slate-200 rounded-[1.5rem]" />
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 w-1/3 rounded" />
                  <div className="h-6 bg-slate-200 w-3/4 rounded-lg" />
                  <div className="h-4 bg-slate-200 w-full rounded" />
                  <div className="h-4 bg-slate-200 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-100/50 shadow-sm px-6 mx-4 md:mx-0">
            <p className="text-slate-500 font-medium">Hiện tại chưa có bài viết tin tức nào được xuất bản.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
            {posts.map((blog, idx) => {
              const publishedDate = blog.published_at || blog.created_at;
              const formattedDate = new Date(publishedDate).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              const author = blog.author_name || 'Quản trị viên';

              return (
                <motion.article 
                  key={blog.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-gray-100/50"
                >
                  <Link to={`/blog/${blog.slug}`} className="block relative overflow-hidden aspect-[16/10] bg-slate-900">
                    {blog.cover_image_url ? (
                      <img 
                        src={getMediaUrl(blog.cover_image_url)} 
                        alt={blog.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-teal-950 to-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none relative">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">NBE Hoang Duy</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase max-w-[85%] truncate">{blog.title}</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-primary shadow-lg uppercase tracking-wider">
                       Tips & Tricks
                    </div>
                  </Link>

                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-5 mb-5 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {formattedDate}</span>
                      <span className="flex items-center gap-1.5"><User size={14} className="text-primary" /> {author}</span>
                    </div>
                    
                    <Link to={`/blog/${blog.slug}`} className="block mb-4">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                    </Link>
                    
                    {blog.excerpt && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3">
                        {blog.excerpt}
                      </p>
                    )}

                    <Link 
                      to={`/blog/${blog.slug}`}
                      className="mt-auto inline-flex items-center gap-2 text-gray-900 font-black text-xs uppercase tracking-widest border-b-4 border-primary/20 hover:border-primary transition-all pb-1 w-fit group/btn"
                    >
                      Đọc Thêm <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
