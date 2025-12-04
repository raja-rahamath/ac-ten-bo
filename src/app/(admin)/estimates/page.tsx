'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface Estimate {
  id: string;
  estimateNo: string;
  title: string;
  version: number;
  status: string;
  total: string;
  createdAt: string;
  isLatestVersion: boolean;
  serviceRequest: {
    id: string;
    requestNo: string;
    customer: {
      id: string;
      customerType: string;
      firstName?: string;
      lastName?: string;
      orgName?: string;
    };
  };
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface EstimateStats {
  totalEstimates: number;
  draftEstimates: number;
  pendingApproval: number;
  approvedEstimates: number;
  rejectedEstimates: number;
  convertedEstimates: number;
  totalValue: number;
  approvedValue: number;
  approvalRate: number;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PENDING_MANAGER_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CONVERTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_MANAGER_APPROVAL: 'Pending Approval',
  REVISION_REQUESTED: 'Revision Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONVERTED: 'Converted to Quote',
  CANCELLED: 'Cancelled',
};

export default function EstimatesPage() {
  const { t } = useLanguage();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetchEstimates();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter, activeTab]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/estimates/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchEstimates = async () => {
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
      else if (activeTab === 'pending') params.append('status', 'PENDING_MANAGER_APPROVAL');
      else if (activeTab === 'approved') params.append('status', 'APPROVED');
      else if (activeTab === 'rejected') params.append('status', 'REJECTED');
      else if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `http://localhost:4001/api/v1/estimates?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setEstimates(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customer: Estimate['serviceRequest']['customer']) => {
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  };

  const formatCurrency = (amount: string | number, currency: string = 'BHD') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 3,
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const tabs = [
    { id: 'all', label: 'All Estimates', count: stats?.totalEstimates },
    { id: 'draft', label: 'Draft', count: stats?.draftEstimates },
    { id: 'pending', label: 'Pending Approval', count: stats?.pendingApproval },
    { id: 'approved', label: 'Approved', count: stats?.approvedEstimates },
    { id: 'rejected', label: 'Rejected', count: stats?.rejectedEstimates },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Internal cost estimates for service requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Value</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Approved Value</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(stats.approvedValue)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Approval Rate</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.approvalRate}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Converted to Quotes</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.convertedEstimates}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search estimates by number or title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Status</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : estimates.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No estimates found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estimate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Service Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {estimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/estimates/${estimate.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        {estimate.estimateNo}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{estimate.title}</div>
                      {estimate.version > 1 && (
                        <span className="text-xs text-purple-600 dark:text-purple-400">V{estimate.version}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/requests/${estimate.serviceRequest.id}`} className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                        {estimate.serviceRequest.requestNo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {getCustomerName(estimate.serviceRequest.customer)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[estimate.status]}`}>
                        {statusLabels[estimate.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(estimate.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {formatDate(estimate.createdAt)}
                      {estimate.createdBy && (
                        <div className="text-xs">by {estimate.createdBy.firstName} {estimate.createdBy.lastName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/estimates/${estimate.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
