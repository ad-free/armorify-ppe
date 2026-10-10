import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, HardHat, Shirt, Shield, Glasses, Wrench, Zap, Footprints, Headphones, ArrowRight, Package, X } from 'lucide-react';
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

export const MegaMenu: React.FC<Props> = ({ isOpen = true, onClose }) => {
  const { t, i18n } = useTranslation();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const contentId = useId();
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
  const activeNode = tree.find(node => node.id === selectedNodeId) || tree[0];

  if (!isOpen) return null;

  return (
    <section aria-label={t('megaMenu.allCategories')} className="w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-surface text-foreground shadow-md">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <h2 className="text-base font-semibold">{t('megaMenu.allCategories')}</h2>
        {onClose && <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label={i18n.language.startsWith('vi') ? 'Đóng danh mục' : 'Close categories'}><X size={20} aria-hidden="true" /></button>}
      </div>
      <div className="grid max-h-[60vh] grid-cols-1 overflow-y-auto md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="border-b border-border p-3 md:border-b-0 md:border-r">
          <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-x-visible">
            {tree.map((node) => {
              const isSelected = activeNode?.id === node.id;
              const Icon = ICON_MAP[node.slug] || Package;
              return (
                <button key={node.id} type="button" aria-pressed={isSelected} aria-controls={contentId} onClick={() => setSelectedNodeId(node.id)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold md:w-full ${isSelected ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-background'}`}>
                  <Icon size={20} className="shrink-0" aria-hidden="true" /><span className="md:min-w-0">{node.name}</span><ChevronRight size={16} className="ml-auto hidden shrink-0 md:block" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <Link to="/categories" onClick={onClose} className="btn btn-secondary mt-2 w-full">{t('megaMenu.viewAllCategories')}<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <div id={contentId} className="min-w-0 bg-background p-4 sm:p-6">
          {activeNode && (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <h3 className="text-lg font-semibold">{activeNode.name}</h3>
                <Link to={`/categories/${activeNode.slug}`} onClick={onClose} className="btn btn-ghost text-primary">{t('megaMenu.viewAll')}<ArrowRight size={18} aria-hidden="true" /></Link>
              </div>
              {activeNode.children.length === 0 ? (
                <div className="empty-state">
                  <p className="text-body text-muted-foreground">{t('megaMenu.emptySubcategories')}</p>
                  <p className="text-caption text-muted-foreground">{t('megaMenu.emptyDesc')}</p>
                  <Link to={`/categories/${activeNode.slug}`} onClick={onClose} className="btn btn-primary mt-4">{t('megaMenu.viewProducts')}<ArrowRight size={18} aria-hidden="true" /></Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeNode.children.map((child) => (
                    <div key={child.id} className="min-w-0">
                      <Link to={`/categories/${child.slug}`} onClick={onClose} className="flex min-h-11 items-center gap-2 rounded-md py-2 text-base font-semibold text-foreground hover:text-primary"><span>{child.name}</span><ChevronRight size={16} className="shrink-0" aria-hidden="true" /></Link>
                      {child.children.length > 0 ? (
                        <ul>
                          {child.children.map((grandchild) => <li key={grandchild.id}><Link to={`/categories/${grandchild.slug}`} onClick={onClose} className="flex min-h-11 items-center rounded-md py-2 text-sm text-muted-foreground hover:text-primary">{grandchild.name}</Link></li>)}
                        </ul>
                      ) : (
                        <Link to={`/categories/${child.slug}`} onClick={onClose} className="btn btn-ghost justify-start px-0 text-primary">{t('megaMenu.viewProducts')}<ArrowRight size={16} aria-hidden="true" /></Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
