import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GET, POST, PUT, DELETE } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export interface QueryParams {
  skip?: number;
  limit?: number;
  sort_by?: string;
  [key: string]: string | number | boolean | undefined;
}

const RESOURCE_PATH_MAP: Record<string, string> = {
  'user': 'admin/users',
  'order': 'admin/orders',
  'product': 'admin/catalog/products',
  'catalog': 'admin/catalog/categories',
  'category': 'admin/catalog/categories',
  'blog': 'admin/blog/posts',
  'banner': 'admin/cms/banners',
  'brand': 'admin/catalog/brands',
  'branch': 'admin/catalog/brands',
  'product_image': 'admin/catalog/product-images',
  'product-image': 'admin/catalog/product-images',
  'variant': 'admin/catalog/variants',
  'quote': 'admin/quotes/requests',
  'review': 'admin/reviews',
  'flash-sale': 'admin/flash-sales',
  'flash_sale': 'admin/flash-sales',
};

const getResourcePath = (entity: string) => {
  return RESOURCE_PATH_MAP[entity.toLowerCase()] || entity;
};

export const genericApiClient = {
  fetchList: async (entity: string, params: QueryParams) => {
    const path = getResourcePath(entity);
    return GET<Record<string, unknown>[]>(`/${path}/`, { params });
  },

  fetchOne: async (entity: string, id: string | number) => {
    const path = getResourcePath(entity);
    return GET<Record<string, unknown>>(`/${path}/${id}`);
  },

  create: async (entity: string, data: Record<string, unknown>) => {
    const path = getResourcePath(entity);
    return POST<Record<string, unknown>>(`/${path}/`, data);
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return POST<{ url: string }>(`/admin/catalog/uploads/images`, formData);
  },

  update: async (entity: string, id: string | number, data: Record<string, unknown>) => {
    const path = getResourcePath(entity);
    return PUT<Record<string, unknown>>(`/${path}/${id}`, data);
  },

  delete: async (entity: string, id: string | number) => {
    const path = getResourcePath(entity);
    return DELETE<Record<string, unknown>>(`/${path}/${id}`);
  },

  restore: async (entity: string, id: string | number) => {
    const path = getResourcePath(entity);
    return POST<Record<string, unknown>>(`/${path}/${id}/restore`);
  },

  fetchSchema: async () => {
    try {
      const url = new URL(API_BASE_URL);
      const response = await fetch(`${url.origin}/openapi.json`);
      if (!response.ok) throw new Error('Root openapi.json not found');
      return response.json();
    } catch {
      const response = await fetch(`${API_BASE_URL}/openapi.json`);
      return response.json();
    }
  },
};

import { authToast } from '@/lib/toast';

/**
 * Hook for managing a generic resource
 */
export const useGenericResource = (entityName: string, params: QueryParams = { skip: 0, limit: 10 }) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [entityName, 'list', params],
    queryFn: () => genericApiClient.fetchList(entityName, params),
  });

  const getRelatedQueryKeys = (entity: string) => {
    const lowerName = entity.toLowerCase();
    const related: Array<string[]> = [];

    if (lowerName === 'catalog' || lowerName === 'category') {
      related.push(['categories']);
    }
    if (lowerName === 'brand' || lowerName === 'branch') {
      related.push(['brands']);
    }
    // Storefront hooks use different keys than admin CRUD (`useProducts` → `['products', …]`).
    if (lowerName === 'product') {
      related.push(['products']);
      related.push(['related']);
    }
    if (lowerName === 'variant') {
      related.push(['products']);
      related.push(['product-variants']);
      related.push(['related']);
    }
    if (lowerName === 'product_image' || lowerName === 'product-image') {
      related.push(['products']);
      related.push(['product-images']);
    }
    if (lowerName === 'flash_sale' || lowerName === 'flash-sale') {
      related.push(['active-flash-sale']);
      related.push(['products']);
      related.push(['product']);
    }

    return related;
  };

  const invalidateEntityQueries = () => {
    queryClient.invalidateQueries({ queryKey: [entityName] });
    getRelatedQueryKeys(entityName).forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => genericApiClient.create(entityName, data),
    onSuccess: () => {
      invalidateEntityQueries();
      authToast.success('Đã tạo thành công', `Bản ghi ${entityName} mới đã được lưu.`);
    },
    onError: (err: { message?: string }) => {
      authToast.error('Lỗi khi tạo', err.message || 'Không rõ nguyên nhân');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) =>
      genericApiClient.update(entityName, id, data),
    onSuccess: () => {
      invalidateEntityQueries();
      authToast.success('Đã cập nhật', 'Các thay đổi đã được lưu lại.');
    },
    onError: (err: { message?: string }) => {
      authToast.error('Lỗi cập nhật', err.message || 'Không rõ nguyên nhân');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => genericApiClient.delete(entityName, id),
    onSuccess: () => {
      invalidateEntityQueries();
      authToast.success('Đã xoá thành công', 'Dữ liệu đã được gỡ bỏ.');
    },
    onError: (err: { message?: string }) => {
      authToast.error('Lỗi khi xoá', err.message || 'Không rõ nguyên nhân');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string | number) => genericApiClient.restore(entityName, id),
    onSuccess: () => {
      invalidateEntityQueries();
      authToast.success('Thành công', `Đã khôi phục ${entityName} thành công!`);
    },
    onError: (err: { message?: string }) => {
      authToast.error('Thất bại', `Lỗi khi khôi phục ${entityName}: ` + (err.message || 'Không rõ nguyên nhân'));
    }
  });

  const rawData = listQuery.data;
  const itemsList = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === 'object' && rawData !== null && 'items' in rawData
      ? (rawData as { items: unknown[] }).items
      : [];

  return {
    items: itemsList,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || restoreMutation.isPending,
  };
};
