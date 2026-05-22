import React, { useState } from 'react';
import { Columns, X, Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGenericResource, genericApiClient } from '../../api/generic';
import { getMediaUrl } from '@/lib/api';
import { useEntitySchema } from '../../hooks/useSchema';
import { DynamicTable } from '../dynamic/DynamicTable';
import { DynamicForm } from '../dynamic/DynamicForm';
import { authToast } from '@/lib/toast';

// --- Sub-managers for Images and Variants ---

interface ProductImageNode {
  id: string;
  url: string;
  product_id: string;
}

interface ProductVariantNode {
  id: string;
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  product_id: string;
}

const ProductImageManager = ({ productId }: { productId: string }) => {
  const { items, isLoading, remove, create } = useGenericResource('product-image', { limit: 100 });
  const [uploading, setUploading] = useState(false);

  // Filter items manually since we don't have exact nested routes without specific query params on backend
  const productImages = ((items || []) as ProductImageNode[]).filter((i) => i.product_id === productId);


  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      let successCount = 0;
      for (const file of Array.from(e.target.files)) {
        const uploadRes = await genericApiClient.uploadImage(file);
        await create({
          product_id: productId,
          url: uploadRes.url,
          position: productImages.length + successCount, // Append at end
        });
        successCount++;
      }
      authToast.success(`Tải lên thành công ${successCount} ảnh`, 'Thư viện đã được cập nhật.');
    } catch (err) {
      console.error(err);
      authToast.error('Tải ảnh thất bại', 'Vui lòng thử lại sau.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <div>
          <h4 className="text-xl font-black text-gray-900 tracking-tight">Thư viện hình ảnh</h4>
          <p className="text-sm font-bold text-gray-400">Tải lên và quản lý hình ảnh cho sản phẩm này.</p>
        </div>
        <div className="relative">
          <input
            type="file"
            multiple
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleUpload}
            disabled={uploading}
          />
          <button
            type="button"
            className="px-6 py-3 bg-primary/10 text-primary font-black rounded-xl hover:bg-primary hover:text-white transition-all text-xs uppercase tracking-widest"
          >
            {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-400 font-bold italic animate-pulse">Đang tải hình ảnh...</div>
      ) : productImages.length === 0 ? (
        <div className="p-16 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm text-gray-300">
            <Columns size={32} />
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Chưa có hình ảnh nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {productImages.map((img) => (
            <div key={img.id} className="relative group rounded-3xl overflow-hidden border border-gray-100 bg-white aspect-square flex items-center justify-center shadow-sm hover:shadow-xl transition-all">
              <img src={getMediaUrl(img.url)} alt="Product" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  className="bg-white text-rose-600 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg"
                >
                  Xoá ảnh
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductVariantManager = ({ productId }: { productId: string }) => {
  const { items, isLoading, remove, create, update } = useGenericResource('variant', { limit: 100 });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [stock, setStock] = useState(0);

  const productVariants = ((items || []) as ProductVariantNode[]).filter((v) => v.product_id === productId);

  const handleSave = async () => {
    if (!sku) return;
    const payload = {
      product_id: productId,
      sku,
      size: size || null,
      color: color || null,
      stock,
    };
    if (editingId) {
      await update({ id: editingId, data: payload });
    } else {
      await create(payload);
    }
    setAdding(false);
    setEditingId(null);
    setSku('');
    setSize('');
    setColor('');
    setStock(0);
  };

  const startEdit = (v: ProductVariantNode) => {
    setSku(v.sku);
    setSize(v.size || '');
    setColor(v.color || '');
    setStock(v.stock);
    setEditingId(v.id);
    setAdding(true);
  };

  const cancelEdit = () => {
    setAdding(false);
    setEditingId(null);
    setSku('');
    setSize('');
    setColor('');
    setStock(0);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <div>
          <h4 className="text-xl font-black text-gray-900 tracking-tight">Biến thể sản phẩm</h4>
          <p className="text-sm font-bold text-gray-400">Quản lý kích thước, màu sắc và số lượng tồn kho.</p>
        </div>
        <button
          className="px-6 py-3 bg-primary/10 text-primary font-black rounded-xl hover:bg-primary hover:text-white transition-all text-xs uppercase tracking-widest shadow-sm"
          onClick={() => {
            setSku(''); setSize(''); setColor(''); setStock(0); setEditingId(null); setAdding(true);
          }}
        >
          Thêm biến thể mới
        </button>
      </div>

      {adding && (
        <div className="p-8 bg-gray-50/50 border border-gray-100 rounded-[2rem] shadow-inner animate-in fade-in zoom-in-95">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4 mb-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">SKU Mã hàng *</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="ARM-PPE-001" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Màu sắc</label>
              <div className="flex items-center gap-3 border border-gray-200 bg-white rounded-xl px-3 py-2">
                <input type="color" value={color.startsWith('#') ? color : '#0da487'} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer shrink-0" />
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#Hex hoặc Tên" className="w-full text-xs font-bold border-none focus:outline-none bg-transparent uppercase tracking-wider" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kích cỡ</label>
              <input value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="L, XL, 42..." />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tồn kho</label>
              <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="w-full px-5 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={cancelEdit} className="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-rose-500 transition-colors">Hủy bỏ</button>
            <button onClick={handleSave} className="px-8 py-3 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
              {editingId ? 'Cập nhật' : 'Lưu biến thể'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-400 font-bold italic animate-pulse">Đang tải biến thể...</div>
      ) : (
        <div className="overflow-hidden border border-gray-50 rounded-[2rem] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-800">SKU</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Color</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Size</th>
                <th className="px-4 py-3 font-semibold text-slate-800">Stock</th>
                <th className="px-4 py-3 font-semibold text-slate-800 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productVariants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 bg-slate-50">
                    No variants found. Add one above.
                  </td>
                </tr>
              ) : (
                productVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-700">{v.sku}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {v.color ? (
                        v.color.startsWith('#') || v.color.match(/^(rgba?|hsl)/) ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: v.color }} title={v.color} />
                            <span className="text-xs uppercase text-slate-400">{v.color}</span>
                          </div>
                        ) : (
                          v.color
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.size || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${v.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {v.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => startEdit(v)} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">Edit</button>
                        <button onClick={() => remove(v.id)} className="text-rose-600 hover:text-rose-800 font-medium text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Main Product Manager ---

export const ProductManager: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(search);
  const stockFilter = queryParams.get('stock');

  const entityName = 'product';
  const [params, setParams] = useState({ skip: 0, limit: 10, sort_by: 'id' });
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'variants'>('info');

  const { data: readSchema, isLoading: isReadSchemaLoading } = useEntitySchema(entityName, 'read');
  const { data: createSchema } = useEntitySchema(entityName, 'create');
  const { data: updateSchema } = useEntitySchema(entityName, 'update');

  const {
    items,
    isLoading: isDataLoading,
    create,
    update,
    remove,
    restore,
  } = useGenericResource(entityName, params);

  const filteredItems = Array.isArray(items) ? items.filter((item) => {
    const product = item as Record<string, unknown>;
    if (stockFilter === 'low') {
      return Number(product.stock ?? 0) < 10;
    }
    return true;
  }) : [];

  const handleCreate = async (data: Record<string, unknown>) => {
    const newProduct = await create(data) as Record<string, unknown>;
    // Switch to editing mode so they can add images/variants
    setEditingItem(newProduct);
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingItem) return;
    await update({ id: (editingItem as { id: string | number }).id, data });
  };

  const isSchemaLoading = isReadSchemaLoading;
  const schema = readSchema;
  const formSchema = editingItem
    ? (updateSchema || createSchema || readSchema)
    : (createSchema || updateSchema || readSchema);

  if (isSchemaLoading || !schema || !formSchema) {
    return <div className="p-8 text-center">Loading product environment...</div>;
  }

  const tabClass = (tab: string) =>
    `px-6 py-4 font-black text-xs uppercase tracking-widest transition-all border-b-4 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`;

  return (
    <div className="space-y-8 min-w-0">
      {stockFilter === 'low' && !isFormOpen && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[13px] font-black text-gray-900">Danh sách sản phẩm sắp hết hàng</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Đang hiển thị các sản phẩm có tồn kho dưới 10</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/manage/product')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-400 hover:text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all"
          >
            <X size={14} />
            Xóa bộ lọc
          </button>
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-6 duration-500 overflow-hidden">

          <div className="flex items-center justify-between px-10 py-6 bg-gray-50/50 border-b border-gray-50">
            <h3 className="text-xl font-black text-gray-900">
              {editingItem ? `Chỉnh sửa: ${editingItem.name || 'Sản phẩm'}` : 'Tạo sản phẩm mới'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white border border-gray-100 px-5 py-2.5 rounded-xl hover:text-primary hover:border-primary transition-all"
            >
              Quay lại danh sách
            </button>
          </div>

          <div className="flex overflow-x-auto border-b border-gray-50 px-10 bg-white sticky top-0 z-20">
            <button className={tabClass('info')} onClick={() => setActiveTab('info')}>Thông tin chung</button>
            <button className={tabClass('images')} onClick={() => setActiveTab('images')} disabled={!editingItem}>Thư viện ảnh</button>
            <button className={tabClass('variants')} onClick={() => setActiveTab('variants')} disabled={!editingItem}>Biến thể & Kho</button>
            {!editingItem && (
              <span className="px-6 py-4 text-[10px] font-black text-amber-500 uppercase tracking-widest ml-auto self-center">
                Vui lòng lưu sản phẩm để mở khóa Ảnh và Biến thể.
              </span>
            )}
          </div>

          <div className="p-10">
            {activeTab === 'info' && (
              <DynamicForm
                entityName={entityName}
                schema={formSchema}
                initialData={editingItem}
                onSubmit={editingItem ? handleUpdate : handleCreate}
                isLoading={false}
              />
            )}

            {activeTab === 'images' && editingItem && (
              <ProductImageManager productId={String(editingItem.id)} />
            )}

            {activeTab === 'variants' && editingItem && (
              <ProductVariantManager productId={String(editingItem.id)} />
            )}
          </div>
        </div>
      ) : (
        <DynamicTable
          entityName={entityName}
          schema={schema}
          data={filteredItems as Record<string, unknown>[]}
          isLoading={isDataLoading}
          onAdd={() => { setEditingItem(null); setActiveTab('info'); setIsFormOpen(true); }}
          onEdit={(row) => { setEditingItem(row); setActiveTab('info'); setIsFormOpen(true); }}
          onDelete={remove}
          onRestore={restore}
          onSort={(field) => setParams(p => ({ ...p, sort_by: field }))}
        />
      )}
    </div>
  );
};


