import { aiApi } from '../api';
import type { ChatMessage, ChatRequest, ChatResponse } from '@/types';

export interface ConversationContext {
  currentPage?: string;
  selectedEntity?: {
    type: 'customer' | 'employee' | 'service-request' | 'invoice';
    id: string;
  };
  filters?: Record<string, unknown>;
}

export const aiChatService = {
  async sendMessage(
    message: string,
    conversationId?: string,
    context?: ConversationContext
  ): Promise<ChatResponse> {
    const payload: ChatRequest & { context?: ConversationContext } = {
      message,
      conversationId,
    };

    if (context) {
      payload.context = context;
    }

    return aiApi.post<ChatResponse>('/chat', payload);
  },

  async getConversationHistory(conversationId: string): Promise<{ success: boolean; data: ChatMessage[] }> {
    return aiApi.get<{ success: boolean; data: ChatMessage[] }>(`/chat/${conversationId}/history`);
  },

  async startNewConversation(): Promise<{ success: boolean; data: { conversationId: string } }> {
    return aiApi.post<{ success: boolean; data: { conversationId: string } }>('/chat/new');
  },

  async endConversation(conversationId: string): Promise<{ success: boolean }> {
    return aiApi.post<{ success: boolean }>(`/chat/${conversationId}/end`);
  },

  async provideFeedback(
    conversationId: string,
    messageId: string,
    feedback: 'positive' | 'negative',
    comment?: string
  ): Promise<{ success: boolean }> {
    return aiApi.post<{ success: boolean }>(`/chat/${conversationId}/feedback`, {
      messageId,
      feedback,
      comment,
    });
  },

  // Helper to format AI messages for display
  formatMessage(message: string): string {
    // Convert markdown-like formatting to plain text or HTML
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br />');
  },

  // Common prompts for back office operations
  prompts: {
    createServiceRequest: 'I need to create a new service request',
    findCustomer: 'Help me find a customer',
    checkSchedule: 'Show me the schedule for today',
    assignTechnician: 'I need to assign a technician to a request',
    generateInvoice: 'Generate an invoice for a completed service',
    viewPendingRequests: 'Show me all pending service requests',
    overdueInvoices: 'List all overdue invoices',
    employeeAvailability: 'Check employee availability for scheduling',
  },
};
