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
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PARTIAL: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.byStatus['SENT']?.amount || 0)}
            </p>
            <p className="text-xs text-gray-400">{stats.byStatus['SENT']?.count || 0} invoices</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Partial Paid</p>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.byStatus['PARTIAL']?.amount || 0)}
            </p>
            <p className="text-xs text-gray-400">{stats.byStatus['PARTIAL']?.count || 0} invoices</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.byStatus['OVERDUE']?.amount || 0)}
            </p>
            <p className="text-xs text-gray-400">{stats.byStatus['OVERDUE']?.count || 0} invoices</p>
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
            className="rounded-lg border px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`rounded-full px-4 py-2 text-sm ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl bg-white shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No invoices found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-500">
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
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                          {invoice.invoiceNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {invoice.customer ? (
                          <Link href={`/customers/${invoice.customer.id}`} className="hover:text-primary">
                            {invoice.customer.orgName || `${invoice.customer.firstName} ${invoice.customer.lastName}`}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {invoice.serviceRequest ? (
                          <Link href={`/requests/${invoice.serviceRequest.id}`} className="text-primary hover:underline">
                            {invoice.serviceRequest.requestNo}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(invoice.total)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={invoice.paidAmount ? 'text-green-600' : 'text-gray-400'}>
                          {formatCurrency(invoice.paidAmount || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isOverdue(invoice) ? 'bg-red-100 text-red-800' : getStatusColor(invoice.status)
                        }`}>
                          {isOverdue(invoice) ? 'OVERDUE' : invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {invoice.dueDate ? (
                          <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : ''}>
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/invoices/${invoice.id}`} className="text-primary hover:underline">
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
