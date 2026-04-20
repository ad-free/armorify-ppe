// src/components/home/HeroSlider.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';


const banners = [
  {
    id: 1,
    label: '✨ Mới nhất 2026',
    title: 'Giải Pháp Bảo Hộ \r\nToàn Diện',
    subtitle: 'Nâng cao tiêu chuẩn an toàn cho đội ngũ của bạn với thiết bị đạt chuẩn quốc tế.',
    cta: 'Khám Phá Ngay',
    link: '/categories',
    accent: '#0da487',
    image: '/hero_banner_1.png',
    textColor: '#ffffff'
  },
  {
    id: 2,
    label: '⚡ Ưu Đãi Tháng 4',
    title: 'Giày Bảo Hộ Cao Cấp \r\nGiảm 30%',
    subtitle: 'Bền bỉ trong mọi điều kiện khắc nghiệt. Bảo vệ tối đa, cảm giác êm ái suốt ngày dài.',
    cta: 'Mua Ngay',
    link: '/categories/giay-bao-ho',
    accent: '#FFA500',
    image: '/hero_banner_2.png',
    textColor: '#ffffff'
  },
];

const sideBanners = [
  {
    title: 'An Toàn Công Trường',
    subtitle: 'Giảm đến 50% thiết bị bảo hộ',
    link: '/sale',
    bg: '#000',
    image: '/shoes_banner.png',
    accent: '#0da487'
  },
  {
    title: 'Giải Pháp Kho Bãi',
    subtitle: 'Chuẩn quy trình vận hành 3M',
    link: '/brand/3m',
    bg: '#000',
    image: '/register_bg.png',
    accent: '#ffa53b'
  },
];


export const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setCurrent(p => (p - 1 + banners.length) % banners.length);
  const next = () => setCurrent(p => (p + 1) % banners.length);

  return (
    <div className="bg-white">
      <div className="container mx-auto py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* MIDDLE: Main Slider — 1fr */}
          <div className="relative rounded-[2rem] overflow-hidden group h-[300px] sm:h-[350px] lg:h-[450px]">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full flex items-center bg-black"
              >
                {/* Background Image - Full Scene */}
                <div className="absolute inset-0 z-0">
                  <motion.img 
                    src={banners[current].image} 
                    alt={banners[current].title}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="w-full h-full object-cover opacity-60 md:opacity-80"
                  />
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                {/* Layout container: Content on top */}
                <div className="relative z-20 w-full h-full flex items-center px-8 md:px-24">
                  {/* Left Side: Content */}
                  <div className="relative z-30 max-w-2xl">
                    <motion.span
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-block text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg mb-6 border border-white/20 backdrop-blur-md"
                      style={{ backgroundColor: `${banners[current].accent}30`, color: '#fff' }}
                    >
                      {banners[current].label}
                    </motion.span>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl sm:text-4xl md:text-6xl font-black leading-[1.05] mb-5 whitespace-pre-line tracking-tighter text-white drop-shadow-2xl"
                    >
                      {banners[current].title}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-gray-200 text-sm md:text-lg mb-10 leading-relaxed max-w-md hidden sm:block font-medium"
                    >
                      {banners[current].subtitle}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Link
                        to={banners[current].link}
                        className="inline-flex items-center gap-3 text-white font-black text-xs py-4 px-10 rounded-2xl transition-all shadow-2xl hover:-translate-y-1 active:scale-95 border border-white/10"
                        style={{ backgroundColor: banners[current].accent }}
                      >
                        {banners[current].cta}
                        <ChevronRight size={18} strokeWidth={3} />
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Prev / Next Arrows */}
            <button
              onClick={prev}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white shadow-lg text-gray-800 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white shadow-lg text-gray-800 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-white"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-8 left-14 z-30 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-primary' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT Side Banners — 320px */}
          <div className="hidden lg:flex flex-col gap-6">
            {sideBanners.map((banner, i) => (
              <Link
                key={i}
                to={banner.link}
                className="flex-1 relative rounded-[2rem] overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex items-center bg-black"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={banner.image} 
                    alt={banner.title} 
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                </div>

                <div className="relative pl-8 z-20 w-full">
                   <div 
                    className="w-8 h-1 rounded-full mb-4"
                    style={{ backgroundColor: banner.accent }}
                  />
                  <p className="text-white font-black text-xl leading-tight mb-2 pr-10 drop-shadow-md">{banner.title}</p>
                  <p className="text-gray-300 text-[11px] font-bold mb-6">{banner.subtitle}</p>
                  <span className="inline-flex text-white font-black text-[10px] items-center gap-1 group-hover:gap-2 transition-all uppercase tracking-widest border-b border-white/20 pb-1">
                    XEM NGAY <ChevronRight size={12} strokeWidth={3} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>


  );
};
