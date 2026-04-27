// src/types/api.ts

export interface BrandRead {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country_of_origin: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandCreate {
  name: string;
  slug: string;
  logo_url?: string | null;
  country_of_origin?: string | null;
  description?: string | null;
}

export type BrandUpdate = Partial<BrandCreate>;

export interface ProductImageRead {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImageCreate {
  url: string;
  alt_text?: string | null;
  position?: number;
}

export interface ReviewRead {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  body: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewCreate {
  author_name: string;
  rating: number;
  body?: string | null;
}

export interface ProductCreate {
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  dealer_price?: number | null;
  stock?: number;
  is_featured?: boolean;
  category_id: string;
  specifications?: unknown;
  cover_image_url?: string | null;
}

export type ProductUpdate = Partial<ProductCreate>;

export interface BlogPostRead {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  author_id: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostCreate {
  title: string;
  slug: string;
  body: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

export type BlogPostUpdate = Partial<BlogPostCreate>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductBrandRead {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country_of_origin: string | null;
}

export interface ProductRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  dealer_price: number | null;
  stock: number;
  is_featured: boolean;
  category_id: string;
  specifications: Record<string, unknown> | unknown[] | null;
  cover_image_url: string | null;
  brand_id: string | null;
  brand: ProductBrandRead | null;
  compare_at_price: string | null;
  is_new: boolean;
  video_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  rating_avg: string | null;
  rating_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRead {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
  price_override: string | null;
  attributes: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  phone: string;
  email?: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface UserRead {
  id: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string | null;
  role: string;
  status: string;
  is_active: boolean;
}

export interface GuestOrderItemCreate {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number;
}

export interface GuestOrderCreate {
  contact_phone: string;
  customer_name?: string | null;
  items: GuestOrderItemCreate[];
}

export interface OrderItemRead {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  product?: ProductRead;
}

export interface OrderRead {
  id: string;
  user_id: string | null;
  order_code: string;
  contact_phone: string;
  customer_name: string | null;
  total_amount: number;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItemRead[];
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  low_stock_count: number;
  revenue_growth: number;
  order_growth: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardData {
  stats: DashboardStats;
  revenue_chart: RevenueChartPoint[];
  recent_orders: OrderRead[];
}
