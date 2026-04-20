import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';

const DUMMY_BLOGS = [
  {
    id: 1,
    title: 'Cách lựa chọn giày bảo hộ phù hợp cho môi trường xây dựng',
    excerpt: 'Lựa chọn một đôi giày bảo hộ không chỉ là về giá cả, mà còn là về sự an toàn và thoải mái...',
    date: '20/04/2026',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1591955506264-3f5a6834570a?q=80&w=800&auto=format&fit=crop',
    slug: 'chon-giay-bao-ho'
  },
  {
    id: 2,
    title: 'Tiêu chuẩn quốc tế về mũ bảo hộ lao động: Những điều cần biết',
    excerpt: 'Hiểu rõ các tiêu chuẩn EN 397 hay ANSI Z89.1 giúp bạn trang bị đúng cho đội ngũ của mình...',
    date: '18/04/2026',
    author: 'Safety Team',
    image: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?q=80&w=800&auto=format&fit=crop',
    slug: 'tieu-chuan-mu-bao-ho'
  },
  {
    id: 3,
    title: 'Nội quy an toàn phòng thí nghiệm: Bảo vệ tối đa với thiết bị đúng',
    excerpt: 'Phòng thí nghiệm tiềm ẩn nhiều rủi ro hóa chất, hãy cùng điểm qua các thiết bị bắt buộc...',
    date: '15/04/2026',
    author: 'Expert',
    image: 'https://images.unsplash.com/photo-1582719202047-76d3432ee323?q=80&w=800&auto=format&fit=crop',
    slug: 'an-toan-phong-thi-nghiem'
  }
];

export const LatestBlogSection: React.FC = () => {
  return (
    <section className="py-20 bg-[#f4f7f7]">
      <div className="container mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4 uppercase">Kiến Thức An Toàn</h2>
            <p className="text-gray-500 font-medium text-sm md:text-[15px]">Cập nhật tin tức và hướng dẫn sử dụng trang thiết bị bảo hộ mới nhất</p>
          </div>
          <Link to="/blog" className="hidden sm:flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:translate-x-2 transition-transform">
            Xem Tất Cả <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DUMMY_BLOGS.map((blog, idx) => (
            <motion.article 
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-gray-100/50"
            >
              <Link to={`/blog/${blog.slug}`} className="block relative overflow-hidden aspect-[16/10]">
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-primary shadow-lg uppercase tracking-wider">
                   Tips & Tricks
                </div>
              </Link>

              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-5 mb-5 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {blog.date}</span>
                  <span className="flex items-center gap-1.5"><User size={14} className="text-primary" /> {blog.author}</span>
                </div>
                
                <Link to={`/blog/${blog.slug}`} className="block mb-4">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">
                    {blog.title}
                  </h3>
                </Link>
                
                <p className="text-gray-500 text-sm leading-relaxed mb-8 line-clamp-3">
                  {blog.excerpt}
                </p>

                <Link 
                  to={`/blog/${blog.slug}`}
                  className="mt-auto inline-flex items-center gap-2 text-gray-900 font-black text-xs uppercase tracking-widest border-b-4 border-primary/20 hover:border-primary transition-all pb-1 w-fit group/btn"
                >
                  Đọc Thêm <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
