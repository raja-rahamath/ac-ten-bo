import { api } from '../api';
import type { Invoice, ApiResponse, PaginatedResponse, InvoiceStatus, Payment, PaymentMethod } from '@/types';

export interface InvoiceFilters {
  status?: InvoiceStatus;
  customerId?: string;
  serviceRequestId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvoiceData {
  serviceRequestId: string;
  customerId: string;
  dueDate?: string;
  notes?: string;
  items: {
    itemType: 'SERVICE' | 'MATERIAL' | 'LABOR';
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceData {
  status?: InvoiceStatus;
  dueDate?: string;
  notes?: string;
  taxAmount?: number;
  discountAmount?: number;
}

export interface RecordPaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

export const invoiceService = {
  async getAll(filters: InvoiceFilters = {}): Promise<PaginatedResponse<Invoice>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    return api.get<PaginatedResponse<Invoice>>(`/invoices?${params.toString()}`);
  },

  async getById(id: string): Promise<ApiResponse<Invoice>> {
    return api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  },

  async create(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    return api.post<ApiResponse<Invoice>>('/invoices', data);
  },

  async update(id: string, data: UpdateInvoiceData): Promise<ApiResponse<Invoice>> {
    return api.patch<ApiResponse<Invoice>>(`/invoices/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/invoices/${id}`);
  },

  async send(id: string): Promise<ApiResponse<Invoice>> {
    return api.post<ApiResponse<Invoice>>(`/invoices/${id}/send`);
  },

  async recordPayment(invoiceId: string, data: RecordPaymentData): Promise<ApiResponse<Payment>> {
    return api.post<ApiResponse<Payment>>(`/invoices/${invoiceId}/payments`, data);
  },

  async getPayments(invoiceId: string): Promise<ApiResponse<Payment[]>> {
    return api.get<ApiResponse<Payment[]>>(`/invoices/${invoiceId}/payments`);
  },

  async downloadPdf(invoiceId: string): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}/pdf`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });
    return response.blob();
  },

  async getStats(): Promise<ApiResponse<{
    totalPending: number;
    totalOverdue: number;
    totalPaid: number;
    revenue: number;
    pendingAmount: number;
  }>> {
    return api.get<ApiResponse<{
      totalPending: number;
      totalOverdue: number;
      totalPaid: number;
      revenue: number;
      pendingAmount: number;
    }>>('/invoices/stats');
  },
};
