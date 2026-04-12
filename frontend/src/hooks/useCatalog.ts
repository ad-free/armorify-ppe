// src/hooks/useCatalog.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBrands, 
  getProductImages, 
  getRelatedProducts, 
  getProductReviews, 
  submitReview, 
  listProducts,
  getCategories
} from '@/api/catalog';
import type { ReviewCreate } from '@/types/api';

export const useBrands = () =>
  useQuery({ queryKey: ['brands'], queryFn: getBrands, staleTime: 5 * 60_000 });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 5 * 60_000 });

export const useProductImages = (productId: string) =>
  useQuery({ 
    queryKey: ['product-images', productId],
    queryFn: () => getProductImages(productId), 
    staleTime: 5 * 60_000 
  });

export const useRelatedProducts = (productId: string) =>
  useQuery({ 
    queryKey: ['related', productId],
    queryFn: () => getRelatedProducts(productId), 
    staleTime: 5 * 60_000 
  });

export const useProductReviews = (productId: string, skip = 0, limit = 10) =>
  useQuery({ 
    queryKey: ['reviews', productId, skip, limit],
    queryFn: () => getProductReviews(productId, { skip, limit }),
    staleTime: 0 
  });

export const useSubmitReview = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ReviewCreate) => submitReview(productId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', productId] })
  });
};

export const useProducts = (params: Parameters<typeof listProducts>[0]) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
    staleTime: 5 * 60_000
  });
