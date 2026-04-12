// src/components/home/HeroSlider.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const banners = [
  {
    id: 1,
    url: '/hero_banner_1.png',
    title: 'Giải Pháp An Toàn Lao Động Chuyên Nghiệp',
    subtitle: 'Cung cấp trang thiết bị bảo hộ lao động đạt chuẩn quốc tế',
    cta: 'Khám phá ngay',
  },
  {
    id: 2,
    url: '/hero_banner_2.png',
    title: 'Giày Bảo Hộ Nhập Khẩu Mới Nhất 2026',
    subtitle: 'Chống đinh, chống dập tuyệt đối với kiểu dáng siêu nhẹ thời trang',
    cta: 'Xem bộ sưu tập',
  }
];

export const HeroSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[300px] md:h-[450px] lg:h-[550px] overflow-hidden bg-gray-900">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Banner Image */}
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img 
            src={banners[currentIndex].url} 
            alt={banners[currentIndex].title}
            className="w-full h-full object-cover object-center"
          />
          
          {/* Overlay Text Content */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-start container mx-auto px-6 max-w-7xl">
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="max-w-2xl text-white"
            >
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 drop-shadow-md">
                {banners[currentIndex].title}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 font-medium drop-shadow">
                {banners[currentIndex].subtitle}
              </p>
              <button className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 shadow-soft">
                {banners[currentIndex].cta}
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-3">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentIndex ? 'bg-primary w-8' : 'bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
