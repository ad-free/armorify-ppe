// src/hooks/useCatalog.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBrands,
  getCategories,
  getProductBySlug,
  getProductImages,
  getRelatedProducts,
  getProductReviews,
  listProductVariants,
  listProducts,
  submitReview,
} from '@/api/catalog';
import type { ReviewCreate } from '@/types/api';

export const useBrands = () =>
  useQuery({ queryKey: ['brands'], queryFn: getBrands, staleTime: 5 * 60_000 });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: getCategories, staleTime: 5 * 60_000 });

export const useProductImages = (productId: string | undefined) =>
  useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => getProductImages(productId!),
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
  });

export const useRelatedProducts = (productId: string | undefined) =>
  useQuery({
    queryKey: ['related', productId],
    queryFn: () => getRelatedProducts(productId!),
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
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

export const useProductBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

export const useProductVariants = (productId: string | undefined) =>
  useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => listProductVariants(productId!),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
