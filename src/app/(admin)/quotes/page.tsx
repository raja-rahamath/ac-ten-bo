'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface Quote {
  id: string;
  quoteNo: string;
  title: string;
  version: number;
  status: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  currency: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  customer: {
    id: string;
    customerType: string;
    firstName?: string;
    lastName?: string;
    orgName?: string;
  };
  unit?: {
    unitNo: string;
    building: { name?: string };
  };
  items: Array<{ id: string }>;
  _count?: { revisions: number };
}

interface QuoteStats {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  convertedQuotes: number;
  totalValue: number;
  acceptedValue: number;
  conversionRate: number;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  VIEWED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  REVISED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CONVERTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  SENT: 'Sent',
  VIEWED: 'Viewed',
  REVISED: 'Revised',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CONVERTED: 'Converted',
  CANCELLED: 'Cancelled',
};

export default function QuotesPage() {
  const { t } = useLanguage();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, activeTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/quotes/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);

      // Handle tab filters
      if (activeTab === 'draft') params.append('status', 'DRAFT');
      else if (activeTab === 'sent') params.append('status', 'SENT');
      else if (activeTab === 'accepted') params.append('status', 'ACCEPTED');
      else if (activeTab === 'expired') params.append('status', 'EXPIRED');
      else if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `${API_URL}/quotes?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customer: Quote['customer']) => {
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  };

  const formatCurrency = (amount: string | number, currency: string = 'BHD') => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 3,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (validUntil: string, status: string) => {
    if (!['SENT', 'VIEWED'].includes(status)) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const tabs = [
    { id: 'all', label: 'All Quotes', count: stats?.totalQuotes },
    { id: 'draft', label: 'Drafts', count: stats?.draftQuotes },
    { id: 'sent', label: 'Sent', count: stats?.sentQuotes },
    { id: 'accepted', label: 'Accepted', count: stats?.acceptedQuotes },
    { id: 'expired', label: 'Expired', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">
            Quote Management
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Create, manage, and track quotes with versioning
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Total Quotes</p>
                <p className="text-2xl font-bold text-dark-800 dark:text-white mt-1">
                  {stats.totalQuotes}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Accepted Value</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(stats.acceptedValue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-dark-800 dark:text-white mt-1">
                  {stats.conversionRate}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Pending Response</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {stats.sentQuotes}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-dark-200 dark:border-dark-700">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-dark-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count !== null && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-dark-100 dark:bg-dark-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by quote number, title, or customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {activeTab === 'all' && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Quotes Table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-dark-300 dark:text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-dark-800 dark:text-white">No quotes found</h3>
            <p className="mt-1 text-dark-500 dark:text-dark-400">Get started by creating a new quote.</p>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Quote
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Quote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50">
                    <td className="px-6 py-4">
                      <Link href={`/quotes/${quote.id}`} className="group">
                        <div className="font-medium text-dark-800 dark:text-white group-hover:text-primary-500">
                          {quote.quoteNo}
                        </div>
                        <div className="text-sm text-dark-500 dark:text-dark-400">
                          {quote.title}
                        </div>
                        {quote.version > 1 && (
                          <span className="inline-flex items-center mt-1 text-xs text-purple-600 dark:text-purple-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Version {quote.version}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-dark-800 dark:text-white">
                        {getCustomerName(quote.customer)}
                      </div>
                      {quote.unit && (
                        <div className="text-sm text-dark-500 dark:text-dark-400">
                          {quote.unit.unitNo}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                          {statusLabels[quote.status]}
                        </span>
                        {isExpiringSoon(quote.validUntil, quote.status) && (
                          <span className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Expiring soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-dark-800 dark:text-white font-medium">
                        {formatCurrency(quote.total, quote.currency)}
                      </div>
                      <div className="text-xs text-dark-500 dark:text-dark-400">
                        {quote.items.length} item(s)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-dark-800 dark:text-white">
                        {formatDate(quote.validUntil)}
                      </div>
                      <div className="text-xs text-dark-500 dark:text-dark-400">
                        Created: {formatDate(quote.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="p-2 text-dark-400 hover:text-primary-500 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                          title="View"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {quote.status === 'DRAFT' && (
                          <Link
                            href={`/quotes/${quote.id}/edit`}
                            className="p-2 text-dark-400 hover:text-blue-500 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-100 dark:border-dark-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-dark-500 dark:text-dark-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
