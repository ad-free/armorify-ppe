import React, { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategories, useBrands } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/Primitives';
import { clearCatalogFilters, updateCatalogParams } from './catalogState';

interface ProductSortFilterProps {
  hideBrandFilter?: boolean;
  hideCategoryFilter?: boolean;
}

export const ProductSortFilter: React.FC<ProductSortFilterProps> = ({ hideBrandFilter = false, hideCategoryFilter = false }) => {
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const brands = useBrands();
  const id = useId();
  const currentMin = params.get('price_min') || '';
  const currentMax = params.get('price_max') || '';
  const [min, setMin] = useState(currentMin);
  const [max, setMax] = useState(currentMax);
  const [priceError, setPriceError] = useState('');
  useEffect(() => { setMin(currentMin); setMax(currentMax); setPriceError(''); }, [currentMin, currentMax]);
  const update = (key: string, value: string) => setParams(updateCatalogParams(params, { [key]: value }));

  return (
    <div className="card space-y-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Bộ lọc sản phẩm</h2>
        <Button variant="ghost" onClick={() => { setParams(clearCatalogFilters(params)); setMin(''); setMax(''); setPriceError(''); }}>Xóa bộ lọc</Button>
      </div>
      {!hideCategoryFilter && <div>
        <label className="field-label" htmlFor={`${id}-category`}>Danh mục</label>
        {categories.isLoading ? <p role="status" className="text-caption">Đang tải danh mục…</p> : categories.isError ?
          <div role="alert"><p className="text-caption">Không tải được danh mục.</p><Button variant="secondary" onClick={() => categories.refetch()}>Thử lại danh mục</Button></div> :
          <select id={`${id}-category`} className="field" value={params.get('category_id') || ''} onChange={event => update('category_id', event.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categories.data?.map(category => <option key={category.id} value={category.id}>{category.parent_id ? '— ' : ''}{category.name}</option>)}
          </select>}
      </div>}
      {!hideBrandFilter && <div>
        <label className="field-label" htmlFor={`${id}-brand`}>Thương hiệu</label>
        {brands.isLoading ? <p role="status" className="text-caption">Đang tải thương hiệu…</p> : brands.isError ?
          <div role="alert"><p className="text-caption">Không tải được thương hiệu.</p><Button variant="secondary" onClick={() => brands.refetch()}>Thử lại thương hiệu</Button></div> :
          <select id={`${id}-brand`} className="field" value={params.get('brand_id') || ''} onChange={event => update('brand_id', event.target.value)}>
            <option value="">Tất cả thương hiệu</option>
            {brands.data?.items.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </select>}
      </div>}
      <form onSubmit={event => {
        event.preventDefault();
        const invalid = [min, max].some(value => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0));
        if (invalid || (min !== '' && max !== '' && Number(min) > Number(max))) {
          setPriceError('Giá phải từ 0; giá tối đa không nhỏ hơn giá tối thiểu.');
          return;
        }
        setPriceError('');
        setParams(updateCatalogParams(params, { price_min: min, price_max: max }));
      }}>
        <fieldset>
          <legend className="field-label">Khoảng giá (₫)</legend>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor={`${id}-min`} className="field-label">Từ</label><input id={`${id}-min`} type="number" min="0" step="any" className="field" value={min} onChange={event => setMin(event.target.value)} aria-invalid={!!priceError} aria-describedby={priceError ? `${id}-price-error` : undefined} /></div>
            <div><label htmlFor={`${id}-max`} className="field-label">Đến</label><input id={`${id}-max`} type="number" min="0" step="any" className="field" value={max} onChange={event => setMax(event.target.value)} aria-invalid={!!priceError} aria-describedby={priceError ? `${id}-price-error` : undefined} /></div>
          </div>
          {priceError && <p id={`${id}-price-error`} role="alert" className="field-error">{priceError}</p>}
          <Button type="submit" variant="secondary" className="mt-3 w-full">Áp dụng giá</Button>
        </fieldset>
      </form>
      <div>
        <label htmlFor={`${id}-rating`} className="field-label">Đánh giá khách hàng</label>
        <select id={`${id}-rating`} className="field" value={params.get('rating_min') || ''} onChange={event => update('rating_min', event.target.value)}>
          <option value="">Tất cả đánh giá</option>
          {[5, 4, 3, 2].map(value => <option key={value} value={value}>{value} sao trở lên</option>)}
        </select>
      </div>
      <fieldset className="space-y-1">
        <legend className="field-label">Lựa chọn khác</legend>
        {([['is_new', 'Sản phẩm mới'], ['is_featured', 'Sản phẩm nổi bật']] as const).map(([key, label]) =>
          <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="h-5 w-5 shrink-0" checked={params.get(key) === 'true'} onChange={event => update(key, event.target.checked ? 'true' : '')} />{label}
          </label>)}
      </fieldset>
    </div>
  );
};
