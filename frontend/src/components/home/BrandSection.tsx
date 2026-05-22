import React from 'react';
import { motion } from 'framer-motion';
import { useBrands } from '@/hooks/useCatalog';
import { getMediaUrl } from '@/lib/api';
import { Link } from 'react-router-dom';
import { BrandRead } from '@/types/api';

const BrandItem: React.FC<{ brand: BrandRead; idx: number }> = ({ brand, idx }) => {
  const [logoFailed, setLogoFailed] = React.useState(false);

  return (
    <Link to={`/brand/${brand.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: idx * 0.05 }}
        className="grayscale hover:grayscale-0 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center min-w-[150px] md:min-w-[180px] p-4 hover:scale-105 hover:bg-slate-50/60 rounded-2xl transition-all duration-300"
      >
        {brand.logo_url && !logoFailed ? (
          <img 
            src={getMediaUrl(brand.logo_url)} 
            alt={brand.name} 
            className="h-10 sm:h-12 md:h-16 max-w-[140px] md:max-w-[160px] w-auto object-contain filter brightness-95 contrast-125 transition-all duration-300"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="font-black text-xl md:text-2xl text-gray-400 hover:text-primary transition-colors tracking-tight uppercase whitespace-nowrap">
            {brand.name}
          </span>
        )}
      </motion.div>
    </Link>
  );
};

export const BrandSection: React.FC = () => {
  const { data: brandsData, isLoading } = useBrands();
  const brands = brandsData?.items?.filter((b) => b.is_active !== false) || [];

  return (
    <div className="bg-white py-16 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col items-center mb-12">
          <span className="text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-3">Partnership</span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Thương Hiệu Đồng Hành</h2>
          <div className="w-16 h-1.5 bg-primary/20 rounded-full mt-4" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center gap-8 py-6 opacity-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="text-center text-gray-400 font-medium">Chưa có thương hiệu đồng hành nào.</p>
        ) : (
          <div className="relative w-full overflow-hidden py-4 hover-pause">
            {/* Elegant fading gradient overlays for a premium feel */}
            <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex w-max gap-12 md:gap-20 animate-marquee items-center">
              {/* First set of brands */}
              {brands.map((brand, idx) => (
                <BrandItem key={`${brand.id}-first`} brand={brand} idx={idx} />
              ))}

              {/* Duplicate set of brands for infinite seamless looping */}
              {brands.map((brand, idx) => (
                <BrandItem key={`${brand.id}-duplicate`} brand={brand} idx={idx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

