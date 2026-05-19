// src/components/catalog/ProductSortFilter.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw, Search, Star } from 'lucide-react';
import { useCategories, useBrands } from '@/hooks/useCatalog';
import type { BrandRead } from '@/types/api';

interface FilterSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-1 text-left group"
      >
        <span className="flex items-center gap-2 text-[13px] font-bold text-gray-800 uppercase tracking-wider">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-5 px-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ProductSortFilterProps {
  hideBrandFilter?: boolean;
}

export const ProductSortFilter: React.FC<ProductSortFilterProps> = ({ hideBrandFilter = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();

  const categories = categoriesData || [];
  const brands = (brandsData?.items || (Array.isArray(brandsData) ? brandsData : [])) as BrandRead[];

  // Current filter state from URL
  const currentSort = searchParams.get('sort_by') || 'newest';
  const currentCategoryId = searchParams.get('category_id') || '';
  const currentBrandId = searchParams.get('brand_id') || '';
  const currentPriceMin = searchParams.get('price_min') || '';
  const currentPriceMax = searchParams.get('price_max') || '';
  const currentIsNew = searchParams.get('is_new') || '';
  const currentIsFeatured = searchParams.get('is_featured') || '';
  const currentRatingMin = searchParams.get('rating_min') || '';

  // Local state for price inputs (debounced)
  const [priceMin, setPriceMin] = useState(currentPriceMin);
  const [priceMax, setPriceMax] = useState(currentPriceMax);
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => {
    setPriceMin(currentPriceMin);
    setPriceMax(currentPriceMax);
  }, [currentPriceMin, currentPriceMax]);

  const updateFilter = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter('sort_by', e.target.value);
  };

  const handleCategoryChange = (categoryId: string) => {
    updateFilter('category_id', categoryId === currentCategoryId ? '' : categoryId);
  };

  const handleBrandChange = (brandId: string) => {
    updateFilter('brand_id', brandId === currentBrandId ? '' : brandId);
  };

  const handlePriceApply = () => {
    const newParams = new URLSearchParams(searchParams);
    if (priceMin) newParams.set('price_min', priceMin); else newParams.delete('price_min');
    if (priceMax) newParams.set('price_max', priceMax); else newParams.delete('price_max');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleToggleFilter = (key: string, currentValue: string) => {
    updateFilter(key, currentValue === 'true' ? '' : 'true');
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setPriceMin('');
    setPriceMax('');
    setBrandSearch('');
  };

  const hasActiveFilters = currentCategoryId || currentBrandId || currentPriceMin || currentPriceMax || currentIsNew || currentIsFeatured || currentRatingMin;

  // Build category tree
  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  // Filter brands by search
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const priceRanges = [
    { label: 'Dưới 200K', min: '', max: '200000' },
    { label: '200K - 500K', min: '200000', max: '500000' },
    { label: '500K - 1 Triệu', min: '500000', max: '1000000' },
    { label: '1 Triệu - 3 Triệu', min: '1000000', max: '3000000' },
    { label: 'Trên 3 Triệu', min: '3000000', max: '' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="font-bold text-[15px] flex items-center gap-2.5 text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          Bộ lọc sản phẩm
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={12} />
            Xóa lọc
          </button>
        )}
      </div>

      <div className="px-5">
        {/* Sort Section */}
        <FilterSection title="Sắp xếp">
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block p-3 outline-none font-medium transition-all cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px', paddingRight: '36px' }}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp → Cao</option>
            <option value="price_desc">Giá: Cao → Thấp</option>
            <option value="featured">Nổi bật nhất</option>
          </select>
        </FilterSection>

        {/* Category Filter */}
        <FilterSection title="Danh mục">
          <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar">
            {parentCategories.map(cat => {
              const children = getChildren(cat.id);
              const isActive = currentCategoryId === cat.id;

              return (
                <div key={cat.id}>
                  <button
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {children.length > 0 && (
                      <span className="text-[10px] bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded-md font-bold ml-2 shrink-0">
                        {children.length}
                      </span>
                    )}
                  </button>
                  {children.length > 0 && (
                    <div className="ml-3 pl-3 border-l-2 border-gray-100 mt-1 space-y-0.5">
                      {children.map(child => {
                        const isChildActive = currentCategoryId === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleCategoryChange(child.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                              isChildActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            {child.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FilterSection>

        {/* Price Filter */}
        <FilterSection title="Khoảng giá">
          <div className="space-y-2">
            {priceRanges.map((range, idx) => {
              const isActive = currentPriceMin === range.min && currentPriceMax === range.max;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isActive) {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('price_min');
                      newParams.delete('price_max');
                      newParams.set('page', '1');
                      setSearchParams(newParams);
                      setPriceMin('');
                      setPriceMax('');
                    } else {
                      const newParams = new URLSearchParams(searchParams);
                      if (range.min) newParams.set('price_min', range.min); else newParams.delete('price_min');
                      if (range.max) newParams.set('price_max', range.max); else newParams.delete('price_max');
                      newParams.set('page', '1');
                      setSearchParams(newParams);
                      setPriceMin(range.min);
                      setPriceMax(range.max);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isActive ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {isActive && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                  {range.label}
                </button>
              );
            })}

            {/* Custom Price Range */}
            <div className="pt-3 mt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2.5">Tùy chỉnh</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  placeholder="Từ"
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-gray-300 font-bold text-lg">–</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  placeholder="Đến"
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                onClick={handlePriceApply}
                className="w-full mt-2.5 py-2.5 bg-primary/10 text-primary text-[12px] font-bold rounded-xl hover:bg-primary/20 transition-all uppercase tracking-wider"
              >
                Áp dụng giá
              </button>
            </div>
          </div>
        </FilterSection>

        {/* Brand Filter */}
        {!hideBrandFilter && brands.length > 0 && (
          <FilterSection title="Thương hiệu">
            {brands.length > 5 && (
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={e => setBrandSearch(e.target.value)}
                  placeholder="Tìm thương hiệu..."
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            )}
            <div className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar">
              {filteredBrands.map((brand) => {
                const isActive = currentBrandId === brand.id;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandChange(brand.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      isActive ? 'border-primary bg-primary' : 'border-gray-300'
                    }`}>
                      {isActive && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{brand.name}</span>
                  </button>
                );
              })}
              {filteredBrands.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">Không tìm thấy</p>
              )}
            </div>
          </FilterSection>
        )}

        {/* Rating Filter */}
        <FilterSection title="Đánh giá" defaultOpen={true}>
          <div className="space-y-1.5">
            {[5, 4, 3, 2].map((stars) => {
              const isActive = currentRatingMin === stars.toString();
              return (
                <button
                  key={stars}
                  onClick={() => updateFilter('rating_min', isActive ? '' : stars.toString())}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isActive ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {isActive && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < stars ? '#fbbf24' : 'none'}
                          className={i < stars ? 'text-amber-400' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                    {stars < 5 && <span className="text-xs text-gray-400 font-medium ml-1">trở lên</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Status Filters */}
        <FilterSection title="Trạng thái" defaultOpen={false}>
          <div className="space-y-2">
            <button
              onClick={() => handleToggleFilter('is_new', currentIsNew)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                currentIsNew === 'true'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                currentIsNew === 'true' ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {currentIsNew === 'true' && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              Sản phẩm mới
            </button>
            <button
              onClick={() => handleToggleFilter('is_featured', currentIsFeatured)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                currentIsFeatured === 'true'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                currentIsFeatured === 'true' ? 'border-primary bg-primary' : 'border-gray-300'
              }`}>
                {currentIsFeatured === 'true' && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              Sản phẩm nổi bật
            </button>
          </div>
        </FilterSection>
      </div>
    </div>
  );
};
