import { api } from '../api';
import type { Customer, ApiResponse, PaginatedResponse, CustomerType } from '@/types';

export interface CustomerFilters {
  customerType?: CustomerType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateCustomerData {
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  orgName?: string;
  email: string;
  phone?: string;
  altPhone?: string;
  nationalId?: string;
}

export interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  orgName?: string;
  phone?: string;
  altPhone?: string;
  nationalId?: string;
  isActive?: boolean;
}

export const customerService = {
  async getAll(filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get<PaginatedResponse<Customer>>(`/customers?${params.toString()}`);
  },

  async getById(id: string): Promise<ApiResponse<Customer>> {
    return api.get<ApiResponse<Customer>>(`/customers/${id}`);
  },

  async create(data: CreateCustomerData): Promise<ApiResponse<Customer>> {
    return api.post<ApiResponse<Customer>>('/customers', data);
  },

  async update(id: string, data: UpdateCustomerData): Promise<ApiResponse<Customer>> {
    return api.patch<ApiResponse<Customer>>(`/customers/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/customers/${id}`);
  },

  async getProperties(customerId: string): Promise<ApiResponse<Customer['properties']>> {
    return api.get<ApiResponse<Customer['properties']>>(`/customers/${customerId}/properties`);
  },

  async getServiceRequests(customerId: string): Promise<PaginatedResponse<Customer>> {
    return api.get<PaginatedResponse<Customer>>(`/customers/${customerId}/service-requests`);
  },

  async search(query: string): Promise<ApiResponse<Customer[]>> {
    return api.get<ApiResponse<Customer[]>>(`/customers/search?q=${encodeURIComponent(query)}`);
  },
};
