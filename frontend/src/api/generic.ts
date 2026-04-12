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
  'blog': 'admin/cms/pages',
  'banner': 'admin/cms/banners',
  'variant': 'admin/catalog/variants',
  'quote': 'admin/quotes/requests',
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

/**
 * Hook for managing a generic resource
 */
export const useGenericResource = (entityName: string, params: QueryParams = { skip: 0, limit: 10 }) => {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: [entityName, 'list', params],
    queryFn: () => genericApiClient.fetchList(entityName, params),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => genericApiClient.create(entityName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) =>
      genericApiClient.update(entityName, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => genericApiClient.delete(entityName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string | number) => genericApiClient.restore(entityName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    },
  });

  return {
    items: listQuery.data,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || restoreMutation.isPending,
  };
};
