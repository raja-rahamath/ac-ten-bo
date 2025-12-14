'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Receipt,
  ArrowLeft,
  Printer,
  Mail,
  Download,
  XCircle,
  CheckCircle,
  Calendar,
  User,
  FileText,
  CreditCard,
  Clock,
  AlertCircle,
  RefreshCw,
  Building2,
  Hash,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ReceiptData {
  id: string;
  receiptNo: string;
  invoiceId: string;
  invoice?: {
    id: string;
    invoiceNo: string;
    total: number;
    status: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
      email?: string;
      phone?: string;
    };
  };
  paymentId?: string;
  payment?: {
    id: string;
    paymentMethod: string;
    referenceNo?: string;
    amount: number;
    paidAt: string;
  };
  customerId: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNo?: string;
  receiptDate: string;
  description?: string;
  notes?: string;
  status: 'ACTIVE' | 'VOIDED';
  voidedAt?: string;
  voidedById?: string;
  voidedBy?: {
    firstName: string;
    lastName: string;
  };
  voidReason?: string;
  printCount: number;
  lastPrintedAt?: string;
  emailCount: number;
  lastEmailedAt?: string;
  createdById: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    fetchReceipt();
  }, [params.id]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ data: ReceiptData }>(`/receipts/${params.id}`);
      setReceipt(response.data.data);
    } catch (error) {
      console.error('Error fetching receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!receipt) return;
    try {
      setActionLoading('print');
      await apiClient.post(`/receipts/${receipt.id}/print`);
      window.print();
      fetchReceipt();
    } catch (error) {
      console.error('Error printing receipt:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmail = async () => {
    if (!receipt) return;
    try {
      setActionLoading('email');
      await apiClient.post(`/receipts/${receipt.id}/email`);
      alert('Receipt sent via email');
      fetchReceipt();
    } catch (error) {
      console.error('Error emailing receipt:', error);
      alert('Failed to send email');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVoid = async () => {
    if (!receipt || !voidReason.trim()) return;
    try {
      setActionLoading('void');
      await apiClient.post(`/receipts/${receipt.id}/void`, { reason: voidReason });
      setShowVoidModal(false);
      setVoidReason('');
      fetchReceipt();
    } catch (error) {
      console.error('Error voiding receipt:', error);
      alert('Failed to void receipt');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BHD') => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 3,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = () => {
    if (!receipt) return 'N/A';
    const customer = receipt.customer || receipt.invoice?.customer;
    if (!customer) return 'N/A';
    if (customer.companyName) return customer.companyName;
    return `${customer.firstName} ${customer.lastName}`;
  };

  const getCustomerDetails = () => {
    if (!receipt) return null;
    return receipt.customer || receipt.invoice?.customer;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: 'Cash',
      CARD: 'Card',
      BANK_TRANSFER: 'Bank Transfer',
      CHEQUE: 'Cheque',
      ONLINE: 'Online',
      BENEFIT: 'Benefit Pay',
      OTHER: 'Other',
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Receipt not found</p>
        <button
          onClick={() => router.push('/receipts')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Receipts
        </button>
      </div>
    );
  }

  const customer = getCustomerDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/receipts')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{receipt.receiptNo}</h1>
              {receipt.status === 'ACTIVE' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3" />
                  Voided
                </span>
              )}
            </div>
            <p className="text-gray-600">
              Issued on {formatDate(receipt.receiptDate)}
            </p>
          </div>
        </div>

        {receipt.status === 'ACTIVE' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={actionLoading === 'print'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === 'print' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Print
            </button>
            <button
              onClick={handleEmail}
              disabled={actionLoading === 'email'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading === 'email' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email
            </button>
            <button
              onClick={() => setShowVoidModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              <XCircle className="h-4 w-4" />
              Void
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receipt Details - Print Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-8 print:shadow-none">
            {/* Receipt Header */}
            <div className="border-b pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">RECEIPT</h2>
                  <p className="text-lg text-gray-600 mt-1">{receipt.receiptNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(receipt.receiptDate)}</p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">RECEIVED FROM</p>
                <p className="font-semibold text-gray-900">{getCustomerName()}</p>
                {customer?.email && (
                  <p className="text-sm text-gray-600">{customer.email}</p>
                )}
                {customer?.phone && (
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">FOR INVOICE</p>
                {receipt.invoice ? (
                  <Link
                    href={`/invoices/${receipt.invoiceId}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {receipt.invoice.invoiceNo}
                  </Link>
                ) : (
                  <p className="text-gray-400">-</p>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {getPaymentMethodLabel(receipt.paymentMethod)}
                  </p>
                </div>
                {receipt.referenceNo && (
                  <div>
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="font-medium text-gray-900">{receipt.referenceNo}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="border-t border-b py-6 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-600">Amount Received</span>
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(Number(receipt.amount), receipt.currency)}
                </span>
              </div>
            </div>

            {/* Description */}
            {receipt.description && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                <p className="text-gray-700">{receipt.description}</p>
              </div>
            )}

            {/* Notes */}
            {receipt.notes && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                <p className="text-gray-700">{receipt.notes}</p>
              </div>
            )}

            {/* Voided Info */}
            {receipt.status === 'VOIDED' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">This receipt has been voided</p>
                    {receipt.voidedAt && (
                      <p className="text-sm text-red-600 mt-1">
                        Voided on {formatDateTime(receipt.voidedAt)}
                        {receipt.voidedBy && (
                          <> by {receipt.voidedBy.firstName} {receipt.voidedBy.lastName}</>
                        )}
                      </p>
                    )}
                    {receipt.voidReason && (
                      <p className="text-sm text-red-700 mt-2">
                        Reason: {receipt.voidReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
              <p>Thank you for your payment</p>
              <p className="mt-1">This is a computer-generated receipt</p>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Receipt Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Printer className="h-4 w-4" />
                  <span className="text-sm">Printed</span>
                </div>
                <span className="font-medium text-gray-900">{receipt.printCount} times</span>
              </div>
              {receipt.lastPrintedAt && (
                <p className="text-xs text-gray-400 ml-6">
                  Last: {formatDateTime(receipt.lastPrintedAt)}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Emailed</span>
                </div>
                <span className="font-medium text-gray-900">{receipt.emailCount} times</span>
              </div>
              {receipt.lastEmailedAt && (
                <p className="text-xs text-gray-400 ml-6">
                  Last: {formatDateTime(receipt.lastEmailedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium text-gray-900">
                  {receipt.createdBy
                    ? `${receipt.createdBy.firstName} ${receipt.createdBy.lastName}`
                    : 'System'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium text-gray-900">{formatDateTime(receipt.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">{formatDateTime(receipt.updatedAt)}</p>
              </div>
              {receipt.paymentId && (
                <div>
                  <p className="text-sm text-gray-500">Payment ID</p>
                  <p className="font-mono text-sm text-gray-600">{receipt.paymentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Related</h3>
            <div className="space-y-3">
              {receipt.invoice && (
                <Link
                  href={`/invoices/${receipt.invoiceId}`}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View Invoice ({receipt.invoice.invoiceNo})
                </Link>
              )}
              {customer && (
                <Link
                  href={`/customers/${receipt.customerId}`}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <User className="h-4 w-4" />
                  View Customer
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Void Receipt</h3>
                <p className="text-sm text-gray-500">Receipt: {receipt.receiptNo}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to void this receipt? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for voiding <span className="text-red-500">*</span>
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter the reason for voiding this receipt..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setVoidReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || actionLoading === 'void'}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === 'void' && <RefreshCw className="h-4 w-4 animate-spin" />}
                Void Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
