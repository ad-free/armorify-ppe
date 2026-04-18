// src/components/layout/MegaMenu.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrands, useCategories } from '@/hooks/useCatalog';
import type { CategoryRead } from '@/types/api';

interface CategoryNode extends CategoryRead {
  children: CategoryNode[];
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const MegaMenu: React.FC<Props> = ({ isOpen, onClose }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const { data: brandData } = useBrands();
  const brands = brandData?.items || [];
  
  const { data: catData } = useCategories();

  // Build the tree (Parent/Child structure)
  const tree = useMemo(() => {
    const categoriesList = catData || [];
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    categoriesList.forEach(c => map.set(c.id, { ...c, children: [] }));
    
    categoriesList.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parent_id && c.parent_id !== c.id) {
        const parent = map.get(c.parent_id);
        if (parent) {
          parent.children.push(node);
          return;
        }
      }
      roots.push(node);
    });
    return roots;
  }, [catData]);

  // If the parent Navbar says it's closed, render nothing
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="bg-white shadow-2xl border-t-0 border border-gray-100 flex text-gray-900 rounded-b-xl overflow-hidden min-h-[400px]"
    >
      {/* LEFT COLUMN: Vertical Root Categories */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col py-2">
        {tree.map(node => (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            className={`px-6 py-3 cursor-pointer flex justify-between items-center transition-colors ${
              hoveredNodeId === node.id ? 'bg-white text-primary font-bold shadow-sm relative z-10' : 'hover:bg-gray-100 hover:text-primary font-medium'
            }`}
          >
            <Link to={`/categories/${node.slug}`} onClick={onClose} className="flex-1">
              {node.name}
            </Link>
            {node.children.length > 0 && <ChevronRight size={16} className="text-gray-400" />}
          </div>
        ))}
        {tree.length === 0 && (
          <div className="px-6 py-4 text-gray-400 text-sm">Đang tải danh mục...</div>
        )}
      </div>

      {/* RIGHT COLUMN: Children & Brands (Depends on hovered node) */}
      <div className="w-2/3 p-8 bg-white relative">
        <AnimatePresence mode="wait">
          {hoveredNodeId && (
            <motion.div
              key={hoveredNodeId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 p-8 flex flex-col"
            >
              {(() => {
                const activeNode = tree.find(n => n.id === hoveredNodeId);
                if (!activeNode) return null;

                return (
                  <div className="flex gap-8 max-h-[350px] overflow-y-auto">
                    {/* Sub Categories block */}
                    {activeNode.children.length > 0 && (
                      <div className="flex-1">
                        <h3 className="font-extrabold border-b-2 border-primary inline-block pb-1 mb-4 text-gray-800">
                          DANH MỤC CON
                        </h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          {activeNode.children.map(child => (
                            <Link 
                              key={child.id} 
                              to={`/categories/${child.slug}`} 
                              onClick={onClose}
                              className="text-gray-600 hover:text-primary hover:translate-x-1 transition-transform text-sm font-medium"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Featured Brands Demo Block */}
                    {brands.length > 0 && (
                      <div className="w-48 flex-shrink-0">
                        <h3 className="font-extrabold border-b-2 border-gray-800 inline-block pb-1 mb-4 text-gray-800">
                          THƯƠNG HIỆU
                        </h3>
                        <div className="space-y-3">
                          {brands.slice(0, 5).map(brand => (
                            <Link 
                              key={brand.id} 
                              to={`/brand/${brand.slug}`} 
                              onClick={onClose}
                              className="block p-2 border rounded-md hover:border-primary text-center hover:shadow-sm"
                            >
                              <span className="text-xs font-bold text-gray-700">{brand.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when nothing is hovered */}
        {!hoveredNodeId && (
          <div className="flex items-center justify-center h-full text-gray-400 font-medium">
            Di chuột vào danh mục bên trái để xem chi tiết
          </div>
        )}
      </div>
    </motion.div>
  );
};
