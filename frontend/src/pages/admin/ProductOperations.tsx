import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Primitives';
import { getMediaUrl } from '@/lib/api';
import { adjustStock, deactivateProductImage, saveVariant, updateProductImage, uploadProductImage } from '@/api/admin/catalog';
import type { CatalogDetail, CatalogImage, CatalogVariant } from '@/api/admin/catalog';
import { boundedCatalogJson, catalogFailure } from './catalogWorkflow';
import type { CatalogFailure } from './catalogWorkflow';

type VariantDraft = Omit<CatalogVariant, 'id' | 'stock' | 'available_stock' | 'stock_status' | 'cart_count'>;
export function ProductOperations({ product, onDirty, onRefresh }: { product: CatalogDetail; onDirty: (dirty: boolean) => void; onRefresh: () => Promise<void> }) {
  const emptyVariant: VariantDraft = { product_id: product.id, sku: '', size: null, color: null, attributes: null, price_override: null, is_active: true };
  const [variant, setVariant] = useState(emptyVariant); const [variantId, setVariantId] = useState<string>(); const [attributes, setAttributes] = useState('');
  const [variantBaseline, setVariantBaseline] = useState(JSON.stringify(emptyVariant)); const [attributesBaseline, setAttributesBaseline] = useState('');
  const [owner, setOwner] = useState(''); const [delta, setDelta] = useState(''); const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null); const [alt, setAlt] = useState(''); const [position, setPosition] = useState('0'); const [cover, setCover] = useState(false);
  const [imageDirty, setImageDirty] = useState<Record<string, boolean>>({});
  const [failure, setFailure] = useState<CatalogFailure | null>(null); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState('');
  const [pending, setPending] = useState<{ title: string; description: string; action: () => Promise<void> } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null); const trigger = useRef<HTMLElement | null>(null); const focusFallback = useRef<HTMLElement | null>(null); const uploadInput = useRef<HTMLInputElement>(null); const variantHeading = useRef<HTMLHeadingElement>(null); const mediaHeading = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(variant) !== variantBaseline || attributes !== attributesBaseline || Boolean(delta || reason || file || alt || position !== '0' || cover) || Object.values(imageDirty).some(Boolean);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { if (pending && dialog.current && !dialog.current.open) dialog.current.showModal(); if (!pending && dialog.current?.open) dialog.current.close(); }, [pending]);
  const ask = (title: string, description: string, action: () => Promise<void>) => { trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; focusFallback.current = trigger.current?.closest('section')?.querySelector('h2') ?? mediaHeading.current; setPending({ title, description, action }); };
  const run = async (action: () => Promise<void>) => {
    if (busy) return false; setBusy(true); setFailure(null); setSuccess('');
    let saved = false;
    try {
      await action(); saved = true;
      await onRefresh(); setSuccess('Đã lưu thao tác.');
    } catch (error) {
      const problem = catalogFailure(error);
      setFailure(saved ? { ...problem, message: 'Thao tác đã lưu nhưng chưa tải được dữ liệu mới. Tải lại dữ liệu trước khi thao tác tiếp.', stale: true } : problem);
    } finally { setBusy(false); setPending(null); }
    return saved;
  };
  const persistVariant = async (confirm = false) => {
    let parsed;
    try { parsed = boundedCatalogJson(attributes); } catch (error) { setFailure({ message: 'Thuộc tính JSON không hợp lệ.', fields: { attributes: error instanceof Error ? error.message : 'JSON không hợp lệ' }, stale: false, cartImpact: false }); return; }
    const data = { ...variant, attributes: parsed };
    const persist = async (confirmed: boolean) => {
      try { await saveVariant(variantId, data, confirmed); }
      catch (error) {
        const problem = catalogFailure(error);
        if (problem.cartImpact && !confirmed) {
          ask('Xác nhận tác động giỏ hàng', 'Thay đổi lựa chọn / ẩn biến thể sẽ ảnh hưởng các giỏ hàng đang chứa biến thể này. Các giỏ hàng đó sẽ phải chọn lại trước khi thanh toán.', () => persist(true));
          throw error;
        }
        throw error;
      }
      setVariant(emptyVariant); setVariantId(undefined); setAttributes(''); setVariantBaseline(JSON.stringify(emptyVariant)); setAttributesBaseline('');
    };
    // Cart-impact confirmation is handled separately so the dialog survives the initial 409.
    if (busy) return; setBusy(true); setFailure(null);
    try { await persist(confirm); await onRefresh(); setSuccess('Đã lưu biến thể.'); }
    catch (error) { setFailure(catalogFailure(error)); }
    finally { setBusy(false); }
  };
  const fieldError = (name: string) => failure?.fields[name] ? <p id={`ops-${name}-error`} className="field-error">{failure.fields[name]}</p> : null;
  const attrs = (name: string) => ({ 'aria-invalid': Boolean(failure?.fields[name]), 'aria-describedby': failure?.fields[name] ? `ops-${name}-error` : undefined });
  return <div className="space-y-6 min-w-0">
    {success && <p role="status" className="card p-4 text-success bg-success-soft">{success}</p>}
    {failure && <div role="alert" className="card p-4 border-destructive space-y-2"><p>{failure.message}</p>{Object.entries(failure.fields).map(([name, message]) => <p key={name} className="text-sm break-words">{name}: {message}</p>)}{failure.stale && <Button loading={busy} onClick={() => void run(onRefresh)}>Tải lại dữ liệu, giữ bản nháp</Button>}</div>}
    <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="images-title"><h2 id="images-title" ref={mediaHeading} tabIndex={-1} className="section-heading">Hình ảnh</h2><p className="text-caption">JPEG, PNG hoặc WebP. Ảnh bị ẩn vẫn còn trong lịch sử; chỉ một ảnh đang hiển thị làm bìa.</p>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); if (!file) return; void run(async () => { await uploadProductImage(product.id, file, alt, Number(position), cover); setFile(null); setAlt(''); setPosition('0'); setCover(false); if (uploadInput.current) uploadInput.current.value = ''; }); }}>
        <label><span className="field-label">Tệp ảnh *</span><input ref={uploadInput} className="field" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} /></label>
        <label><span className="field-label">Mô tả thay thế</span><input className="field" maxLength={255} value={alt} disabled={busy} {...attrs('alt_text')} onChange={event => setAlt(event.target.value)} />{fieldError('alt_text')}</label>
        <label><span className="field-label">Thứ tự</span><input className="field" type="number" min={0} max={10000} step={1} required value={position} disabled={busy} {...attrs('position')} onChange={event => setPosition(event.target.value)} />{fieldError('position')}</label>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={cover} disabled={busy} onChange={event => setCover(event.target.checked)} />Đặt làm ảnh bìa</label><Button type="submit" loading={busy} disabled={!file}>Tải ảnh lên</Button>
      </form>
      {!product.images.length && <p className="text-body">Chưa có ảnh được quản lý.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{product.images.map(image => <ImageEditor key={image.id} image={image} busy={busy} onDirty={value => setImageDirty(current => ({ ...current, [image.id]: value }))} onSave={data => run(async () => { await updateProductImage(image.id, data); })} onDeactivate={() => ask('Ẩn hình ảnh?', 'Ảnh này sẽ không hiển thị ngoài cửa hàng. Không xóa lịch sử.', async () => { await deactivateProductImage(image.id); })} />)}</div>
    </section>
    <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="variants-title"><h2 ref={variantHeading} tabIndex={-1} id="variants-title" className="section-heading">Biến thể</h2><p className="text-caption">Giá trống kế thừa giá sản phẩm. Mỗi biến thể cần lựa chọn có ý nghĩa và SKU duy nhất. Tồn kho chỉ đổi bằng điều chỉnh bên dưới.</p>
      {!product.variants.length && <p>Chưa có biến thể.</p>}
      <div className="grid gap-3 md:grid-cols-2">{product.variants.map(item => <article key={item.id} className="rounded-md border border-border p-4 min-w-0 space-y-2"><h3 className="font-semibold break-words">{item.sku}</h3><p className="break-words">{[item.size, item.color].filter(Boolean).join(' · ') || 'Thuộc tính tùy chọn'}{item.attributes ? ` · ${JSON.stringify(item.attributes)}` : ''}</p><p>{item.is_active ? 'Hiển thị' : 'Ẩn'} · Khả dụng {item.available_stock} · {item.cart_count} giỏ hàng</p><p>Giá: {item.price_override ? `${Number(item.price_override).toLocaleString('vi-VN')} đ` : `Kế thừa (${Number(product.price).toLocaleString('vi-VN')} đ)`}</p><Button variant="secondary" disabled={busy} onClick={() => {
        const load = async () => { const data: VariantDraft = { product_id: product.id, sku: item.sku, size: item.size, color: item.color, attributes: item.attributes, price_override: item.price_override, is_active: item.is_active }; const json = item.attributes ? JSON.stringify(item.attributes, null, 2) : ''; setVariant(data); setVariantId(item.id); setAttributes(json); setVariantBaseline(JSON.stringify(data)); setAttributesBaseline(json); variantHeading.current?.focus(); };
        if (JSON.stringify(variant) !== variantBaseline || attributes !== attributesBaseline) ask('Bỏ bản nháp biến thể?', 'Các thay đổi biến thể chưa lưu sẽ mất.', load); else void load();
      }}>Chỉnh sửa biến thể</Button></article>)}</div>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void persistVariant(); }}><h3 className="font-semibold">{variantId ? 'Sửa biến thể' : 'Thêm biến thể'}</h3><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        {(['sku', 'size', 'color', 'price_override'] as const).map(name => <label key={name}><span className="field-label">{{ sku: 'SKU *', size: 'Kích cỡ', color: 'Màu sắc', price_override: 'Giá riêng (đ), trống để kế thừa' }[name]}</span><input className="field" type={name === 'price_override' ? 'number' : 'text'} min={name === 'price_override' ? '0.01' : undefined} max={name === 'price_override' ? '9999999999.99' : undefined} step={name === 'price_override' ? '0.01' : undefined} maxLength={name === 'sku' ? 128 : 64} required={name === 'sku'} value={variant[name] || ''} {...attrs(name)} onChange={event => setVariant(current => ({ ...current, [name]: event.target.value || null }))} />{fieldError(name)}</label>)}
        <label className="sm:col-span-2"><span className="field-label">Thuộc tính JSON (cùng giới hạn với thông số)</span><textarea className="field font-mono" value={attributes} {...attrs('attributes')} onChange={event => setAttributes(event.target.value)} />{fieldError('attributes')}</label><label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5" type="checkbox" checked={variant.is_active} onChange={event => setVariant(current => ({ ...current, is_active: event.target.checked }))} />Hiển thị biến thể</label>
      </fieldset><div className="flex flex-wrap gap-3"><Button type="submit" loading={busy}>Lưu biến thể</Button>{variantId && <Button variant="secondary" disabled={busy} onClick={() => ask('Bỏ bản nháp biến thể?', 'Chuyển sang thêm biến thể mới, không lưu nội dung đang sửa.', async () => { setVariant(emptyVariant); setVariantId(undefined); setAttributes(''); setVariantBaseline(JSON.stringify(emptyVariant)); setAttributesBaseline(''); })}>Thêm biến thể khác</Button>}</div></form>
    </section>
    <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="inventory-title"><h2 id="inventory-title" tabIndex={-1} className="section-heading">Điều chỉnh tồn kho</h2><p className="text-body">Tồn khả dụng: {product.available_stock}. {product.has_variants ? 'Tồn kho do biến thể quản lý; chỉ cộng các biến thể đang hiển thị. Biến thể bị ẩn không chuyển tồn kho về sản phẩm gốc; chọn đúng biến thể để điều chỉnh.' : 'Tồn của sản phẩm không biến thể.'}</p>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); const quantity = Number(delta); if (!Number.isSafeInteger(quantity) || !quantity || Math.abs(quantity) > 2147483647) { setFailure({ message: 'Số lượng phải là số nguyên khác 0.', fields: { quantity_delta: 'Nhập số nguyên có dấu trong giới hạn 32-bit.' }, stale: false, cartImpact: false }); return; } ask('Xác nhận điều chỉnh tồn kho', `${quantity > 0 ? '+' : ''}${quantity} cho ${owner ? product.variants.find(item => item.id === owner)?.sku : product.name}. Lý do: ${reason.trim()}. Bút toán sẽ được lưu vĩnh viễn.`, async () => { await adjustStock(product.id, owner || null, quantity, reason.trim()); setDelta(''); setReason(''); }); }}>
        <label><span className="field-label">Chủ sở hữu tồn kho</span><select className="field" value={owner} disabled={busy} required={product.has_variants} {...attrs('variant_id')} onChange={event => setOwner(event.target.value)}><option value="" disabled={product.has_variants}>{product.has_variants ? 'Chọn biến thể' : 'Sản phẩm không biến thể'}</option>{product.variants.map(item => <option key={item.id} value={item.id}>{item.sku} · tồn {item.stock}{!item.is_active ? ' (ẩn)' : ''}</option>)}</select>{fieldError('variant_id')}</label>
        <label><span className="field-label">Thay đổi (+ nhập, − xuất) *</span><input className="field" type="number" step={1} min={-2147483647} max={2147483647} required value={delta} disabled={busy} {...attrs('quantity_delta')} onChange={event => setDelta(event.target.value)} />{fieldError('quantity_delta')}</label>
        <label className="sm:col-span-2"><span className="field-label">Lý do *</span><textarea className="field" required maxLength={1000} value={reason} disabled={busy} {...attrs('reason')} onChange={event => setReason(event.target.value)} />{fieldError('reason')}</label><Button type="submit" loading={busy} disabled={!reason.trim() || (product.has_variants && !owner)}>Xem và xác nhận điều chỉnh</Button>
      </form>
    </section>
    <section className="card p-4 sm:p-6 space-y-4" aria-labelledby="history-title"><h2 id="history-title" className="section-heading">Lịch sử tồn kho</h2><p className="text-caption">50 bút toán gần nhất. Không tạo lại số dư mở đầu hoặc sửa lịch sử.</p>{!product.recent_movements.length ? <p>Chưa có bút toán được ghi nhận.</p> : <ol className="space-y-3">{product.recent_movements.map(item => <li key={item.id} className="border-t border-border pt-3 min-w-0"><p className="font-semibold">{item.quantity_delta > 0 ? '+' : ''}{item.quantity_delta} → số dư {item.resulting_balance}</p><p className="break-words">{item.variant_id ? product.variants.find(variant => variant.id === item.variant_id)?.sku || item.variant_id : 'Sản phẩm'} · {item.source_type}</p><p className="break-words whitespace-pre-wrap">{item.reason}</p><p className="text-caption break-words">{new Date(item.created_at).toLocaleString('vi-VN')} · Người thao tác: {item.admin_actor_id || 'Hệ thống'}{item.order_id ? ` · Đơn: ${item.order_id}` : ''}</p></li>)}</ol>}{product.recent_visibility_events.length ? <div className="space-y-3"><h3 className="font-semibold">Bật/tắt hiển thị biến thể</h3><ol className="space-y-3">{product.recent_visibility_events.map(entry => <li key={entry.id} className="border-t border-border pt-3 min-w-0"><p className="font-semibold">{entry.action === 'variant_hidden' ? 'Ẩn biến thể' : 'Hiện biến thể'}: {product.variants.find(variant => variant.id === entry.variant_id)?.sku || entry.variant_id}</p><p className="text-caption break-words">{new Date(entry.created_at).toLocaleString('vi-VN')} · Người thao tác: {entry.admin_actor_id || 'Hệ thống'}</p></li>)}</ol></div> : null}</section>
    <dialog ref={dialog} className="dialog-panel w-full max-w-lg" aria-labelledby="operation-title" onCancel={event => { event.preventDefault(); if (!busy) setPending(null); }} onClose={() => { if (trigger.current?.isConnected && !trigger.current.matches(':disabled')) trigger.current.focus(); else focusFallback.current?.focus(); }}><h2 id="operation-title" className="section-heading">{pending?.title}</h2><p className="text-body my-4 break-words whitespace-pre-wrap">{pending?.description}</p><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={busy} onClick={() => setPending(null)}>Hủy</Button><Button loading={busy} onClick={() => { if (pending) void run(pending.action); }}>Xác nhận</Button></div></dialog>
  </div>;
}
function ImageEditor({ image, busy, onDirty, onSave, onDeactivate }: { image: CatalogImage; busy: boolean; onDirty: (dirty: boolean) => void; onSave: (data: Pick<CatalogImage, 'alt_text' | 'position' | 'is_cover' | 'is_active'>) => Promise<boolean>; onDeactivate: () => void }) {
  const [alt, setAlt] = useState(image.alt_text || ''); const [position, setPosition] = useState(String(image.position)); const [cover, setCover] = useState(image.is_cover); const [active, setActive] = useState(image.is_active);
  const dirty = alt !== (image.alt_text || '') || position !== String(image.position) || cover !== image.is_cover || active !== image.is_active;
  const notify = useRef(onDirty); notify.current = onDirty;
  useEffect(() => { notify.current(dirty); }, [dirty]);
  // Preserve local edits on refresh; pristine controls follow changes such as a different cover.
  const wasDirty = useRef(false);
  useEffect(() => { if (!wasDirty.current) { setAlt(image.alt_text || ''); setPosition(String(image.position)); setCover(image.is_cover); setActive(image.is_active); } }, [image.alt_text, image.position, image.is_cover, image.is_active]);
  useEffect(() => { wasDirty.current = dirty; }, [dirty]);
  return <form className="border border-border rounded-md p-4 space-y-3 min-w-0" onSubmit={event => { event.preventDefault(); void onSave({ alt_text: alt || null, position: Number(position), is_cover: cover && active, is_active: active }).then(saved => { if (saved) wasDirty.current = false; }); }}>
    <img className="w-full h-40 object-contain bg-muted rounded-md" width={320} height={160} src={getMediaUrl(image.url)} alt={image.alt_text || ''} />
    <p className="text-caption">{image.is_active ? 'Hiển thị' : 'Đã ẩn'}{image.is_cover ? ' · Ảnh bìa' : ''}</p>
    <label className="block"><span className="field-label">Mô tả thay thế</span><input className="field" maxLength={255} value={alt} disabled={busy} onChange={event => setAlt(event.target.value)} /></label>
    <label className="block"><span className="field-label">Thứ tự</span><input className="field" type="number" min={0} max={10000} step={1} required value={position} disabled={busy} onChange={event => setPosition(event.target.value)} /></label>
    <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5" type="checkbox" checked={active} disabled={busy} onChange={event => { setActive(event.target.checked); if (!event.target.checked) setCover(false); }} />Hiển thị</label>
    <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5" type="checkbox" checked={cover} disabled={busy || !active} onChange={event => setCover(event.target.checked)} />Ảnh bìa</label>
    <div className="flex flex-wrap gap-2"><Button type="submit" variant="secondary" loading={busy} disabled={!dirty}>Lưu ảnh</Button>{image.is_active && <Button variant="danger" disabled={busy} onClick={onDeactivate}>Ẩn ảnh</Button>}</div>
  </form>;
}
