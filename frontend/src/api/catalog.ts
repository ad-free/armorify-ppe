// src/api/catalog.ts
import { GET, POST } from '@/lib/api';
import type {
  BrandRead,
  CategoryRead,
  PaginatedResponse,
  ProductImageRead,
  ProductRead,
  ProductVariantRead,
  ReviewCreate,
  ReviewRead,
  FlashSalePublicRead,
} from '@/types/api';

export const getBrands = async (): Promise<PaginatedResponse<BrandRead>> => {
  const res = await GET<PaginatedResponse<BrandRead> | BrandRead[]>('/api/v1/catalog/brands');
  if (Array.isArray(res)) {
    return { items: res, total: res.length, skip: 0, limit: res.length };
  }
  return res;
};

export const getCategories = () =>
  GET<CategoryRead[]>('/api/v1/catalog/categories');

export const getBrand = (id: string) =>
  GET<BrandRead>(`/api/v1/catalog/brands/${id}`);

export const getProductBySlug = (slug: string) =>
  GET<ProductRead>(`/api/v1/catalog/products/slug/${encodeURIComponent(slug)}`);

export const listProductVariants = (productId: string) =>
  GET<ProductVariantRead[]>(`/api/v1/catalog/products/${productId}/variants`);

export const getProductImages = (productId: string) =>
  GET<ProductImageRead[]>(`/api/v1/catalog/products/${productId}/images`);

export const getRelatedProducts = (productId: string) =>
  GET<ProductRead[]>(`/api/v1/catalog/products/${productId}/related`);

export const getProductReviews = (
  productId: string,
  params: { skip?: number; limit?: number }
) =>
  GET<PaginatedResponse<ReviewRead>>(
    `/api/v1/catalog/products/${productId}/reviews`,
    { params }
  );

export const submitReview = (productId: string, body: ReviewCreate) =>
  POST<ReviewRead>(`/api/v1/catalog/products/${productId}/reviews`, body);

export const listProducts = (params: {
  category_id?: string;
  brand_id?: string;
  is_featured?: boolean;
  is_new?: boolean;
  is_flash_deal?: boolean;
  price_min?: number;
  price_max?: number;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
  skip?: number;
  limit?: number;
  q?: string;
  rating_min?: number;
}) => GET<PaginatedResponse<ProductRead>>('/api/v1/catalog/products', { params });

export const getActiveFlashSale = () =>
  GET<FlashSalePublicRead>('/api/v1/catalog/flash-sale');
