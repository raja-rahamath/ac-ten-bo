export { authService } from './auth';
export { serviceRequestService } from './service-requests';
export { customerService } from './customers';
export { employeeService } from './employees';
export { invoiceService } from './invoices';
export { aiChatService } from './ai-chat';

// Re-export types for convenience
export type { ServiceRequestFilters, CreateServiceRequestData, UpdateServiceRequestData } from './service-requests';
export type { CustomerFilters, CreateCustomerData, UpdateCustomerData } from './customers';
export type { EmployeeFilters, CreateEmployeeData, UpdateEmployeeData } from './employees';
export type { InvoiceFilters, CreateInvoiceData, UpdateInvoiceData, RecordPaymentData } from './invoices';
