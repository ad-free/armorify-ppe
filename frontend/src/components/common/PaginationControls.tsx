import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Primitives';

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
    onPageChange?.((page - 1) * limit);
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const pages = useMemo(() => {
    const result: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page++) result.push(page);
    } else {
      result.push(1);
      if (currentPage > 3) result.push('…');
      for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page++) result.push(page);
      if (currentPage < totalPages - 2) result.push('…');
      result.push(totalPages);
    }
    return result;
  }, [currentPage, totalPages]);
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang sản phẩm" className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
      <p className="text-caption">Hiển thị {skip + 1}–{Math.min(skip + limit, total)} trong {total}</p>
      <div className="flex max-w-full flex-wrap items-center gap-1">
        <Button variant="secondary" className="btn-icon" onClick={() => handlePage(currentPage - 1)} disabled={currentPage <= 1} aria-label="Trang trước"><ChevronLeft size={18} aria-hidden="true" /></Button>
        <span className="px-3 text-sm sm:hidden">Trang {currentPage} / {totalPages}</span>
        <div className="hidden flex-wrap gap-1 sm:flex">
          {pages.map((page, index) => typeof page === 'number'
            ? <Button key={index} variant={page === currentPage ? 'primary' : 'secondary'} className="btn-icon" aria-label={`Trang ${page}`} aria-current={page === currentPage ? 'page' : undefined} onClick={() => handlePage(page)}>{page}</Button>
            : <span key={index} aria-hidden="true" className="flex min-h-11 items-center px-2">{page}</span>)}
        </div>
        <Button variant="secondary" className="btn-icon" onClick={() => handlePage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Trang sau"><ChevronRight size={18} aria-hidden="true" /></Button>
      </div>
    </nav>
  );
};
