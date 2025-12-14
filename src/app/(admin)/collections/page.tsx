'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Payment {
  id: string;
  paymentNo: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  receivedAt: string;
  invoice: {
    id: string;
    invoiceNo: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
      orgName?: string;
    };
  };
  receipt?: {
    id: string;
    receiptNo: string;
  };
}

interface CollectionStats {
  totalCollected: number;
  totalPayments: number;
  byMethod: Array<{ method: string; amount: number; count: number }>;
  trend: Array<{ date: string; total: number; count: number }>;
  recentPayments: Payment[];
}

export default function CollectionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    paymentMethod: '',
    fromDate: '',
    toDate: '',
    search: '',
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [page]);

  async function fetchPayments() {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (filter.paymentMethod) params.append('paymentMethod', filter.paymentMethod);
      if (filter.fromDate) params.append('fromDate', filter.fromDate);
      if (filter.toDate) params.append('toDate', filter.toDate);
      if (filter.search) params.append('search', filter.search);

      const response = await fetch(`${API_URL}/collections?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setPayments(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      if (filter.fromDate) params.append('fromDate', filter.fromDate);
      if (filter.toDate) params.append('toDate', filter.toDate);

      const response = await fetch(`${API_URL}/collections/stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  function handleFilter() {
    setPage(1);
    fetchPayments();
    fetchStats();
  }

  function formatCurrency(amount: number | undefined) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
    }).format(amount || 0);
  }

  function getMethodColor(method: string) {
    const colors: Record<string, string> = {
      CASH: 'bg-green-100 text-green-800',
      CARD: 'bg-blue-100 text-blue-800',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800',
      CHEQUE: 'bg-yellow-100 text-yellow-800',
      ONLINE: 'bg-indigo-100 text-indigo-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  }

  function getMethodLabel(method: string) {
    const labels: Record<string, string> = {
      CASH: 'Cash',
      CARD: 'Card',
      BANK_TRANSFER: 'Bank Transfer',
      CHEQUE: 'Cheque',
      ONLINE: 'Online',
    };
    return labels[method] || method;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Collections</h1>
        <Button asChild>
          <Link href="/collections/daily-report">Daily Report</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
            <p className="text-xs text-gray-400">{stats.totalPayments} payments</p>
          </div>
          {stats.byMethod.slice(0, 3).map((method) => (
            <div key={method.method} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">{getMethodLabel(method.method)}</p>
              <p className="text-2xl font-bold">{formatCurrency(method.amount)}</p>
              <p className="text-xs text-gray-400">{method.count} payments</p>
            </div>
          ))}
        </div>
      )}

      {/* Collection Trend Chart (Simple) */}
      {stats?.trend && stats.trend.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold">Last 7 Days Collection Trend</h3>
          <div className="flex items-end gap-2 h-32">
            {(stats.trend as any[]).map((day: any, index: number) => {
              const maxAmount = Math.max(...(stats.trend as any[]).map((d: any) => Number(d.total) || 0));
              const height = maxAmount > 0 ? ((Number(day.total) || 0) / maxAmount) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary/80 rounded-t"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={formatCurrency(Number(day.total) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by payment/invoice no..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={filter.paymentMethod}
            onChange={(e) => setFilter({ ...filter, paymentMethod: e.target.value })}
            className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ONLINE">Online</option>
          </select>
          <input
            type="date"
            placeholder="From Date"
            value={filter.fromDate}
            onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
            className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="date"
            placeholder="To Date"
            value={filter.toDate}
            onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
            className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button onClick={handleFilter}>Filter</Button>
          <Button
            variant="outline"
            onClick={() => {
              setFilter({ paymentMethod: '', fromDate: '', toDate: '', search: '' });
              setPage(1);
              setTimeout(() => {
                fetchPayments();
                fetchStats();
              }, 0);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl bg-white shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No payments found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-500">
                    <th className="px-6 py-4 font-medium">Payment #</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Invoice</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Reference</th>
                    <th className="px-6 py-4 font-medium">Receipt</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{payment.paymentNo}</td>
                      <td className="px-6 py-4">
                        {payment.invoice.customer ? (
                          <Link
                            href={`/customers/${payment.invoice.customer.id}`}
                            className="hover:text-primary"
                          >
                            {payment.invoice.customer.orgName ||
                              `${payment.invoice.customer.firstName} ${payment.invoice.customer.lastName}`}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/invoices/${payment.invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {payment.invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getMethodColor(
                            payment.paymentMethod
                          )}`}
                        >
                          {getMethodLabel(payment.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{payment.reference || '-'}</td>
                      <td className="px-6 py-4">
                        {payment.receipt ? (
                          <Link
                            href={`/receipts/${payment.receipt.id}`}
                            className="text-primary hover:underline"
                          >
                            {payment.receipt.receiptNo}
                          </Link>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(payment.receivedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
