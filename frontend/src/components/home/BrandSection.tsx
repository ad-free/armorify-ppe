import React from 'react';
import { motion } from 'framer-motion';

const BRANDS = [
  { name: '3M', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/3M_logo.svg' },
  { name: 'Honeywell', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Honeywell_logo.svg' },
  { name: 'Ansell', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Ansell-Logo.svg' },
  { name: 'Uvex', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Uvex_Logo.svg' },
  { name: 'MSA Safety', logo: 'https://upload.wikimedia.org/wikipedia/en/b/ba/MSA_Safety_logo.png' },
  { name: 'DuPont', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/DuPont_logo.svg' },
];

export const BrandSection: React.FC = () => {
  return (
    <div className="bg-white py-16 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex flex-col items-center mb-12">
          <span className="text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-3">Partnership</span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Thương Hiệu Đồng Hành</h2>
          <div className="w-16 h-1.5 bg-primary/20 rounded-full mt-4" />
        </div>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 hover:opacity-100 transition-opacity duration-700">
          {BRANDS.map((brand, idx) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer"
            >
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="h-8 md:h-12 w-auto object-contain filter brightness-90 contrast-125"
                onError={(e) => {
                  // Fallback to text if logo fails to load
                  const img = e.currentTarget;
                  img.style.display = 'none';
                  const next = img.nextSibling as HTMLElement;
                  if (next) next.style.display = 'block';
                }}
              />
              <span className="hidden font-black text-2xl text-gray-400 hover:text-primary transition-colors">{brand.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
