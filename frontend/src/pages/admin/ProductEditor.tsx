import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useBlocker, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, FeedbackState, Skeleton } from '@/components/ui/Primitives';
import { catalogOptions, getProduct, saveProduct } from '@/api/admin/catalog';
import type { CatalogMetadata } from '@/api/admin/catalog';
import { catalogFailure, specificationPayload } from './catalogWorkflow';
import type { CatalogFailure, SpecificationRow } from './catalogWorkflow';
import { ProductOperations } from './ProductOperations';
import { ProductSpecificationsEditor } from './ProductSpecificationsEditor';

const blank: CatalogMetadata = { name: '', slug: '', description: null, category_id: '', brand_id: null, price: '', dealer_price: null, compare_at_price: null, is_active: false, is_featured: false, is_new: false, specifications: null, cover_image_url: null, video_url: null, seo_title: null, seo_description: null };
const metadataKeys = Object.keys(blank) as (keyof CatalogMetadata)[];
export function CatalogField({ name, label, error, children }: { name: string; label: string; error?: string; children: ReactNode }) {
  return <div className="min-w-0"><label className="field-label" htmlFor={name}>{label}</label>{children}{error && <p id={`${name}-error`} className="field-error">{error}</p>}</div>;
}
export default function ProductEditor() {
  const { productId } = useParams();
  return <Editor key={productId || 'new'} productId={productId} />;
}
function Editor({ productId }: { productId?: string }) {
  const { search } = useLocation(); const navigate = useNavigate(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['admin-product', productId], queryFn: ({ signal }) => getProduct(productId!, signal), enabled: Boolean(productId), retry: false, refetchOnWindowFocus: false });
  const categories = useQuery({ queryKey: ['admin-catalog-categories'], queryFn: ({ signal }) => catalogOptions('categories', signal) });
  const brands = useQuery({ queryKey: ['admin-catalog-brands'], queryFn: ({ signal }) => catalogOptions('brands', signal) });
  const [draft, setDraft] = useState<CatalogMetadata>(blank); const [baseline, setBaseline] = useState(JSON.stringify(blank));
  const [specs, setSpecs] = useState<SpecificationRow[]>([]); const [baselineSpecs, setBaselineSpecs] = useState('[]');
  const [version, setVersion] = useState<number>(); const initialized = useRef(false);
  const [operationDirty, setOperationDirty] = useState(false); const [failure, setFailure] = useState<CatalogFailure | null>(null);
  const [saving, setSaving] = useState(false); const [success, setSuccess] = useState(''); const bypass = useRef(false);
  const dirty = JSON.stringify(draft) !== baseline || JSON.stringify(specs) !== baselineSpecs || operationDirty;
  const blocker = useBlocker(() => dirty && !bypass.current);
  const dialog = useRef<HTMLDialogElement>(null); const focusBefore = useRef<HTMLElement | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!query.data || initialized.current) return;
    const metadata = Object.fromEntries(metadataKeys.map(key => [key, query.data![key]])) as unknown as CatalogMetadata;
    const rows = Object.entries(query.data.specifications ?? {}).map(([key, value]) => ({ key, value }));
    setDraft(metadata); setBaseline(JSON.stringify(metadata)); setSpecs(rows); setBaselineSpecs(JSON.stringify(rows)); setVersion(query.data.version); initialized.current = true;
  }, [query.data]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty && !bypass.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (blocker.state === 'blocked' && dialog.current && !dialog.current.open) {
      focusBefore.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; dialog.current.showModal();
    } else if (blocker.state !== 'blocked' && dialog.current?.open) dialog.current.close();
  }, [blocker.state]);
  const input = (name: keyof CatalogMetadata, label: string, type = 'text', maxLength?: number) => <CatalogField name={name} label={label} error={failure?.fields[name]}><input id={name} className="field" type={type} value={String(draft[name] ?? '')} maxLength={maxLength} required={['name', 'slug', 'price'].includes(name)} min={type === 'number' ? '0.01' : undefined} max={type === 'number' ? '9999999999.99' : undefined} step={type === 'number' ? '0.01' : undefined} aria-invalid={Boolean(failure?.fields[name])} aria-describedby={failure?.fields[name] ? `${name}-error` : undefined} onChange={event => setDraft(current => ({ ...current, [name]: event.target.value || null }))} /></CatalogField>;
  const submit = async () => {
    if (saving || failure?.stale) return;
    let specifications = draft.specifications;
    const specsChanged = JSON.stringify(specs) !== baselineSpecs;
    try { if (!productId || specsChanged) specifications = specificationPayload(specs); } catch (error) { setFailure({ message: 'Kiểm tra thông số.', fields: { specifications: error instanceof Error ? error.message : 'Thông số không hợp lệ.' }, stale: false, cartImpact: false }); return; }
    setSaving(true); setFailure(null); setSuccess('');
    try {
      const metadata = { ...draft, specifications };
      const saved = await saveProduct(productId, metadata, version, Boolean(query.data?.images.length), !specsChanged);
      setDraft(metadata); setBaseline(JSON.stringify(metadata)); setBaselineSpecs(JSON.stringify(specs)); setVersion(saved.version);
      void client.invalidateQueries({ queryKey: ['admin-products'] }); void client.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setSuccess('Đã lưu nội dung sản phẩm.');
      if (!productId) { if (mounted.current) { bypass.current = true; navigate(`/admin/products/${saved.id}${search}`, { replace: true }); } }
      else await query.refetch();
    } catch (error) { setFailure(catalogFailure(error)); } finally { setSaving(false); }
  };
  const reload = async () => {
    const latest = await query.refetch();
    if (latest.isSuccess) { setVersion(latest.data.version); setFailure(null); setSuccess('Đã tải bản mới. Nội dung bạn đang sửa được giữ nguyên; kiểm tra dữ liệu mới bên dưới trước khi lưu lại.'); }
  };
  return <AdminLayout title={productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'} subtitle="Nội dung và tồn kho được cập nhật riêng. Không nhập các thông số chưa được xác minh.">
    <div className="space-y-6 min-w-0">
      <Link className="btn btn-secondary" to={`/admin/products${search}`}>← Danh sách sản phẩm</Link>
      {productId && query.isPending && <div role="status" aria-label="Đang tải sản phẩm"><Skeleton className="h-64" /></div>}
      {productId && query.isError && <FeedbackState variant="error" title="Không tải được sản phẩm"><Button onClick={() => void query.refetch()}>Thử lại</Button></FeedbackState>}
      {(!productId || query.data) && <>
        {success && <p role="status" className="card p-4 bg-success-soft text-success">{success}</p>}
        {failure && <div role="alert" className="card p-4 space-y-3 border-destructive"><p>{failure.message}</p>{Object.entries(failure.fields).map(([key, value]) => <p key={key} className="text-sm break-words">{key}: {value}</p>)}{failure.stale && <Button loading={query.isFetching} onClick={() => void reload()}>Tải bản mới, giữ nội dung đang sửa</Button>}</div>}
        <form className="space-y-6" onSubmit={event => { event.preventDefault(); void submit(); }}>
          <fieldset disabled={saving} className="card p-4 sm:p-6 space-y-4"><legend className="section-heading px-2">Thông tin cơ bản</legend><div className="grid gap-4 md:grid-cols-2">{input('name', 'Tên sản phẩm', 'text', 255)}{input('slug', 'Slug (chữ thường, số, dấu gạch ngang)', 'text', 255)}
          {(['category_id', 'brand_id'] as const).map(key => <CatalogField key={key} name={key} label={key === 'category_id' ? 'Danh mục *' : 'Thương hiệu'} error={failure?.fields[key]}><select id={key} className="field" required={key === 'category_id'} value={draft[key] || ''} aria-invalid={Boolean(failure?.fields[key])} aria-describedby={failure?.fields[key] ? `${key}-error` : undefined} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value || null }))}><option value="">Chọn {key === 'category_id' ? 'danh mục' : 'thương hiệu'}</option>{(key === 'category_id' ? categories.data : brands.data)?.map(option => <option key={option.id} value={option.id}>{option.name}{!option.is_active ? ' (ẩn)' : ''}</option>)}</select></CatalogField>)}</div>
          {(categories.isError || brands.isError) && <p role="alert">Không tải được lựa chọn. <Button onClick={() => { void categories.refetch(); void brands.refetch(); }}>Thử lại</Button></p>}
          <CatalogField name="description" label="Mô tả" error={failure?.fields.description}><textarea id="description" className="field" maxLength={50000} value={draft.description || ''} aria-invalid={Boolean(failure?.fields.description)} aria-describedby={failure?.fields.description ? 'description-error' : undefined} onChange={event => setDraft(current => ({ ...current, description: event.target.value || null }))} /></CatalogField></fieldset>
          <fieldset disabled={saving} className="card p-4 sm:p-6"><legend className="section-heading px-2">Giá và hiển thị</legend><div className="grid gap-4 md:grid-cols-3">{input('price', 'Giá bán (đ) *', 'number')}{input('dealer_price', 'Giá đại lý (đ)', 'number')}{input('compare_at_price', 'Giá so sánh (đ)', 'number')}</div><div className="flex flex-wrap gap-4 mt-4">{(['is_active', 'is_featured', 'is_new'] as const).map(key => <label key={key} className="flex min-h-11 items-center gap-3"><input className="h-5 w-5" type="checkbox" checked={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.checked }))} />{{ is_active: 'Hiển thị', is_featured: 'Nổi bật', is_new: 'Mới' }[key]}</label>)}</div></fieldset>
          <fieldset disabled={saving} className="card p-4 sm:p-6 space-y-3"><legend className="section-heading px-2">Thông số đã xác minh</legend><ProductSpecificationsEditor rows={specs} onChange={setSpecs} error={failure?.fields.specifications} /></fieldset>
          <fieldset disabled={saving} className="card p-4 sm:p-6 space-y-4"><legend className="section-heading px-2">SEO và video</legend>{input('seo_title', 'Tiêu đề SEO', 'text', 160)}{input('seo_description', 'Mô tả SEO', 'text', 320)}{input('video_url', 'URL video HTTP(S)', 'url', 2048)}{!query.data?.images.length ? input('cover_image_url', 'URL ảnh bìa cũ (HTTP(S) hoặc /static/uploads/...)', 'text', 512) : <p className="text-caption">Ảnh bìa được quản lý trong mục hình ảnh; URL cũ không ghi đè ảnh được quản lý.</p>}</fieldset>
          <div className="flex flex-wrap items-center gap-3"><Button type="submit" loading={saving} disabled={Boolean(failure?.stale) || (Boolean(productId) && version === undefined)}>Lưu nội dung</Button><span className="text-caption">{dirty ? 'Có thay đổi chưa lưu' : 'Nội dung đã lưu'}{version ? ` · Phiên bản ${version}` : ''}</span></div>
        </form>
        {query.data && <><details className="card p-4"><summary className="min-h-11 cursor-pointer font-semibold">Bản trên máy chủ (để đối chiếu khi có xung đột)</summary><dl className="grid gap-3 mt-4 sm:grid-cols-2">{metadataKeys.map(key => <div key={key} className="min-w-0"><dt className="text-caption">{key}</dt><dd className="break-words whitespace-pre-wrap">{typeof query.data![key] === 'object' ? JSON.stringify(query.data![key]) : String(query.data![key] ?? '—')}</dd></div>)}</dl></details><ProductOperations product={query.data} onDirty={setOperationDirty} onRefresh={async () => {
          const before = JSON.stringify(metadataKeys.filter(key => key !== 'cover_image_url').map(key => query.data![key]));
          const updated = await query.refetch();
          if (updated.isError) throw updated.error;
          const latest = updated.data;
          if (latest) {
            const after = JSON.stringify(metadataKeys.filter(key => key !== 'cover_image_url').map(key => latest[key]));
            if (before === after) setVersion(latest.version);
            else setFailure({ message: 'Nội dung máy chủ đã thay đổi trong khi thao tác. Bản nháp của bạn được giữ nguyên.', fields: {}, stale: true, cartImpact: false });
          }
          void client.invalidateQueries({ queryKey: ['admin-products'] }); void client.invalidateQueries({ queryKey: ['admin-dashboard'] });
        }} /></>}
        {!productId && <p className="card p-4 text-body">Lưu sản phẩm trước để tải hình ảnh, tạo biến thể và điều chỉnh tồn kho.</p>}
      </>}
    </div>
    <dialog ref={dialog} className="dialog-panel w-full max-w-lg" aria-labelledby="leave-title" onCancel={event => { event.preventDefault(); if (blocker.state === 'blocked') blocker.reset(); }} onClose={() => focusBefore.current?.focus()}><h2 id="leave-title" className="section-heading">Rời trang và bỏ thay đổi?</h2><p className="text-body my-4">Nội dung chưa lưu sẽ mất. Các thao tác đã lưu vào máy chủ vẫn được giữ.</p><div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => { if (blocker.state === 'blocked') blocker.reset(); }}>Tiếp tục chỉnh sửa</Button><Button variant="danger" onClick={() => { if (blocker.state === 'blocked') blocker.proceed(); }}>Bỏ thay đổi và rời trang</Button></div></dialog>
  </AdminLayout>;
}
