import { api } from '../api';
import type {
  ServiceRequest,
  ApiResponse,
  PaginatedResponse,
  Priority,
  RequestStatus,
  RequestType,
} from '@/types';

export interface ServiceRequestFilters {
  status?: RequestStatus;
  priority?: Priority;
  requestType?: RequestType;
  customerId?: string;
  zoneId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateServiceRequestData {
  customerId: string;
  propertyId: string;
  assetId?: string;
  zoneId: string;
  complaintTypeId: string;
  requestType?: RequestType;
  priority?: Priority;
  title: string;
  description?: string;
  customerNotes?: string;
}

export interface UpdateServiceRequestData {
  status?: RequestStatus;
  priority?: Priority;
  assignedToId?: string;
  internalNotes?: string;
  description?: string;
}

export const serviceRequestService = {
  async getAll(filters: ServiceRequestFilters = {}): Promise<PaginatedResponse<ServiceRequest>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get<PaginatedResponse<ServiceRequest>>(`/service-requests?${params.toString()}`);
  },

  async getById(id: string): Promise<ApiResponse<ServiceRequest>> {
    return api.get<ApiResponse<ServiceRequest>>(`/service-requests/${id}`);
  },

  async create(data: CreateServiceRequestData): Promise<ApiResponse<ServiceRequest>> {
    return api.post<ApiResponse<ServiceRequest>>('/service-requests', data);
  },

  async update(id: string, data: UpdateServiceRequestData): Promise<ApiResponse<ServiceRequest>> {
    return api.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/service-requests/${id}`);
  },

  async assign(id: string, employeeId: string): Promise<ApiResponse<ServiceRequest>> {
    return api.post<ApiResponse<ServiceRequest>>(`/service-requests/${id}/assign`, { employeeId });
  },

  async updateStatus(id: string, status: RequestStatus, notes?: string): Promise<ApiResponse<ServiceRequest>> {
    return api.post<ApiResponse<ServiceRequest>>(`/service-requests/${id}/status`, { status, notes });
  },

  async getTimeline(id: string): Promise<ApiResponse<ServiceRequest['timeline']>> {
    return api.get<ApiResponse<ServiceRequest['timeline']>>(`/service-requests/${id}/timeline`);
  },

  async addNote(id: string, note: string, isInternal: boolean = true): Promise<ApiResponse<void>> {
    return api.post<ApiResponse<void>>(`/service-requests/${id}/notes`, { note, isInternal });
  },

  async getDashboardStats(): Promise<ApiResponse<{
    total: number;
    new: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }>> {
    return api.get<ApiResponse<{
      total: number;
      new: number;
      inProgress: number;
      completed: number;
      overdue: number;
    }>>('/service-requests/stats');
  },
};
