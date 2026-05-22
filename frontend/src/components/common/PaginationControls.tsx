// src/components/common/PaginationControls.tsx
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Props {
  total: number;
  skip: number;
  limit: number;
  onPageChange?: (skip: number) => void;
}

export const PaginationControls: React.FC<Props> = ({ total, skip, limit, onPageChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const startItem = skip + 1;
  const endItem = Math.min(skip + limit, total);

  const handlePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const newSkip = (page - 1) * limit;

    if (onPageChange) {
      onPageChange(newSkip);
    }

    // Update URL syncing
    searchParams.set('page', page.toString());
    setSearchParams(searchParams);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pages = useMemo(() => {
    const list: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) list.push(i);
    } else {
      list.push(1);
      if (currentPage > 3) list.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        list.push(i);
      }

      if (currentPage < totalPages - 2) list.push('...');
      list.push(totalPages);
    }
    return list;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
      {/* Results info */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        Hiển thị <span className="font-semibold text-gray-700">{startItem}-{endItem}</span> trong{' '}
        <span className="font-semibold text-gray-700">{total}</span> sản phẩm
      </p>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* First page */}
        <button
          onClick={() => handlePage(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous */}
        <button
          onClick={() => handlePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex w-9 h-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Mobile indicator */}
        <span className="sm:hidden text-sm text-gray-500 font-medium px-3">
          {currentPage} / {totalPages}
        </span>

        {/* Page numbers (desktop) */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => (
            <button
              key={idx}
              onClick={() => typeof p === 'number' && handlePage(p)}
              disabled={p === '...'}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                p === currentPage
                  ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                  : p === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => handlePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex w-9 h-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePage(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
