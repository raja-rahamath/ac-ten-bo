import { emitAuthError } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8004/api/v1';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
      ...(skipAuth ? {} : this.getAuthHeaders()),
    };

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, config);

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !skipAuth) {
      // Prevent multiple refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const newToken = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (newToken) {
        // Retry the request with new token
        const retryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...headers,
          Authorization: `Bearer ${newToken}`,
        };

        const retryConfig: RequestInit = {
          method,
          headers: retryHeaders,
        };

        if (body && method !== 'GET') {
          retryConfig.body = JSON.stringify(body);
        }

        response = await fetch(`${this.baseUrl}${endpoint}`, retryConfig);

        // If still unauthorized after refresh, emit auth error
        if (response.status === 401) {
          emitAuthError();
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        // Token refresh failed, emit auth error to trigger logout
        emitAuthError();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Handle nested error format: { success: false, error: { code, message } }
      const errorMessage = errorData?.error?.message || errorData?.message || errorData?.error || `Request failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T = any>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  patch<T = any>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create instances for API and AI services
export const api = new ApiClient(API_URL);
export const aiApi = new ApiClient(AI_URL);

// Alias for backward compatibility
export const apiService = api;

// Export the base URLs for reference
export { API_URL, AI_URL };
