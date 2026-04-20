import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HardHat, Shirt, Shield, Glasses, Wrench, Zap, Footprints, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '@/hooks/useCatalog';
import type { CategoryRead } from '@/types/api';

const ICON_MAP: Record<string, React.ElementType> = {
  'mu-bao-ho': HardHat,
  'quan-ao-bao-ho': Shirt,
  'gang-tay': Shield,
  'kinh-bao-ho': Glasses,
  'giay-bao-ho': Footprints,
  'thiet-bi-dien': Zap,
  'dung-cu': Wrench,
  'chong-on': Headphones,
};

interface CategoryNode extends CategoryRead {
  children: CategoryNode[];
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const MegaMenu: React.FC<Props> = ({ isOpen: _isOpen, onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data: catData } = useCategories();
  const tree = useMemo(() => {
    const categoriesList = catData || [];
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    categoriesList.forEach(c => map.set(c.id, { ...c, children: [] }));
    categoriesList.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parent_id && c.parent_id !== c.id) {
        const parent = map.get(c.parent_id);
        if (parent) { parent.children.push(node); return; }
      }
      roots.push(node);
    });
    return roots;
  }, [catData]);

  // Use the first category as default if none selected
  const activeNodeId = selectedNodeId || (tree.length > 0 ? tree[0].id : null);
  
  // Update state whenever we change selection
  const handleSelectNode = (id: string) => setSelectedNodeId(id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-gray-100 flex text-gray-900 rounded-b-3xl overflow-hidden w-[950px] min-w-[950px] min-h-[400px] origin-top"
    >

      {/* LEFT COLUMN: Root Categories */}
      <div className="w-[300px] border-r border-gray-50 bg-[#f9fbfb] flex flex-col py-4 relative z-10 shrink-0">
        {tree.map(node => {
          const isSelected = activeNodeId === node.id;
          const Icon = ICON_MAP[node.slug] || Shield;
          return (
            <div
              key={node.id}
              onMouseEnter={() => handleSelectNode(node.id)}
              onClick={() => handleSelectNode(node.id)}
              className={`relative px-8 py-4 cursor-pointer flex justify-between items-center transition-all group ${
                isSelected ? 'bg-white text-primary' : 'text-gray-600 hover:text-primary hover:bg-white/50'
              }`}
            >
              {/* Active Indicator Bar */}
              {isSelected && (
                <motion.div 
                  layoutId="activeCategory"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(13,164,135,0.3)]"
                />
              )}

              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-primary/10' : 'bg-gray-100 group-hover:bg-primary/5'}`}>
                  <Icon size={20} className={isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} />
                </div>
                <span className={`text-[15px] tracking-tight ${isSelected ? 'font-bold text-slate-800' : 'font-semibold text-slate-500'}`}>{node.name}</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-300 ${isSelected ? 'translate-x-1 opacity-100 text-primary' : 'opacity-20 translate-x-0'}`} />
            </div>
          );
        })}
      </div>

      {/* RIGHT COLUMN: Spilling Content */}
      <div className="flex-1 bg-white relative max-h-[550px] overflow-y-auto custom-scrollbar p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNodeId}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-x-12 gap-y-12"
          >
            {(() => {
              const activeNode = tree.find(n => n.id === activeNodeId);
              if (!activeNode) return null;

              return (
                <>
                  {activeNode.children.map((child) => (
                    <div key={child.id} className="flex flex-col group/col">
                      <Link 
                        to={`/categories/${child.slug}`}
                        onClick={onClose}
                        className="text-[17px] font-bold text-slate-800 mb-6 pb-2 border-b border-gray-100 block group-hover/col:text-primary transition-colors relative"
                      >
                        {child.name}
                        <span className="absolute bottom-[-1px] left-0 w-0 h-0.5 bg-primary transition-all group-hover/col:w-full" />
                      </Link>
                      <ul className="space-y-4">
                        {child.children.map((sub) => (
                          <li key={sub.id} className="flex items-center gap-3 group/link">
                            <motion.span 
                              whileHover={{ scale: 1.5 }}
                              className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover/link:bg-primary transition-colors" 
                            />
                            <Link 
                              to={`/categories/${sub.slug}`}
                              onClick={onClose}
                              className="text-[14px] font-semibold text-slate-500 hover:text-primary transition-colors"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {activeNode.children.length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-24 text-gray-300">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <Shield size={32} className="opacity-20" />
                      </div>
                      <p className="text-[13px] font-black uppercase tracking-widest">Không có danh mục con</p>
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};



