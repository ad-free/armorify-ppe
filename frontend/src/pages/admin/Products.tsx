import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';
import { catalogOptions, listProducts } from '@/api/admin/catalog';
import type { CatalogProduct } from '@/api/admin/catalog';
import { readCatalogParams, updateCatalogParams, catalogSorts } from './catalogWorkflow';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const { page, limit, request } = readCatalogParams(params);
  const [search, setSearch] = useState(params.get('q') || '');
  const urlSearch = params.get('q') || '';
  useEffect(() => { setSearch(urlSearch); }, [urlSearch]);
  const query = useQuery({ queryKey: ['admin-products', request], queryFn: ({ signal }) => listProducts(request, signal), retry: false });
  const categories = useQuery({ queryKey: ['admin-catalog-categories'], queryFn: ({ signal }) => catalogOptions('categories', signal) });
  const brands = useQuery({ queryKey: ['admin-catalog-brands'], queryFn: ({ signal }) => catalogOptions('brands', signal) });
  const change = (key: string, value: string) => setParams(updateCatalogParams(params, key, value));
  const sorts: Record<string, string> = { newest: 'Mới nhất', name_asc: 'Tên A–Z', name_desc: 'Tên Z–A', price_asc: 'Giá tăng', price_desc: 'Giá giảm', stock_asc: 'Tồn kho tăng' };
  return <AdminLayout title="Danh mục sản phẩm" subtitle="Quản lý nội dung, biến thể và tồn kho có lịch sử kiểm toán.">
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap justify-between gap-3"><p className="text-body">{query.data ? `${query.data.total} sản phẩm` : 'Danh sách sản phẩm'}</p><Link className="btn btn-primary" to={`/admin/products/new?${params}`}>Thêm sản phẩm</Link></div>
      <div className="card p-4 space-y-4">
        <form role="search" className="flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); change('q', search); }}><label className="min-w-0 flex-1"><span className="field-label">Tìm theo tên / SKU</span><input className="field" type="search" maxLength={255} value={search} onChange={event => setSearch(event.target.value)} /></label><Button className="self-end" type="submit">Tìm kiếm</Button></form>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(['category_id', 'brand_id'] as const).map(key => <label key={key}><span className="field-label">{key === 'category_id' ? 'Danh mục' : 'Thương hiệu'}</span><select className="field" value={params.get(key) || ''} onChange={event => change(key, event.target.value)}><option value="">Tất cả</option>{(key === 'category_id' ? categories.data : brands.data)?.map(item => <option key={item.id} value={item.id}>{item.name}{!item.is_active ? ' (ẩn)' : ''}</option>)}</select></label>)}
          {(['is_active', 'is_featured', 'is_new', 'low_stock'] as const).map(key => <label key={key}><span className="field-label">{{ is_active: 'Đang hiển thị', is_featured: 'Nổi bật', is_new: 'Sản phẩm mới', low_stock: 'Tồn kho dưới 10' }[key]}</span><select className="field" value={params.get(key) || ''} onChange={event => change(key, event.target.value)}><option value="">Tất cả</option><option value="true">Có</option><option value="false">Không</option></select></label>)}
          <label><span className="field-label">Biến thể</span><select className="field" value={params.get('variant_mode') || ''} onChange={event => change('variant_mode', event.target.value)}><option value="">Tất cả</option><option value="with">Có biến thể</option><option value="without">Không biến thể</option></select></label>
          <label><span className="field-label">Sắp xếp</span><select className="field" value={String(request.sort_by)} onChange={event => change('sort_by', event.target.value)}>{catalogSorts.map(sort => <option key={sort} value={sort}>{sorts[sort]}</option>)}</select></label>
        </div>
        <Button variant="ghost" onClick={() => { setParams({}); setSearch(''); }}>Xóa bộ lọc</Button>
        {(categories.isError || brands.isError) && <p role="alert">Không tải được danh mục / thương hiệu. <Button variant="secondary" onClick={() => { void categories.refetch(); void brands.refetch(); }}>Thử lại</Button></p>}
      </div>
      {query.isPending && <div role="status" aria-label="Đang tải sản phẩm"><Skeleton className="h-48" /></div>}
      {query.isError && <FeedbackState variant="error" title="Không tải được sản phẩm"><Button onClick={() => void query.refetch()}>Thử lại</Button></FeedbackState>}
      {query.data && !query.data.items.length && <FeedbackState title={query.data.total ? 'Trang này không có sản phẩm' : params.size ? 'Không có kết quả phù hợp' : 'Chưa có sản phẩm'} description="Thay đổi bộ lọc hoặc thêm sản phẩm mới." />}
      {!!query.data?.items.length && <>
        <div className="grid gap-4 lg:hidden">{query.data.items.map(product => <article key={product.id} className="card p-4 space-y-3"><h2 className="font-semibold break-words">{product.name}</h2><ProductStates product={product} /><div className="flex flex-wrap gap-2"><span className={`badge ${product.available_stock < 10 ? 'badge-warning' : 'badge-neutral'}`}>Tồn: {product.available_stock}</span><span className="badge badge-neutral">{product.has_variants ? 'Có biến thể' : 'Không biến thể'}</span></div><p>{Number(product.price).toLocaleString('vi-VN')} đ</p><Link className="btn btn-secondary" to={`/admin/products/${product.id}?${params}`}>Chỉnh sửa</Link></article>)}</div>
        <div className="table-shell hidden lg:block"><table className="w-full text-sm"><caption className="sr-only">Sản phẩm trong danh mục</caption><thead className="bg-muted"><tr>{['Sản phẩm', 'Giá', 'Tồn khả dụng', 'Trạng thái', 'Thao tác'].map(label => <th key={label} className="p-4 text-left">{label}</th>)}</tr></thead><tbody>{query.data.items.map(product => <tr key={product.id} className="border-t border-border"><td className="p-4 max-w-xs break-words"><p className="font-semibold">{product.name}</p><p className="text-caption">{product.has_variants ? 'Có biến thể' : 'Không biến thể'}</p></td><td className="p-4">{Number(product.price).toLocaleString('vi-VN')} đ</td><td className="p-4"><span className={`badge ${product.available_stock < 10 ? 'badge-warning' : 'badge-neutral'}`}>{product.available_stock}</span></td><td className="p-4 max-w-xs"><ProductStates product={product} /></td><td className="p-4"><Link className="btn btn-secondary" to={`/admin/products/${product.id}?${params}`}>Chỉnh sửa</Link></td></tr>)}</tbody></table></div>
      </>}
      {query.data && <nav aria-label="Phân trang sản phẩm" className="flex flex-wrap items-center gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => change('page', String(page - 1))}>Trước</Button><span>Trang {page} / {Math.max(1, Math.ceil(query.data.total / limit))}</span><Button variant="secondary" disabled={page * limit >= query.data.total} onClick={() => change('page', String(page + 1))}>Sau</Button><label className="flex items-center gap-2">Số dòng<select className="field w-auto" value={limit} onChange={event => change('limit', event.target.value)}>{[20, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label></nav>}
    </div>
  </AdminLayout>;
}

function ProductStates({ product }: { product: CatalogProduct }) {
  return <div className="flex flex-wrap gap-2">
    <span className={`badge ${product.is_active ? 'badge-success' : 'badge-neutral'}`}>{product.is_active ? 'Hiển thị' : 'Ẩn / Nháp'}</span>
    {product.is_featured && <span className="badge badge-success">Nổi bật</span>}
    {product.is_new && <span className="badge badge-neutral">Mới</span>}
    <span className="badge badge-neutral">{product.cover_image_url ? 'Có ảnh bìa' : 'Chưa có ảnh bìa'}</span>
  </div>;
}
