import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/common/SeoHead';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';
import { useBrands } from '@/hooks/useCatalog';
import { getMediaUrl } from '@/lib/api';

const BrandsPage = () => {
  const brands = useBrands();
  const items = brands.data?.items.filter(brand => brand.is_active !== false) || [];
  return (
    <div className="min-w-0 bg-background pb-12">
      <SeoHead title="Thương hiệu | NBE Hoang Duy" description="Khám phá thiết bị bảo hộ theo thương hiệu." />
      <header className="border-b border-border bg-surface">
        <div className="container py-6 md:py-8">
          <Breadcrumb items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thương hiệu' }]} />
          <h1 className="page-heading mt-4">Khám phá thương hiệu</h1>
          <p className="text-body mt-2">Chọn thương hiệu để xem sản phẩm và lọc theo nhu cầu của bạn.</p>
        </div>
      </header>
      <div className="container py-6">
        {brands.isLoading ? <div role="status" aria-label="Đang tải thương hiệu" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-48" />)}
        </div> : brands.isError ? <FeedbackState variant="error" title="Không tải được thương hiệu" description="Vui lòng kiểm tra kết nối và thử lại.">
          <Button loading={brands.isFetching} onClick={() => brands.refetch()}>Thử lại</Button>
        </FeedbackState> : items.length === 0 ? <FeedbackState title="Chưa có thương hiệu" description="Bạn vẫn có thể khám phá toàn bộ sản phẩm.">
          <Link to="/categories" className="btn btn-primary">Xem sản phẩm</Link>
        </FeedbackState> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(brand => <li key={brand.id} className="card flex min-w-0 flex-col gap-3 p-5 [overflow-wrap:anywhere]">
            {brand.logo_url && <img src={getMediaUrl(brand.logo_url)} alt="" width={96} height={96} loading="lazy" className="h-24 w-24 object-contain" onError={event => { event.currentTarget.hidden = true; }} />}
            <h2 className="text-xl font-semibold">{brand.name}</h2>
            {brand.country_of_origin && <p className="text-caption">Xuất xứ thương hiệu: {brand.country_of_origin}</p>}
            {brand.description && <p className="text-body">{brand.description}</p>}
            <Link to={`/brand/${encodeURIComponent(brand.slug)}`} className="btn btn-secondary mt-auto" aria-label={`Xem sản phẩm thương hiệu ${brand.name}`}>Xem sản phẩm</Link>
          </li>)}
        </ul>}
      </div>
    </div>
  );
};
export default BrandsPage;
