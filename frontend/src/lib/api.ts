// src/lib/api.ts
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
}

export const apiFetch = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { params, headers: customHeaders, ...restOptions } = options;
  
  // Build query string
  // If endpoint starts with /, and BASE_URL ends with /api/v1, 
  // and endpoint also starts with /api/v1, avoid doubling.
  const baseUrlObj = new URL(BASE_URL);
  let finalEndpoint = endpoint;
  if (endpoint.startsWith(baseUrlObj.pathname) && baseUrlObj.pathname !== '/') {
    finalEndpoint = endpoint.substring(baseUrlObj.pathname.length);
  }
  
  // Ensure we don't have double slashes
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = finalEndpoint.startsWith('/') ? finalEndpoint : `/${finalEndpoint}`;
  
  let url = `${cleanBase}${cleanEndpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }

  // Handle headers
  const headers = new Headers(customHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (restOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Auth Token — only if caller hasn't provided one explicitly
  const token = useAuthStore.getState().accessToken;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Cannot parse JSON
    }
    
    // Handle global 401 unauth
    if (response.status === 401) {
      // Optionally trigger logout or refresh logic here
      useAuthStore.getState().logout();
    }
    
    throw new Error(errorMessage);
  }

  // Support 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export const GET = <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'GET' });

export const POST = <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const PUT = <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined });

export const PATCH = <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const DELETE = <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
