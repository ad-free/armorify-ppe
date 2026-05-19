import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HardHat, Shirt, Shield, Glasses, Wrench, Zap, Footprints, Headphones, ArrowRight, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/hooks/useCatalog';
import type { CategoryRead } from '@/types/api';

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
  'mat-na': Shield,
};

interface CategoryNode extends CategoryRead {
  children: CategoryNode[];
}

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

export const MegaMenu: React.FC<Props> = ({ isOpen: _isOpen, onClose }) => {
  const { t } = useTranslation();
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
  const activeNode = tree.find(n => n.id === activeNodeId);
  
  // Update state whenever we change selection
  const handleSelectNode = (id: string) => setSelectedNodeId(id);

  // Count total subcategories (including grandchildren)
  const countDescendants = (node: CategoryNode): number => {
    let count = node.children.length;
    node.children.forEach(c => { count += countDescendants(c); });
    return count;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white shadow-[0_25px_80px_rgba(0,0,0,0.15)] border border-gray-100/80 flex text-gray-900 rounded-b-2xl rounded-tr-2xl overflow-hidden w-[920px] min-w-[920px] origin-top-left"
    >

      {/* LEFT COLUMN: Root Categories */}
      <div className="w-[280px] border-r border-gray-100 bg-white flex flex-col py-3 relative z-10 shrink-0">
        {/* Header */}
        <div className="px-6 pb-3 mb-1 border-b border-gray-50">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">{t('megaMenu.allCategories')}</span>
        </div>

        {/* Category List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
          {tree.map((node) => {
            const isSelected = activeNodeId === node.id;
            const Icon = ICON_MAP[node.slug] || Package;
            const childCount = countDescendants(node);
            return (
              <div
                key={node.id}
                onMouseEnter={() => handleSelectNode(node.id)}
                className={`relative cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'bg-primary/[0.04]' 
                    : 'hover:bg-gray-50/80'
                }`}
              >
                {/* Active indicator */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ${
                  isSelected ? 'h-7 bg-primary' : 'h-0 bg-transparent'
                }`} />
                
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isSelected 
                        ? 'bg-primary text-white shadow-sm shadow-primary/20' 
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                      <Icon size={18} strokeWidth={isSelected ? 2.2 : 1.8} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[13.5px] leading-tight transition-colors duration-200 ${
                        isSelected ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'
                      }`}>
                        {node.name}
                      </span>
                      {childCount > 0 && (
                        <span className={`text-[10.5px] font-medium mt-0.5 transition-colors ${
                          isSelected ? 'text-primary/70' : 'text-gray-350'
                        }`}>
                          {childCount} {t('megaMenu.subcategories')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight 
                    size={14} 
                    className={`transition-all duration-200 ${
                      isSelected 
                        ? 'text-primary translate-x-0.5 opacity-100' 
                        : 'text-gray-300 opacity-60'
                    }`} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: View All Link */}
        <div className="px-5 pt-3 mt-1 border-t border-gray-50">
          <Link 
            to="/categories"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-[12px] font-bold text-primary hover:text-white bg-primary/5 hover:bg-primary rounded-xl transition-all duration-200 group"
          >
            {t('megaMenu.viewAllCategories')}
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN: Subcategories Content */}
      <div className="flex-1 bg-[#fafbfc] relative min-h-[420px] max-h-[520px] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNodeId}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="p-8"
          >
            {activeNode && (
              <>
                {/* Category Header */}
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-100">
                  <div>
                    <h3 className="text-[18px] font-black text-gray-900 tracking-tight">
                      {activeNode.name}
                    </h3>
                    {activeNode.children.length > 0 && (
                      <p className="text-[12px] text-gray-400 font-medium mt-1">
                        {activeNode.children.length} {t('megaMenu.categories')} • {countDescendants(activeNode)} {t('megaMenu.subcategories')}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/categories/${activeNode.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-primary hover:text-primary/80 transition-colors group"
                  >
                    {t('megaMenu.viewAll')}
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {activeNode.children.length === 0 ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-gray-100">
                      {(() => {
                        const Icon = ICON_MAP[activeNode.slug] || Package;
                        return <Icon size={28} className="text-gray-300" />;
                      })()}
                    </div>
                    <p className="text-[13px] font-bold text-gray-400 mb-1">{t('megaMenu.emptySubcategories')}</p>
                    <p className="text-[12px] text-gray-300 font-medium mb-5 max-w-[240px]">
                      {t('megaMenu.emptyDesc')}
                    </p>
                    <Link
                      to={`/categories/${activeNode.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 bg-primary text-white text-[12px] font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95"
                    >
                      {t('megaMenu.viewProducts')}
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ) : (
                  /* Subcategories Grid — grouped by child with grandchildren listed below */
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">
                    {activeNode.children.map((child) => (
                      <div key={child.id} className="group/col min-w-0">
                        {/* Subcategory Title (Bold Header) */}
                        <Link
                          to={`/categories/${child.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-2 mb-3 group/link"
                        >
                          <h4 className="text-[14px] font-black text-gray-800 group-hover/link:text-primary transition-colors tracking-tight truncate">
                            {child.name}
                          </h4>
                          <ChevronRight size={13} className="text-gray-300 group-hover/link:text-primary group-hover/link:translate-x-0.5 transition-all" />
                        </Link>

                        {/* Grandchildren List */}
                        {child.children.length > 0 ? (
                          <ul className="space-y-0.5">
                            {child.children.map((grandchild) => (
                              <li key={grandchild.id}>
                                <Link
                                  to={`/categories/${grandchild.slug}`}
                                  onClick={onClose}
                                  className="flex items-center gap-2.5 py-1.5 text-[13px] font-medium text-gray-500 hover:text-primary transition-colors group/item truncate"
                                >
                                  <span className="w-1 h-1 rounded-full bg-gray-300 group-hover/item:bg-primary group-hover/item:scale-150 transition-all flex-shrink-0" />
                                  {grandchild.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <Link
                            to={`/categories/${child.slug}`}
                            onClick={onClose}
                            className="text-[12px] font-medium text-gray-400 hover:text-primary transition-colors flex items-center gap-1 mt-1"
                          >
                            {t('megaMenu.viewProducts')} →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
