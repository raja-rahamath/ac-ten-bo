import { api } from '../api';
import type {
  ServiceRequestComment,
  CreateCommentInput,
  AddCallCommentInput,
  ApiResponse,
} from '@/types';

export const commentService = {
  async getByServiceRequest(serviceRequestId: string): Promise<ServiceRequestComment[]> {
    const response = await api.get<ServiceRequestComment[]>(
      `/comments/service-request/${serviceRequestId}`
    );
    return response as unknown as ServiceRequestComment[];
  },

  async create(data: CreateCommentInput): Promise<ServiceRequestComment> {
    const response = await api.post<ServiceRequestComment>('/comments', data);
    return response as unknown as ServiceRequestComment;
  },

  async addCallComment(data: AddCallCommentInput): Promise<ServiceRequestComment> {
    const response = await api.post<ServiceRequestComment>('/comments/call', data);
    return response as unknown as ServiceRequestComment;
  },

  async update(
    id: string,
    data: Partial<Pick<CreateCommentInput, 'content' | 'isInternal' | 'preferredDate' | 'preferredTime'>>
  ): Promise<ServiceRequestComment> {
    const response = await api.put<ServiceRequestComment>(`/comments/${id}`, data);
    return response as unknown as ServiceRequestComment;
  },

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/comments/${id}`);
  },

  async getCallLogs(serviceRequestId: string, limit = 10): Promise<ServiceRequestComment[]> {
    const response = await api.get<ServiceRequestComment[]>(
      `/comments/service-request/${serviceRequestId}/call-logs?limit=${limit}`
    );
    return response as unknown as ServiceRequestComment[];
  },

  async getWithSchedulingPreferences(serviceRequestId: string): Promise<ServiceRequestComment[]> {
    const response = await api.get<ServiceRequestComment[]>(
      `/comments/service-request/${serviceRequestId}/scheduling`
    );
    return response as unknown as ServiceRequestComment[];
  },
};
