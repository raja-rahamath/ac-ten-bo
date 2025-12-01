'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quote {
  id: string;
  quoteNo: string;
  title: string;
  description?: string;
  version: number;
  status: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discountType?: string;
  discountValue: string;
  discountAmount: string;
  total: string;
  currency: string;
  validFrom: string;
  validUntil: string;
  terms?: string;
  notes?: string;
  internalNotes?: string;
  customerResponse?: string;
  responseNotes?: string;
  sentAt?: string;
  approvedAt?: string;
  convertedAt?: string;
  createdAt: string;
  customer: {
    id: string;
    customerType: string;
    customerNo: string;
    firstName?: string;
    lastName?: string;
    orgName?: string;
    email?: string;
    phone?: string;
  };
  unit?: {
    unitNo: string;
    building: { name?: string; buildingNumber: string };
  };
  items: Array<{
    id: string;
    itemType: string;
    name: string;
    description?: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    discountAmount: string;
    taxAmount: string;
    subtotal: string;
    total: string;
  }>;
  activities: Array<{
    id: string;
    action: string;
    description?: string;
    createdAt: string;
    performedBy?: { firstName: string; lastName: string };
  }>;
  revisions: Array<{
    id: string;
    quoteNo: string;
    version: number;
    status: string;
    total: string;
    createdAt: string;
  }>;
  parentQuote?: { id: string; quoteNo: string; version: number };
  createdBy: { firstName: string; lastName: string };
  convertedToInvoice?: { id: string; invoiceNo: string };
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

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchQuote();
  }, [params.id]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:4001/api/v1/quotes/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setQuote(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, payload?: any) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:4001/api/v1/quotes/${params.id}/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: payload ? JSON.stringify(payload) : undefined,
        }
      );

      if (response.ok) {
        fetchQuote();
      } else {
        const error = await response.json();
        alert(error.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-800 dark:text-white">Quote not found</h2>
        <Link href="/quotes" className="mt-4 text-primary-500 hover:text-primary-600">
          Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/quotes"
              className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-dark-800 dark:text-white">
                {quote.quoteNo}
              </h1>
              <p className="text-dark-500 dark:text-dark-400">{quote.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[quote.status]}`}>
              {statusLabels[quote.status]}
            </span>
            {quote.version > 1 && (
              <span className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Version {quote.version}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {quote.status === 'DRAFT' && (
            <>
              <Link
                href={`/quotes/${quote.id}/edit`}
                className="px-4 py-2 text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => handleAction('send')}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Send to Customer
              </button>
            </>
          )}
          {['SENT', 'VIEWED'].includes(quote.status) && (
            <>
              <button
                onClick={() => handleAction('response', { response: 'ACCEPTED' })}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Mark Accepted
              </button>
              <button
                onClick={() => handleAction('response', { response: 'REJECTED' })}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Mark Rejected
              </button>
            </>
          )}
          {quote.status === 'ACCEPTED' && !quote.convertedToInvoice && (
            <button
              onClick={() => handleAction('convert-to-invoice', {})}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              Convert to Invoice
            </button>
          )}
          {!['CANCELLED', 'CONVERTED', 'REVISED'].includes(quote.status) && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this quote?')) {
                  handleAction('cancel');
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Converted Notice */}
      {quote.convertedToInvoice && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                This quote has been converted to an invoice
              </p>
              <Link
                href={`/invoices/${quote.convertedToInvoice.id}`}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Invoice {quote.convertedToInvoice.invoiceNo}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-dark-200 dark:border-dark-700">
        <nav className="flex gap-4 -mb-px">
          {[
            { id: 'details', label: 'Details' },
            { id: 'items', label: 'Line Items' },
            { id: 'activity', label: 'Activity' },
            { id: 'versions', label: 'Versions', count: quote.revisions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-dark-500 hover:text-dark-700 dark:text-dark-400'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-dark-100 dark:bg-dark-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Customer</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Name</p>
                <p className="font-medium text-dark-800 dark:text-white">
                  {getCustomerName(quote.customer)}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Customer No</p>
                <p className="font-medium text-dark-800 dark:text-white">{quote.customer.customerNo}</p>
              </div>
              {quote.customer.email && (
                <div>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Email</p>
                  <p className="font-medium text-dark-800 dark:text-white">{quote.customer.email}</p>
                </div>
              )}
              {quote.customer.phone && (
                <div>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Phone</p>
                  <p className="font-medium text-dark-800 dark:text-white">{quote.customer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quote Info */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Quote Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Created</p>
                <p className="font-medium text-dark-800 dark:text-white">{formatDate(quote.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Valid Until</p>
                <p className="font-medium text-dark-800 dark:text-white">{formatDate(quote.validUntil)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">Created By</p>
                <p className="font-medium text-dark-800 dark:text-white">
                  {quote.createdBy.firstName} {quote.createdBy.lastName}
                </p>
              </div>
              {quote.sentAt && (
                <div>
                  <p className="text-sm text-dark-500 dark:text-dark-400">Sent</p>
                  <p className="font-medium text-dark-800 dark:text-white">{formatDate(quote.sentAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-500 dark:text-dark-400">Subtotal</span>
                <span className="text-dark-800 dark:text-white">{formatCurrency(quote.subtotal)}</span>
              </div>
              {Number(quote.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(quote.discountAmount)}</span>
                </div>
              )}
              {Number(quote.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Tax ({quote.taxRate}%)</span>
                  <span className="text-dark-800 dark:text-white">{formatCurrency(quote.taxAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-dark-200 dark:border-dark-600 flex justify-between text-lg font-semibold">
                <span className="text-dark-800 dark:text-white">Total</span>
                <span className="text-primary-600 dark:text-primary-400">{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {quote.description && (
            <div className="lg:col-span-3 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-2">Description</h3>
              <p className="text-dark-600 dark:text-dark-400 whitespace-pre-wrap">{quote.description}</p>
            </div>
          )}

          {/* Terms */}
          {quote.terms && (
            <div className="lg:col-span-3 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-2">Terms & Conditions</h3>
              <p className="text-dark-600 dark:text-dark-400 whitespace-pre-wrap">{quote.terms}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-50 dark:bg-dark-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {quote.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-dark-800 dark:text-white">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-dark-500 dark:text-dark-400">{item.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-dark-600 dark:text-dark-400">{item.itemType}</td>
                  <td className="px-6 py-4 text-right text-dark-800 dark:text-white">
                    {Number(item.quantity)} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-right text-dark-800 dark:text-white">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-dark-800 dark:text-white">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
          <div className="space-y-4">
            {quote.activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {index < quote.activities.length - 1 && (
                    <div className="w-px h-full bg-dark-200 dark:bg-dark-600 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-dark-800 dark:text-white">{activity.action.replace(/_/g, ' ')}</p>
                  {activity.description && (
                    <p className="text-sm text-dark-500 dark:text-dark-400">{activity.description}</p>
                  )}
                  <div className="text-xs text-dark-400 dark:text-dark-500 mt-1">
                    {formatDateTime(activity.createdAt)}
                    {activity.performedBy && (
                      <span> by {activity.performedBy.firstName} {activity.performedBy.lastName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 overflow-hidden">
          {quote.revisions.length === 0 && !quote.parentQuote ? (
            <div className="text-center py-8 text-dark-500 dark:text-dark-400">
              This is the original version with no revisions.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Quote No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {/* Current version */}
                <tr className="bg-primary-50 dark:bg-primary-900/20">
                  <td className="px-6 py-4 font-medium text-dark-800 dark:text-white">
                    V{quote.version} (Current)
                  </td>
                  <td className="px-6 py-4 text-dark-800 dark:text-white">{quote.quoteNo}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                      {statusLabels[quote.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-dark-800 dark:text-white">{formatCurrency(quote.total)}</td>
                  <td className="px-6 py-4 text-dark-600 dark:text-dark-400">{formatDate(quote.createdAt)}</td>
                </tr>
                {/* Previous versions */}
                {quote.revisions.map((rev) => (
                  <tr key={rev.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/50">
                    <td className="px-6 py-4 font-medium text-dark-800 dark:text-white">V{rev.version}</td>
                    <td className="px-6 py-4">
                      <Link href={`/quotes/${rev.id}`} className="text-primary-600 hover:underline">
                        {rev.quoteNo}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[rev.status]}`}>
                        {statusLabels[rev.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-dark-800 dark:text-white">{formatCurrency(rev.total)}</td>
                    <td className="px-6 py-4 text-dark-600 dark:text-dark-400">{formatDate(rev.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
