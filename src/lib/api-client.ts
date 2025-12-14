import { api } from './api';

/**
 * API client wrapper that provides axios-like response structure
 * Used by components expecting { data: { ... } } response format
 */
export const apiClient = {
  get: async <T = unknown>(endpoint: string) => {
    const data = await api.get<T>(endpoint);
    return { data };
  },

  post: async <T = unknown>(endpoint: string, body?: unknown) => {
    const data = await api.post<T>(endpoint, body);
    return { data };
  },

  put: async <T = unknown>(endpoint: string, body?: unknown) => {
    const data = await api.put<T>(endpoint, body);
    return { data };
  },

  patch: async <T = unknown>(endpoint: string, body?: unknown) => {
    const data = await api.patch<T>(endpoint, body);
    return { data };
  },

  delete: async <T = unknown>(endpoint: string) => {
    const data = await api.delete<T>(endpoint);
    return { data };
  },
};

export default apiClient;
