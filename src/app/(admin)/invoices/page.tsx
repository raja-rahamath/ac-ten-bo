'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Invoice {
  id: string;
  invoiceNo: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  customer?: { id: string; firstName: string; lastName: string; orgName?: string };
  serviceRequest?: { id: string; requestNo: string; title: string };
}

interface InvoiceStats {
  total: number;
  byStatus: Record<string, { count: number; amount: number }>;
  totalRevenue: number;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [page, filter]);

  async function fetchInvoices() {
    try {
      const token = localStorage.getItem('accessToken');
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(
        `http://localhost:4001/api/v1/invoices?page=${page}&limit=20${statusParam}${searchParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/invoices/stats', {
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchInvoices();
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  function formatCurrency(amount: number | undefined) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
    }).format(amount || 0);
  }

  function isOverdue(invoice: Invoice) {
    if (!invoice.dueDate || ['PAID', 'CANCELLED'].includes(invoice.status)) return false;
    return new Date(invoice.dueDate) < new Date();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Button asChild>
          <Link href="/invoices/new">+ New Invoice</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white dark:bg-dark-800 p-4 shadow-sm border border-dark-100 dark:border-dark-700">
            <p className="text-sm text-dark-500 dark:text-dark-400">Total Invoices</p>
            <p className="text-2xl font-bold text-dark-800 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-dark-800 p-4 shadow-sm border border-dark-100 dark:border-dark-700">
            <p className="text-sm text-dark-500 dark:text-dark-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-dark-800 p-4 shadow-sm border border-dark-100 dark:border-dark-700">
            <p className="text-sm text-dark-500 dark:text-dark-400">Pending</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(stats.byStatus['SENT']?.amount || 0)}
            </p>
            <p className="text-xs text-dark-400 dark:text-dark-500">{stats.byStatus['SENT']?.count || 0} invoices</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-dark-800 p-4 shadow-sm border border-dark-100 dark:border-dark-700">
            <p className="text-sm text-dark-500 dark:text-dark-400">Partial Paid</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(stats.byStatus['PARTIAL']?.amount || 0)}
            </p>
            <p className="text-xs text-dark-400 dark:text-dark-500">{stats.byStatus['PARTIAL']?.count || 0} invoices</p>
          </div>
          <div className="rounded-xl bg-white dark:bg-dark-800 p-4 shadow-sm border border-dark-100 dark:border-dark-700">
            <p className="text-sm text-dark-500 dark:text-dark-400">Overdue</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.byStatus['OVERDUE']?.amount || 0)}
            </p>
            <p className="text-xs text-dark-400 dark:text-dark-500">{stats.byStatus['OVERDUE']?.count || 0} invoices</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
        {isLoading ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2" />
            Loading...
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">No invoices found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500 dark:text-dark-400">
                    <th className="px-6 py-4 font-medium">Invoice #</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Service Request</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 font-medium text-right">Paid</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Due Date</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-dark-100 dark:border-dark-700 last:border-0 hover:bg-dark-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4">
                        <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                          {invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">
                        {invoice.customer ? (
                          <Link href={`/customers/${invoice.customer.id}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                            {invoice.customer.orgName || `${invoice.customer.firstName} ${invoice.customer.lastName}`}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {invoice.serviceRequest ? (
                          <Link href={`/requests/${invoice.serviceRequest.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                            {invoice.serviceRequest.requestNo}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-dark-800 dark:text-white">{formatCurrency(invoice.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={invoice.paidAmount ? 'text-green-600 dark:text-green-400' : 'text-dark-400 dark:text-dark-500'}>
                          {formatCurrency(invoice.paidAmount || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isOverdue(invoice) ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : getStatusColor(invoice.status)
                        }`}>
                          {isOverdue(invoice) ? 'OVERDUE' : invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-dark-500 dark:text-dark-400">
                        {invoice.dueDate ? (
                          <span className={isOverdue(invoice) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/invoices/${invoice.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-dark-100 dark:border-dark-700 px-6 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 disabled:opacity-50 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Previous
                </button>
                <span className="text-sm text-dark-500 dark:text-dark-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 disabled:opacity-50 hover:bg-dark-50 dark:hover:bg-dark-700"
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
