import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/common/SeoHead';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';
import { useActiveFlashSale, useBrands, useCategories, useProducts } from '@/hooks/useCatalog';

const HomePage: React.FC = () => {
  const categories = useCategories();
  const featured = useProducts({ is_featured: true, limit: 8 });
  const brands = useBrands();
  const flash = useActiveFlashSale();
  const [now, setNow] = useState(Date.now);
  const flashEnd = flash.data ? new Date(flash.data.end_at).getTime() : 0;
  const flashStart = flash.data ? new Date(flash.data.start_at).getTime() : 0;
  const activeFlash = flash.data?.is_active && flashStart <= now && flashEnd > now ? flash.data : null;
  // The catalog API uses this 404 detail for an empty campaign slot.
  const noActiveFlash = flash.error instanceof Error && flash.error.message === 'No active flash sale found';

  useEffect(() => {
    setNow(Date.now());
    if (!flashEnd || flashEnd <= Date.now()) return;
    const timer = window.setTimeout(() => {
      setNow(Date.now());
      void flash.refetch();
    }, Math.min(flashEnd - Date.now(), 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [flashEnd, flash.refetch]);

  return (
    <div className="min-w-0 break-words bg-background text-foreground">
      <SeoHead
        title="NBE Hoang Duy | Thiết bị bảo hộ lao động"
        description="Khám phá thiết bị bảo hộ lao động theo danh mục và thương hiệu. Liên hệ NBE Hoang Duy để yêu cầu báo giá cho doanh nghiệp."
      />

      <section className="border-b border-border bg-surface" aria-labelledby="home-heading">
        <div className="container py-12 md:py-16">
          <p className="mb-3 text-sm font-semibold text-primary">NBE Hoang Duy</p>
          <h1 id="home-heading" className="page-heading max-w-3xl">Tìm thiết bị bảo hộ phù hợp với công việc của bạn</h1>
          <p className="text-body mt-4 max-w-2xl">Khám phá sản phẩm theo danh mục, thương hiệu hoặc gửi yêu cầu báo giá cho nhu cầu mua sắm của doanh nghiệp.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/categories" className="btn btn-primary">Xem sản phẩm</Link>
            <a href={`mailto:info@nbehoangduy.vn?subject=${encodeURIComponent('Yêu cầu báo giá thiết bị bảo hộ')}`} className="btn btn-secondary">Yêu cầu báo giá</a>
          </div>
        </div>
      </section>

      <div className="container space-y-12 py-10 md:space-y-16 md:py-12">
        <section aria-labelledby="home-categories">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 id="home-categories" className="section-heading">Mua sắm theo danh mục</h2>
            <Link to="/categories" className="btn btn-ghost">Tất cả sản phẩm</Link>
          </div>
          {categories.isLoading ? (
            <div role="status" aria-label="Đang tải danh mục" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-20" />)}
            </div>
          ) : categories.isError ? (
            <FeedbackState variant="error" title="Không thể tải danh mục" description="Vui lòng thử tải lại danh mục.">
              <Button variant="secondary" loading={categories.isFetching} onClick={() => void categories.refetch()}>Thử lại</Button>
            </FeedbackState>
          ) : !categories.data?.length ? (
            <FeedbackState title="Chưa có danh mục" description="Bạn có thể xem toàn bộ sản phẩm hoặc tải lại danh mục.">
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/categories" className="btn btn-primary">Xem sản phẩm</Link>
                <Button variant="secondary" loading={categories.isFetching} onClick={() => void categories.refetch()}>Tải lại</Button>
              </div>
            </FeedbackState>
          ) : (
            <nav aria-label="Danh mục sản phẩm">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.data.map(category => (
                  <li key={category.id} className="min-w-0">
                    <Link to={`/categories/${encodeURIComponent(category.slug)}`} className="card flex min-h-11 h-full items-center p-5 font-semibold hover:border-primary hover:text-primary">{category.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </section>

        <section aria-labelledby="home-featured">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 id="home-featured" className="section-heading">Sản phẩm nổi bật</h2>
              <p className="text-body mt-2">Các sản phẩm được chọn giới thiệu trong danh mục.</p>
            </div>
            <Link to="/categories?is_featured=true" className="btn btn-ghost">Xem tất cả sản phẩm nổi bật</Link>
          </div>
          {featured.isError ? (
            <FeedbackState variant="error" title="Không thể tải sản phẩm nổi bật" description="Vui lòng thử tải lại sản phẩm.">
              <Button variant="secondary" loading={featured.isFetching} onClick={() => void featured.refetch()}>Thử lại</Button>
            </FeedbackState>
          ) : !featured.isLoading && !featured.data?.items.length ? (
            <FeedbackState title="Chưa có sản phẩm nổi bật" description="Khám phá toàn bộ danh mục để tìm sản phẩm phù hợp.">
              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/categories" className="btn btn-primary">Xem sản phẩm</Link>
                <Button variant="secondary" loading={featured.isFetching} onClick={() => void featured.refetch()}>Tải lại</Button>
              </div>
            </FeedbackState>
          ) : <ProductGrid products={featured.data?.items ?? []} loading={featured.isLoading} />}
        </section>

        <section aria-labelledby="home-brands">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 id="home-brands" className="section-heading">Khám phá thương hiệu</h2>
            <Link to="/brand" className="btn btn-ghost">Tất cả thương hiệu</Link>
          </div>
          {brands.isLoading ? (
            <div role="status" aria-label="Đang tải thương hiệu" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-16" />)}
            </div>
          ) : brands.isError ? (
            <FeedbackState variant="error" title="Không thể tải thương hiệu" description="Vui lòng thử tải lại thương hiệu.">
              <Button variant="secondary" loading={brands.isFetching} onClick={() => void brands.refetch()}>Thử lại</Button>
            </FeedbackState>
          ) : !brands.data?.items.length ? (
            <FeedbackState title="Chưa có thương hiệu" description="Thông tin thương hiệu sẽ hiển thị khi có dữ liệu.">
              <Button variant="secondary" loading={brands.isFetching} onClick={() => void brands.refetch()}>Tải lại</Button>
            </FeedbackState>
          ) : (
            <nav aria-label="Thương hiệu sản phẩm">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {brands.data.items.map(brand => (
                  <li key={brand.id} className="min-w-0">
                    <Link to={`/brand/${encodeURIComponent(brand.slug)}`} className="card flex min-h-11 h-full items-center p-5 font-semibold hover:border-primary hover:text-primary">{brand.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </section>

        {(flash.isLoading || (flash.isError && !noActiveFlash) || activeFlash) && (
          <section aria-labelledby="home-promotions">
            <h2 id="home-promotions" className="section-heading mb-6">Chương trình đang diễn ra</h2>
            {flash.isLoading ? (
              <div role="status" aria-label="Đang kiểm tra chương trình" className="space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-32" />
              </div>
            ) : flash.isError ? (
              <FeedbackState variant="error" title="Không thể tải chương trình" description="Vui lòng thử lại để kiểm tra chương trình đang diễn ra.">
                <Button variant="secondary" loading={flash.isFetching} onClick={() => void flash.refetch()}>Thử lại</Button>
              </FeedbackState>
            ) : activeFlash && (
              <>
                <h3 className="mb-2 text-lg font-semibold">{activeFlash.name}</h3>
                <p className="text-body mb-6">Kết thúc: {new Date(activeFlash.end_at).toLocaleString('vi-VN')}</p>
                {activeFlash.products?.length ? <ProductGrid products={activeFlash.products} /> : (
                  <FeedbackState title="Chưa có sản phẩm trong chương trình" description="Vui lòng tải lại để cập nhật sản phẩm.">
                    <Button variant="secondary" loading={flash.isFetching} onClick={() => void flash.refetch()}>Tải lại</Button>
                  </FeedbackState>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
