import { GET, POST, PUT, DELETE } from '@/lib/api';

export interface CatalogMetadata {
  name: string; slug: string; description: string | null; category_id: string; brand_id: string | null;
  price: string; dealer_price: string | null; compare_at_price: string | null;
  is_active: boolean; is_featured: boolean; is_new: boolean;
  specifications: Record<string, string | number | boolean> | null;
  cover_image_url: string | null; video_url: string | null; seo_title: string | null; seo_description: string | null;
}
export interface CatalogProduct extends CatalogMetadata {
  id: string; version: number; available_stock: number; has_variants: boolean; stock_status: string;
}
export interface CatalogVariant {
  id: string; product_id: string; sku: string; size: string | null; color: string | null;
  attributes: Record<string, string | number | boolean> | null; price_override: string | null; is_active: boolean; stock: number; available_stock: number; stock_status: string; cart_count: number;
}
export interface CatalogImage { id: string; url: string; alt_text: string | null; position: number; is_active: boolean; is_cover: boolean }
export interface CatalogMovement {
  id: string; variant_id: string | null; quantity_delta: number; resulting_balance: number;
  source_type: string; order_id: string | null; admin_actor_id: string | null; reason: string; created_at: string;
}
export interface CatalogDetail extends CatalogProduct { variants: CatalogVariant[]; images: CatalogImage[]; recent_movements: CatalogMovement[] }
export interface CatalogOption { id: string; name: string; is_active: boolean }
export const listProducts = (params: Record<string, string | number | boolean>, signal?: AbortSignal) => GET<{items: CatalogProduct[]; total: number; skip: number; limit: number}>('/admin/catalog/products', { params, signal });
export const getProduct = (id: string, signal?: AbortSignal) => GET<CatalogDetail>(`/admin/catalog/products/${id}`, { signal });
export async function catalogOptions(kind: 'categories' | 'brands', signal?: AbortSignal) {
  const options: CatalogOption[] = [];
  let batch: CatalogOption[];
  do {
    batch = await GET<CatalogOption[]>(`/admin/catalog/${kind}${kind === 'brands' ? '/' : ''}`, { params: { skip: options.length, limit: 500, include_inactive: true }, signal });
    options.push(...batch);
  } while (batch.length === 500);
  return options;
}
export const saveVariant = (id: string | undefined, data: Omit<CatalogVariant, 'id' | 'stock' | 'available_stock' | 'stock_status' | 'cart_count'>, confirm = false) => id
  ? PUT<CatalogVariant>(`/admin/catalog/variants/${id}`, { sku: data.sku, size: data.size, color: data.color, attributes: data.attributes, price_override: data.price_override, is_active: data.is_active, confirm_cart_impact: confirm })
  : POST<CatalogVariant>('/admin/catalog/variants', data);
export const adjustStock = (id: string, variant_id: string | null, quantity_delta: number, reason: string) => POST<CatalogMovement>(`/admin/catalog/products/${id}/inventory-adjustments`, { variant_id, quantity_delta, reason });
export const saveProduct = (id: string | undefined, data: CatalogMetadata, version?: number, managedImages = false, preserveSpecifications = false) => {
  const payload: Partial<CatalogMetadata> = { ...data };
  if (managedImages) delete payload.cover_image_url;
  if (id && preserveSpecifications) delete payload.specifications;
  return id ? PUT<CatalogProduct>(`/admin/catalog/products/${id}`, { ...payload, expected_version: version })
    : POST<CatalogProduct>('/admin/catalog/products', payload);
};
export const uploadProductImage = (id: string, file: File, alt: string, position: number, cover: boolean) => {
  const data = new FormData(); data.append('file', file); data.append('alt_text', alt); data.append('position', String(position)); data.append('is_cover', String(cover));
  return POST<CatalogImage>(`/admin/catalog/product-images/products/${id}/upload`, data);
};
export const updateProductImage = (id: string, data: Pick<CatalogImage, 'alt_text' | 'position' | 'is_active' | 'is_cover'>) => PUT<CatalogImage>(`/admin/catalog/product-images/${id}`, data);
export const deactivateProductImage = (id: string) => DELETE(`/admin/catalog/product-images/${id}`);
