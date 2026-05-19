// src/components/home/CategorySidebar.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HardHat, Shirt, Shield, Glasses, Wrench, Zap, Footprints, Headphones, Eye, Activity, Heart, Hammer, Cpu, Factory } from 'lucide-react';
import { useCategories } from '@/hooks/useCatalog';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP: Record<string, React.ElementType> = {
  'mu-bao-ho': HardHat,
  'quan-ao-bao-ho': Shirt,
  'gang-tay': Shield,
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

const getCategoryIcon = (slug: string) => {
  if (ICON_MAP[slug]) return ICON_MAP[slug];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_ICONS[Math.abs(hash) % FALLBACK_ICONS.length];
};

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

export const CategorySidebar: React.FC = () => {
  const { data: catData } = useCategories();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const tree = React.useMemo(() => {
    const categoriesList = catData || [];
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    
    // Pass 1: Create all nodes
    categoriesList.forEach(c => map.set(c.id, { ...c, children: [] }));
    
    // Pass 2: Link parents/children
    categoriesList.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parent_id && c.parent_id !== c.id) {
        const parent = map.get(c.parent_id);
        if (parent) {
          parent.children?.push(node);
          return;
        }
      }
      roots.push(node);
    });
    return roots;
  }, [catData]);

  return (
    <div className="bg-white rounded-b-[2rem] border-x border-b border-gray-100 shadow-sm overflow-hidden h-full hidden lg:block relative">
      <div className="py-2">

        {tree.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const isHovered = hoveredId === cat.id;

          return (
            <div
              key={cat.id}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative"
            >
              <Link
                to={`/categories/${cat.slug}`}
                className={`flex items-center justify-between px-6 py-3.5 transition-all group ${
                  isHovered ? 'bg-[#f3f7f7] text-primary' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isHovered ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{cat.name}</span>
                </div>
                <ChevronRight size={16} className={`transition-transform ${isHovered ? 'translate-x-1' : 'opacity-30'}`} />
              </Link>

              {/* Mega-menu panel (Side popup) */}
              <AnimatePresence>
                {isHovered && cat.children && cat.children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute top-0 left-full w-[500px] bg-white shadow-[20px_0_50px_rgba(0,0,0,0.1)] border-l border-gray-100 min-h-full z-50 p-8 rounded-r-[2rem]"
                  >
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      {cat.children.map((child) => (
                        <div key={child.id}>
                          <Link
                            to={`/categories/${child.slug}`}
                            className="text-sm font-black text-gray-900 hover:text-primary transition-colors block mb-3 uppercase tracking-tighter"
                          >
                            {child.name}
                          </Link>
                          {child.children && child.children.length > 0 && (
                            <ul className="space-y-2">
                              {child.children.map((sub) => (
                                <li key={sub.id}>
                                  <Link
                                    to={`/categories/${sub.slug}`}
                                    className="text-xs font-bold text-gray-500 hover:text-primary transition-colors block"
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
