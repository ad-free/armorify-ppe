// src/api/catalog.ts
import { GET, POST } from '@/lib/api';
import type { 
  BrandRead, 
  ProductImageRead, 
  ProductRead, 
  ReviewRead, 
  ReviewCreate, 
  PaginatedResponse,
  CategoryRead
} from '@/types/api';

export const getBrands = () =>
  GET<PaginatedResponse<BrandRead>>('/api/v1/catalog/brands'); // Usually paginated check

export const getCategories = () =>
  GET<PaginatedResponse<CategoryRead>>('/api/v1/catalog/categories');

export const getBrand = (id: string) =>
  GET<BrandRead>(`/api/v1/catalog/brands/${id}`);

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
  price_min?: number;
  price_max?: number;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
  skip?: number;
  limit?: number;
  q?: string;
}) => GET<PaginatedResponse<ProductRead>>('/api/v1/catalog/products', { params });
