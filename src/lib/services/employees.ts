import { api } from '../api';
import type { Employee, ApiResponse, PaginatedResponse, JobTitle, Zone } from '@/types';

export interface EmployeeFilters {
  isActive?: boolean;
  hasSystemAccess?: boolean;
  departmentId?: string;
  jobTitleId?: string;
  zoneId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  email: string;
  phone?: string;
  nationalId?: string;
  dateOfBirth?: string;
  hireDate?: string;
  jobTitleId?: string;
  companyId?: string;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
  managerId?: string;
  hasSystemAccess?: boolean;
}

export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  phone?: string;
  nationalId?: string;
  dateOfBirth?: string;
  jobTitleId?: string;
  departmentId?: string;
  sectionId?: string;
  managerId?: string;
  hasSystemAccess?: boolean;
  isActive?: boolean;
}

export const employeeService = {
  async getAll(filters: EmployeeFilters = {}): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get<PaginatedResponse<Employee>>(`/employees?${params.toString()}`);
  },

  async getById(id: string): Promise<ApiResponse<Employee>> {
    return api.get<ApiResponse<Employee>>(`/employees/${id}`);
  },

  async create(data: CreateEmployeeData): Promise<ApiResponse<Employee>> {
    return api.post<ApiResponse<Employee>>('/employees', data);
  },

  async update(id: string, data: UpdateEmployeeData): Promise<ApiResponse<Employee>> {
    return api.patch<ApiResponse<Employee>>(`/employees/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/employees/${id}`);
  },

  async getJobTitles(): Promise<ApiResponse<JobTitle[]>> {
    return api.get<ApiResponse<JobTitle[]>>('/job-titles');
  },

  async getZones(): Promise<ApiResponse<Zone[]>> {
    return api.get<ApiResponse<Zone[]>>('/zones');
  },

  async assignToZone(employeeId: string, zoneId: string, isPrimary: boolean = false): Promise<ApiResponse<void>> {
    return api.post<ApiResponse<void>>(`/employees/${employeeId}/zones`, { zoneId, isPrimary });
  },

  async removeFromZone(employeeId: string, zoneId: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/employees/${employeeId}/zones/${zoneId}`);
  },

  async getSchedule(employeeId: string, startDate: string, endDate: string): Promise<ApiResponse<unknown[]>> {
    return api.get<ApiResponse<unknown[]>>(
      `/employees/${employeeId}/schedule?startDate=${startDate}&endDate=${endDate}`
    );
  },

  async updateLocation(employeeId: string, latitude: number, longitude: number): Promise<ApiResponse<void>> {
    return api.post<ApiResponse<void>>(`/employees/${employeeId}/location`, { latitude, longitude });
  },

  async search(query: string): Promise<ApiResponse<Employee[]>> {
    return api.get<ApiResponse<Employee[]>>(`/employees/search?q=${encodeURIComponent(query)}`);
  },
};
