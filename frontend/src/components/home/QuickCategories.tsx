// src/components/home/QuickCategories.tsx — FastKart round icons from API
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HardHat, Shirt, Shield, Glasses, Headphones, Zap, Footprints, Wrench, Eye, Activity, Heart, Hammer, Cpu, Factory } from 'lucide-react';
import { useCategories } from '@/hooks/useCatalog';

const ICON_MAP: Record<string, React.ElementType> = {
  'mu-bao-ho': HardHat,
  'quan-ao-bao-ho': Shirt,
  'gang-tay-bao-ho': Shield,
  'kinh-bao-ho': Glasses,
  'giay-bao-ho': Footprints,
  'thiet-bi-dien': Zap,
  'dung-cu': Wrench,
  'chong-on': Headphones,
};

const FALLBACK_ICONS = [
  Shield, Eye, Activity, Heart, Hammer, Cpu, Factory, HardHat, Glasses, Footprints
];

const BG_COLORS: Record<string, string> = {
  'mu-bao-ho': 'bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white',
  'quan-ao-bao-ho': 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white',
  'gang-tay-bao-ho': 'bg-purple-50 text-purple-500 hover:bg-purple-500 hover:text-white',
  'kinh-bao-ho': 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white',
  'giay-bao-ho': 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white',
};

const FALLBACK_BG_COLORS = [
  'bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white',
  'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white',
  'bg-purple-50 text-purple-500 hover:bg-purple-500 hover:text-white',
  'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white',
  'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white',
  'bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white',
  'bg-teal-50 text-teal-500 hover:bg-teal-500 hover:text-white',
  'bg-cyan-50 text-cyan-500 hover:bg-cyan-500 hover:text-white',
];

const getCategoryIcon = (slug: string) => {
  if (ICON_MAP[slug]) return ICON_MAP[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_ICONS[Math.abs(hash) % FALLBACK_ICONS.length];
};

const getCategoryBgColor = (slug: string) => {
  if (BG_COLORS[slug]) return BG_COLORS[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_BG_COLORS[Math.abs(hash) % FALLBACK_BG_COLORS.length];
};

export const QuickCategories: React.FC = () => {
  const { data: categories } = useCategories();
  const rootCats = (categories || []).filter(c => !c.parent_id || c.parent_id === c.id).slice(0, 10);

  // Proper mapping
  const items = rootCats.length > 0
    ? rootCats.map(cat => ({ name: cat.name, slug: cat.slug }))
    : [
        { name: 'Khẩu Trang', slug: 'khau-trang' },
        { name: 'Găng Tay', slug: 'gang-tay-bao-ho' },
        { name: 'Mũ Bảo Hộ', slug: 'mu-bao-ho' },
        { name: 'Giày Bảo Hộ', slug: 'giay-bao-ho' },
        { name: 'Quần Áo', slug: 'quan-ao-bao-ho' },
        { name: 'Kính An Toàn', slug: 'kinh-bao-ho' },
      ];

  return (
    <div className="bg-white py-10">
      <div className="container mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-[22px] font-black text-gray-900 tracking-tight underline decoration-primary/20 decoration-4 underline-offset-8">Mua Sắm Theo Danh Mục</h2>
          <div className="flex-1 h-0.5 bg-gray-50 rounded-full" />
        </div>
        <div className="flex gap-8 overflow-x-auto pt-6 pb-6 scrollbar-hide">
          {items.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.slug);
            const colorClass = getCategoryBgColor(cat.slug);
            return (
              <motion.div
                key={cat.slug + idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                   to={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center gap-4 min-w-[110px]"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border border-transparent group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-3 group-hover:border-primary/10 ${colorClass}`}>
                    <Icon size={36} strokeWidth={1.5} className="transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <span className="text-[13px] font-bold text-gray-500 text-center leading-tight group-hover:text-primary transition-colors tracking-tight uppercase">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

