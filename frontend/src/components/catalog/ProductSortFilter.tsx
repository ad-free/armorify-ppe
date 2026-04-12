// src/components/catalog/ProductSortFilter.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';

interface ProductSortFilterProps {
  hideBrandFilter?: boolean;
}

export const ProductSortFilter: React.FC<ProductSortFilterProps> = ({ hideBrandFilter = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentSort = searchParams.get('sort_by') || 'newest';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    searchParams.set('sort_by', newSort);
    searchParams.set('page', '1'); // Reset pagination on sort
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 sticky top-24 shadow-sm">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Bộ lọc & Sắp xếp
      </h3>
      
      <div className="space-y-6">
        {/* Sort Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
          <select 
            value={currentSort}
            onChange={handleSortChange}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá từ thấp đến cao</option>
            <option value="price_desc">Giá từ cao đến thấp</option>
            <option value="rating_desc">Đánh giá tốt nhất</option>
          </select>
        </div>

        {/* Example Static Price Filter */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">Khoảng giá</label>
          <div className="space-y-2">
            {['100k - 500k', '500k - 1 Triệu', 'Trên 1 Triệu'].map((label, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-primary transition-colors">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filter Apply button placeholder (for a real implementation) */}
        {!hideBrandFilter && (
          <button className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary/90 transition-colors mt-4">
            Áp dụng
          </button>
        )}
      </div>
    </div>
  );
};
