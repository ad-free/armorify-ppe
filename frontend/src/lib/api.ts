// src/lib/api.ts
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * The HTTP origin (scheme + host + port) of the backend server, derived from
 * VITE_API_BASE_URL at build/runtime.  Used to resolve server-relative image
 * paths so the frontend never hard-codes an IP address.
 *
 * Example: "http://192.168.1.3:8000"
 */
export const SERVER_ORIGIN = (() => {
  try {
    return new URL(BASE_URL).origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
})();

/**
 * Converts any image URL stored in the database to a fully-qualified URL that
 * works regardless of the current server IP or domain.
 *
 * - Absolute external URLs: preserved for historical catalog media.
 * - Absolute legacy /static URLs: reattached to the current SERVER_ORIGIN.
 * - Relative paths (new format, e.g. "/static/uploads/abc.jpg"): SERVER_ORIGIN
 *   is prepended.
 * - Null / empty   : returns an empty string so <img> renders nothing.
 */
export const getMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith('/static/') ? `${SERVER_ORIGIN}${parsed.pathname}` : parsed.href;
  } catch {
    // Relative path — just prepend the origin.
    return `${SERVER_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
  }
};

/** Preserve structured validation details without rendering arbitrary server data. */
export class ApiError extends Error {
  constructor(public status: number, public details: unknown, fallback = 'Không thể hoàn tất yêu cầu.') {
    super(typeof details === 'string' ? details : fallback);
    this.name = 'ApiError';
  }
}

const responseError = async (response: Response): Promise<ApiError> => {
  let details: unknown = null;
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>;
      details = body.detail ?? body.message ?? null;
    }
  } catch {
    // Non-JSON HTTP responses still carry their status.
  }
  return new ApiError(response.status, details);
};

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
  _retry?: boolean;
}

export const apiFetch = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { params, headers: customHeaders, _retry, ...restOptions } = options;
  
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

  if (restOptions.body && !(restOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Auth Token — only if caller hasn't provided one explicitly
  const token = useAuthStore.getState().accessToken;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const refreshAuthToken = async (): Promise<string | null> => {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) return null;

    const refreshUrl = `${BASE_URL.replace(/\/$/, '')}/auth/refresh`;
    const refreshResponse = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshResponse.ok) {
      if (refreshResponse.status === 401) {
        logout();
      }
      return null;
    }

    const responseData = await refreshResponse.json();
    setTokens(responseData.access_token, responseData.refresh_token);
    return responseData.access_token;
  };

  const response = await fetch(url, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    const error = await responseError(response);

    if (response.status === 401 && !_retry) {
      const newAccessToken = await refreshAuthToken();
      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        const retryResponse = await fetch(url, {
          ...restOptions,
          headers,
        });

        if (retryResponse.ok) {
          if (retryResponse.status === 204) {
            return {} as T;
          }
          return retryResponse.json();
        }

        const retryError = await responseError(retryResponse);

        if (retryResponse.status === 401) {
          useAuthStore.getState().logout();
        }

        throw retryError;
      }
    }

    if (response.status === 401 && useAuthStore.getState().accessToken === token) {
      useAuthStore.getState().logout();
    }

    throw error;
  }

  // Support 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export const GET = <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'GET' });

const prepareBody = (body: unknown) =>
  body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

export const POST = <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'POST', body: prepareBody(body) });

export const PUT = <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'PUT', body: prepareBody(body) });

export const PATCH = <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const DELETE = <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
  apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
