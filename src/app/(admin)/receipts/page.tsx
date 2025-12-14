'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Printer,
  Mail,
  Eye,
  XCircle,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ReceiptData {
  id: string;
  receiptNo: string;
  invoiceId: string;
  invoice?: {
    invoiceNo: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  };
  paymentId?: string;
  payment?: {
    paymentMethod: string;
    referenceNo?: string;
  };
  customerId: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNo?: string;
  receiptDate: string;
  description?: string;
  status: 'ACTIVE' | 'VOIDED';
  voidedAt?: string;
  voidReason?: string;
  printCount: number;
  lastPrintedAt?: string;
  emailCount: number;
  lastEmailedAt?: string;
  createdAt: string;
}

interface ReceiptStats {
  total: number;
  totalAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
  voided: number;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [stats, setStats] = useState<ReceiptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await apiClient.get<{ data: ReceiptData[]; pagination?: { totalPages: number } }>(`/receipts?${params.toString()}`);
      setReceipts(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo, page]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<{ data: ReceiptStats }>('/receipts/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchStats();
  }, [fetchReceipts]);

  const handleVoid = async () => {
    if (!selectedReceipt || !voidReason.trim()) return;

    try {
      setActionLoading('void');
      await apiClient.post(`/receipts/${selectedReceipt.id}/void`, { reason: voidReason });
      setShowVoidModal(false);
      setVoidReason('');
      setSelectedReceipt(null);
      fetchReceipts();
      fetchStats();
    } catch (error) {
      console.error('Error voiding receipt:', error);
      alert('Failed to void receipt');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = async (receipt: ReceiptData) => {
    try {
      setActionLoading(receipt.id);
      await apiClient.post(`/receipts/${receipt.id}/print`);
      // Open print dialog or download PDF
      window.print();
      fetchReceipts();
    } catch (error) {
      console.error('Error printing receipt:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEmail = async (receipt: ReceiptData) => {
    try {
      setActionLoading(receipt.id);
      await apiClient.post(`/receipts/${receipt.id}/email`);
      alert('Receipt sent via email');
      fetchReceipts();
    } catch (error) {
      console.error('Error emailing receipt:', error);
      alert('Failed to send email');
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getCustomerName = (receipt: ReceiptData) => {
    const customer = receipt.customer || receipt.invoice?.customer;
    if (!customer) return 'N/A';
    if (customer.companyName) return customer.companyName;
    return `${customer.firstName} ${customer.lastName}`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600">Manage payment receipts and acknowledgments</p>
        </div>
        <button
          onClick={() => fetchReceipts()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Receipts</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-xl font-bold text-gray-900">{stats.thisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Month Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.thisMonthAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Voided</p>
                <p className="text-xl font-bold text-gray-900">{stats.voided}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by receipt number, invoice, or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="From"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="text-gray-500">Loading receipts...</span>
                    </div>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No receipts found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Receipts are automatically generated when payments are recorded
                    </p>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className={`hover:bg-gray-50 ${receipt.status === 'VOIDED' ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{receipt.receiptNo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(receipt.receiptDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getCustomerName(receipt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {receipt.invoice ? (
                        <Link
                          href={`/invoices/${receipt.invoiceId}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {receipt.invoice.invoiceNo}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {getPaymentMethodLabel(receipt.paymentMethod)}
                      </span>
                      {receipt.referenceNo && (
                        <p className="text-xs text-gray-400">{receipt.referenceNo}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(Number(receipt.amount), receipt.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/receipts/${receipt.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {receipt.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handlePrint(receipt)}
                              disabled={actionLoading === receipt.id}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEmail(receipt)}
                              disabled={actionLoading === receipt.id}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReceipt(receipt);
                                setShowVoidModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Void"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Void Modal */}
      {showVoidModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Void Receipt</h3>
                <p className="text-sm text-gray-500">Receipt: {selectedReceipt.receiptNo}</p>
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
                  setSelectedReceipt(null);
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
