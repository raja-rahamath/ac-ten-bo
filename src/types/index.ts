// User & Auth types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  roleId?: string;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
}

// Employee types
export interface Employee {
  id: string;
  userId?: string;
  user?: User;
  employeeNo: string;
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
  jobTitle?: JobTitle;
  companyId?: string;
  company?: Company;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
  managerId?: string;
  hasSystemAccess: boolean;
  isActive: boolean;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobTitle {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

// Company & Organization types
export interface Company {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  isActive: boolean;
}

export interface Division {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  code?: string;
  isActive: boolean;
}

export interface Department {
  id: string;
  divisionId: string;
  name: string;
  nameAr?: string;
  code?: string;
  isActive: boolean;
}

// Customer types
export type CustomerType = 'INDIVIDUAL' | 'ORGANIZATION';

export interface Customer {
  id: string;
  userId?: string;
  user?: User;
  customerNo: string;
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  orgName?: string;
  orgNameAr?: string;
  email: string;
  phone?: string;
  altPhone?: string;
  nationalId?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  properties?: CustomerProperty[];
}

export interface CustomerProperty {
  customerId: string;
  propertyId: string;
  property: Property;
  ownershipType: 'OWNER' | 'TENANT';
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
}

// Property types
export interface Property {
  id: string;
  propertyNo: string;
  name: string;
  nameAr?: string;
  typeId: string;
  type?: PropertyType;
  zoneId?: string;
  zone?: Zone;
  address?: string;
  addressAr?: string;
  building?: string;
  floor?: string;
  unit?: string;
  area?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyType {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

// Geographic types
export interface Zone {
  id: string;
  governorateId: string;
  governorate?: Governorate;
  name: string;
  nameAr?: string;
  code?: string;
  headId?: string;
  head?: Employee;
  isActive: boolean;
}

export interface Governorate {
  id: string;
  districtId: string;
  name: string;
  nameAr?: string;
  code?: string;
}

// Asset types
export interface Asset {
  id: string;
  assetNo: string;
  propertyId: string;
  property?: Property;
  roomId?: string;
  typeId: string;
  type?: AssetType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  installDate?: string;
  warrantyEndDate?: string;
  amcEndDate?: string;
  specifications?: Record<string, unknown>;
  qrCode?: string;
  isActive: boolean;
}

export interface AssetType {
  id: string;
  name: string;
  nameAr?: string;
  icon?: string;
  isActive: boolean;
}

// Service Request types
export type RequestType = 'ON_CALL' | 'EMERGENCY' | 'AMC' | 'WARRANTY';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type RequestStatus = 'NEW' | 'ASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'INVOICED' | 'CLOSED' | 'CANCELLED';
export type RequestSource = 'PORTAL' | 'MOBILE' | 'AI_CHAT' | 'PHONE' | 'EMAIL' | 'WALK_IN';

export interface ServiceRequest {
  id: string;
  requestNo: string;
  customerId: string;
  customer?: Customer;
  propertyId: string;
  property?: Property;
  assetId?: string;
  asset?: Asset;
  zoneId: string;
  zone?: Zone;
  complaintTypeId: string;
  complaintType?: ComplaintType;
  requestType: RequestType;
  priority: Priority;
  status: RequestStatus;
  source: RequestSource;
  title: string;
  description?: string;
  customerNotes?: string;
  internalNotes?: string;
  assignedToId?: string;
  assignedTo?: Employee;
  slaStartAt?: string;
  slaDueAt?: string;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline?: RequestTimeline[];
  attachments?: RequestAttachment[];
}

export interface ComplaintType {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  isActive: boolean;
}

export interface RequestTimeline {
  id: string;
  serviceRequestId: string;
  action: string;
  description?: string;
  performedBy?: string;
  createdAt: string;
}

export interface RequestAttachment {
  id: string;
  serviceRequestId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy?: string;
  createdAt: string;
}

// Schedule types
export type ScheduleStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface Schedule {
  id: string;
  serviceRequestId: string;
  serviceRequest?: ServiceRequest;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  status: ScheduleStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  team?: ScheduleTeam[];
}

export interface ScheduleTeam {
  scheduleId: string;
  employeeId: string;
  employee?: Employee;
  isLead: boolean;
}

// Invoice types
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE';

export interface Invoice {
  id: string;
  invoiceNo: string;
  serviceRequestId: string;
  serviceRequest?: ServiceRequest;
  customerId: string;
  customer?: Customer;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'SERVICE' | 'MATERIAL' | 'LABOR';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentNo: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  receivedBy: string;
  receivedAt: string;
}

// Quotation types
export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface Quotation {
  id: string;
  quotationNo: string;
  serviceRequestId: string;
  serviceRequest?: ServiceRequest;
  status: QuotationStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  validUntil?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  itemType: 'SERVICE' | 'MATERIAL' | 'LABOR';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Inventory types
export interface InventoryItem {
  id: string;
  itemNo: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  category?: InventoryCategory;
  description?: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
}

export interface InventoryCategory {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// AI Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    conversationId: string;
    actionTaken?: {
      type: string;
      data: Record<string, unknown>;
    };
  };
}
