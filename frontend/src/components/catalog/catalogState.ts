import type { listProducts } from '@/api/catalog';

export const filterKeys = ['category_id', 'brand_id', 'price_min', 'price_max', 'is_new', 'is_featured', 'rating_min'] as const;
export const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: thấp đến cao' },
  { value: 'price_desc', label: 'Giá: cao đến thấp' },
  { value: 'featured', label: 'Nổi bật' },
] as const;

export function updateCatalogParams(params: URLSearchParams, changes: Record<string, string | null>) {
  const next = new URLSearchParams(params);
  Object.entries(changes).forEach(([key, value]) => {
    if (value) next.set(key, value); else next.delete(key);
  });
  next.delete('page');
  return next;
}

export function clearCatalogFilters(params: URLSearchParams) {
  return updateCatalogParams(params, Object.fromEntries(filterKeys.map(key => [key, null])));
}

export function readCatalogState(params: URLSearchParams) {
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 1_000_000 ? rawPage : 1;
  const rawLimit = Number(params.get('limit') || 24);
  const limit = [12, 24, 48].includes(rawLimit) ? rawLimit : 24;
  const rawSort = params.get('sort_by');
  const sort_by = sortOptions.find(option => option.value === rawSort)?.value || 'newest';
  const price = (key: string) => params.get(key) ? Number(params.get(key)) : undefined;
  const price_min = price('price_min');
  const price_max = price('price_max');
  const rating = price('rating_min');
  const invalidPrice = [price_min, price_max].some(value => value !== undefined && (!Number.isFinite(value) || value < 0));
  const error = invalidPrice || (price_min !== undefined && price_max !== undefined && price_min > price_max)
    ? 'Khoảng giá không hợp lệ. Giá phải từ 0 và giá tối đa không nhỏ hơn giá tối thiểu.'
    : rating !== undefined && (!Number.isFinite(rating) || rating < 0 || rating > 5)
      ? 'Mức đánh giá phải từ 0 đến 5.' : undefined;
  const request: Parameters<typeof listProducts>[0] = {
    skip: (page - 1) * limit, limit, sort_by,
    q: params.get('q')?.trim() || undefined,
    category_id: params.get('category_id') || undefined,
    brand_id: params.get('brand_id') || undefined,
    price_min, price_max,
    is_new: params.get('is_new') === 'true' ? true : undefined,
    is_featured: params.get('is_featured') === 'true' ? true : undefined,
    rating_min: rating,
  };
  return { page, limit, request, error };
}
