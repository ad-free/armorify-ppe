// src/components/common/PaginationControls.tsx
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    if (totalPages <= 5) {
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
    <div className="flex justify-center items-center gap-2 mt-8">
      {/* Mobile view */}
      <span className="md:hidden text-sm text-muted-foreground mr-4">
        Trang {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => handlePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center justify-center w-10 h-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Desktop view */}
      <div className="hidden md:flex gap-2">
        {pages.map((p, idx) => (
          <button
            key={idx}
            onClick={() => typeof p === 'number' && handlePage(p)}
            disabled={p === '...'}
            className={`w-10 h-10 flex items-center justify-center rounded-md border ${
              p === currentPage 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'hover:bg-gray-50'
            } ${p === '...' ? 'border-transparent hover:bg-transparent cursor-default' : ''}`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => handlePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 flex items-center justify-center w-10 h-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
