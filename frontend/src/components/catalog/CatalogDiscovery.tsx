import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { PaginationControls } from '@/components/common/PaginationControls';
import { Button, FeedbackState } from '@/components/ui/Primitives';
import { useBrands, useCategories, useProducts } from '@/hooks/useCatalog';
import { ProductGrid } from './ProductGrid';
import { ProductSortFilter } from './ProductSortFilter';
import { clearCatalogFilters, filterKeys, readCatalogState, sortOptions, updateCatalogParams } from './catalogState';

interface CatalogDiscoveryProps { mode: 'category' | 'search' | 'brand'; }

export const CatalogDiscovery: React.FC<CatalogDiscoveryProps> = ({ mode }) => {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const brands = useBrands();
  const category = mode === 'category' && slug ? categories.data?.find(item => item.slug === slug) : undefined;
  const brand = mode === 'brand' ? brands.data?.items.find(item => item.slug === slug) : undefined;
  const scopeQuery = mode === 'brand' ? brands : categories;
  const scoped = mode === 'brand' || (mode === 'category' && !!slug);
  const scopePending = scoped && scopeQuery.isLoading;
  const scopeError = scoped && scopeQuery.isError;
  const missingScope = scoped && !scopePending && !scopeError && !(category || brand);
  const { page, limit, request, error } = readCatalogState(params);
  const query = request.q || '';
  const searchEmpty = mode === 'search' && !query;
  const products = useProducts({
    ...request,
    category_id: category?.id || request.category_id,
    brand_id: brand?.id || request.brand_id,
  }, { enabled: !scopePending && !scopeError && !missingScope && !searchEmpty && !error });
  const title = mode === 'search' ? query ? `Kết quả cho “${query}”` : 'Tìm sản phẩm bảo hộ'
    : brand?.name || category?.name || (scoped ? 'Sản phẩm' : 'Tất cả sản phẩm');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
    if (drawerOpen) {
      const overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = overflow; };
    }
  }, [drawerOpen]);
  useEffect(() => { setDrawerOpen(false); }, [mode, slug]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const close = () => { if (desktop.matches) setDrawerOpen(false); };
    desktop.addEventListener('change', close);
    return () => desktop.removeEventListener('change', close);
  }, []);
  useEffect(() => {
    if (!products.data || products.isFetching || products.isError || error || missingScope || searchEmpty) return;
    const lastPage = Math.max(1, Math.ceil(products.data.total / limit));
    if (page > lastPage) {
      const next = new URLSearchParams(params);
      next.set('page', String(lastPage));
      setParams(next, { replace: true });
    }
  }, [products.data, products.isFetching, products.isError, error, missingScope, searchEmpty, page, limit, params, setParams]);

  const active = filterKeys.filter(key => {
    if (key === 'is_new' || key === 'is_featured') return params.get(key) === 'true';
    return !!params.get(key) && !(key === 'category_id' && category) && !(key === 'brand_id' && brand);
  });
  const clear = () => setParams(clearCatalogFilters(params));
  const chipLabel = (key: typeof filterKeys[number]) => {
    const value = params.get(key)!;
    switch (key) {
      case 'category_id': return `Danh mục: ${categories.data?.find(item => item.id === value)?.name || 'Đã chọn'}`;
      case 'brand_id': return `Thương hiệu: ${brands.data?.items.find(item => item.id === value)?.name || 'Đã chọn'}`;
      case 'price_min': return `Giá từ: ${Number(value).toLocaleString('vi-VN')} ₫`;
      case 'price_max': return `Giá đến: ${Number(value).toLocaleString('vi-VN')} ₫`;
      case 'rating_min': return `Đánh giá từ ${value} sao`;
      case 'is_new': return 'Sản phẩm mới';
      case 'is_featured': return 'Sản phẩm nổi bật';
    }
  };
  const busy = scopePending || (!searchEmpty && !error && !missingScope && !scopeError && products.isLoading);
  const validResults = !busy && !scopeError && !missingScope && !searchEmpty && !error && !products.isError && products.data;
  const filterProps = { hideBrandFilter: !!brand, hideCategoryFilter: !!category };
  const resultText = validResults ? `${products.data!.total} sản phẩm` : busy ? 'Đang tải sản phẩm…' : 'Chưa có kết quả';

  return (
    <div className="min-w-0 bg-background pb-12">
      <SeoHead title={`${title} | NBE Hoang Duy`} description="Tìm thiết bị bảo hộ theo danh mục, thương hiệu và khoảng giá. Xem thông tin sản phẩm trước khi lựa chọn." />
      <header className="border-b border-border bg-surface">
        <div className="container py-6 md:py-8">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Sản phẩm', href: '/categories' }, ...(mode === 'brand' ? [{ label: 'Thương hiệu', href: '/brand' }] : [])]} />
          <h1 className="page-heading mt-4">{title}</h1>
          <p className="text-body mt-2 max-w-2xl">{brand?.description || 'Chọn thiết bị phù hợp bằng danh mục, thương hiệu và thông tin bảo hộ được cung cấp.'}</p>
          {brand?.country_of_origin && <p className="text-caption mt-2">Xuất xứ thương hiệu: {brand.country_of_origin}</p>}
          {scoped && <Link to="/categories" className="btn btn-ghost mt-3">Xem tất cả sản phẩm</Link>}
          {mode === 'search' && <form role="search" className="mt-4 flex max-w-2xl flex-wrap items-end gap-3" onSubmit={event => {
            event.preventDefault();
            const value = String(new FormData(event.currentTarget).get('q') || '').trim();
            setParams(updateCatalogParams(params, { q: value }));
          }}>
            <div className="min-w-0 flex-1 basis-48"><label htmlFor={`${id}-q`} className="field-label">Tên sản phẩm hoặc từ khóa</label><input key={query} id={`${id}-q`} name="q" type="search" className="field" defaultValue={query} /></div>
            <Button type="submit">Tìm kiếm</Button>
          </form>}
        </div>
      </header>
      <div className="container py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button ref={trigger} variant="secondary" className="lg:hidden" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-controls={`${id}-drawer`} aria-expanded={drawerOpen}>
              <SlidersHorizontal size={18} aria-hidden="true" />Bộ lọc{active.length > 0 && ` (${active.length})`}
            </Button>
            <p role="status" aria-live="polite" className="text-caption">{resultText}{products.isFetching && !busy && validResults ? ' · Đang cập nhật…' : ''}</p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-3">
            <div><label htmlFor={`${id}-sort`} className="field-label">Sắp xếp</label><select id={`${id}-sort`} className="field" value={request.sort_by} onChange={event => setParams(updateCatalogParams(params, { sort_by: event.target.value }))}>
              {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select></div>
            <div><label htmlFor={`${id}-limit`} className="field-label">Mỗi trang</label><select id={`${id}-limit`} className="field" value={limit} onChange={event => setParams(updateCatalogParams(params, { limit: event.target.value }))}>
              {[12, 24, 48].map(value => <option key={value} value={value}>{value}</option>)}
            </select></div>
          </div>
        </div>
        {active.length > 0 && <div aria-label="Bộ lọc đang áp dụng" className="mb-5 flex flex-wrap gap-2">
          {active.map(key => <Button key={key} variant="secondary" className="max-w-full text-left" aria-label={`Bỏ lọc ${chipLabel(key)}`} onClick={() => setParams(updateCatalogParams(params, { [key]: null }))}>
            <span className="min-w-0 break-words">{chipLabel(key)}</span><X size={16} className="shrink-0" aria-hidden="true" />
          </Button>)}
          <Button variant="ghost" onClick={clear}>Xóa tất cả bộ lọc</Button>
        </div>}
        <div className="flex min-w-0 items-start gap-6">
          <aside aria-label="Lọc sản phẩm" className="hidden w-64 shrink-0 lg:block"><ProductSortFilter {...filterProps} /></aside>
          <section aria-label="Kết quả sản phẩm" aria-busy={busy || products.isFetching} className="min-w-0 flex-1 space-y-6">
            {scopeError ? <FeedbackState variant="error" title="Không tải được thông tin danh mục hoặc thương hiệu" description="Vui lòng thử lại để xem đúng sản phẩm."><Button onClick={() => scopeQuery.refetch()}>Thử lại</Button></FeedbackState>
              : missingScope ? <FeedbackState title="Không tìm thấy danh mục hoặc thương hiệu" description="Đường dẫn này không còn khả dụng."><Link to="/categories" className="btn btn-primary">Xem tất cả sản phẩm</Link></FeedbackState>
              : searchEmpty ? <FeedbackState title="Bạn đang tìm thiết bị bảo hộ nào?" description="Nhập tên sản phẩm hoặc từ khóa, hoặc khám phá các danh mục."><Link to="/categories" className="btn btn-primary">Khám phá sản phẩm</Link></FeedbackState>
              : error ? <FeedbackState variant="error" title="Bộ lọc không hợp lệ" description={error}><Button onClick={clear}>Xóa bộ lọc</Button></FeedbackState>
              : products.isError ? <FeedbackState variant="error" title="Không tải được sản phẩm" description="Kiểm tra kết nối và thử lại. Bộ lọc của bạn vẫn được giữ nguyên."><Button onClick={() => products.refetch()}>Thử lại</Button></FeedbackState>
              : validResults && products.data!.items.length === 0 ? <FeedbackState title={query || active.length ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm'} description={query || active.length ? 'Thử từ khóa khác hoặc bỏ bớt bộ lọc.' : 'Danh mục này hiện chưa có sản phẩm để hiển thị.'}>
                {active.length > 0 && <Button onClick={clear}>Xóa bộ lọc</Button>}
                <Link to="/categories" className="btn btn-secondary">Xem tất cả sản phẩm</Link>
              </FeedbackState>
              : <ProductGrid products={products.data?.items || []} loading={busy} columns={3} />}
            {validResults && products.data!.total > limit && <PaginationControls total={products.data!.total} skip={request.skip!} limit={limit} />}
          </section>
        </div>
      </div>
      <dialog ref={drawer} id={`${id}-drawer`} aria-labelledby={`${id}-drawer-title`} onCancel={() => setDrawerOpen(false)} onClose={() => { setDrawerOpen(false); trigger.current?.focus(); }}
        onClick={event => { if (event.target === event.currentTarget) setDrawerOpen(false); }}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled)')).filter(element => element.offsetParent !== null);
          const first = controls[0]; const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        className="fixed inset-y-0 left-0 m-0 h-[100dvh] max-h-none w-80 max-w-[calc(100%-2rem)] border-0 border-r border-border bg-surface p-0 text-foreground backdrop:bg-foreground/40">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border p-4"><h2 id={`${id}-drawer-title`} className="text-lg font-semibold">Lọc sản phẩm</h2><Button variant="ghost" className="btn-icon" aria-label="Đóng bộ lọc" onClick={() => setDrawerOpen(false)}><X size={20} aria-hidden="true" /></Button></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{drawerOpen && <ProductSortFilter {...filterProps} />}</div>
          <div className="shrink-0 border-t border-border p-4"><Button className="w-full" onClick={() => setDrawerOpen(false)}>Xem kết quả · {resultText}</Button></div>
        </div>
      </dialog>
    </div>
  );
};
