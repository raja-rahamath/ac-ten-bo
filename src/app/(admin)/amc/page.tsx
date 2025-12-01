'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date';

interface AmcContract {
  id: string;
  contractNo: string;
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    orgName?: string;
    customerType: string;
  };
  startDate: string;
  endDate: string;
  contractValue: string;
  paymentTerms: string;
  status: string;
  autoRenew: boolean;
  properties: Array<{
    id: string;
    unit?: { building?: { buildingNumber?: string; name?: string } };
    property?: { name?: string; propertyNo?: string };
  }>;
  services: Array<{
    complaintType: { name: string };
  }>;
  _count?: {
    schedules: number;
    payments: number;
  };
  createdAt: string;
}

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  pendingPayments: number;
  overduePayments: number;
  upcomingSchedules: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RENEWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  UPFRONT: 'Upfront',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL: 'Annual',
};

export default function AmcContractsPage() {
  const [contracts, setContracts] = useState<AmcContract[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'expiring'>('all');

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [page, statusFilter, activeTab]);

  async function fetchContracts() {
    setIsLoading(true);
    try {
      let url = `/amc?page=${page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (activeTab === 'expiring') url += `&expiringWithinDays=30`;

      const data = await api.get<{
        success: boolean;
        data: AmcContract[];
        pagination?: { total: number; totalPages: number };
      }>(url);

      if (data.success) {
        setContracts(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const data = await api.get<{ success: boolean; data: DashboardStats }>('/amc/stats');
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  const filteredContracts = contracts.filter((c) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const customerName = c.customer.customerType === 'ORGANIZATION'
      ? c.customer.orgName
      : `${c.customer.firstName} ${c.customer.lastName}`;
    return (
      c.contractNo.toLowerCase().includes(searchLower) ||
      customerName?.toLowerCase().includes(searchLower)
    );
  });

  function getCustomerName(customer: AmcContract['customer']) {
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'Unknown Company';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
  }

  function getPropertySummary(properties: AmcContract['properties']) {
    if (!properties.length) return '-';
    if (properties.length === 1) {
      const p = properties[0];
      if (p.unit?.building) {
        return `Bldg ${p.unit.building.buildingNumber}`;
      }
      return p.property?.name || p.property?.propertyNo || '-';
    }
    return `${properties.length} properties`;
  }

  function getDaysUntilExpiry(endDate: string) {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">AMC Contracts</h1>
          <p className="text-dark-500 dark:text-dark-400">Manage Annual Maintenance Contracts</p>
        </div>
        <Link
          href="/amc/new"
          className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Contract
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="text-2xl font-bold text-dark-800 dark:text-white">{stats.totalContracts}</div>
            <div className="text-sm text-dark-500 dark:text-dark-400">Total Contracts</div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeContracts}</div>
            <div className="text-sm text-dark-500 dark:text-dark-400">Active</div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.expiringContracts}</div>
            <div className="text-sm text-dark-500 dark:text-dark-400">Expiring (30d)</div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.upcomingSchedules}</div>
            <div className="text-sm text-dark-500 dark:text-dark-400">Upcoming Visits</div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingPayments}</div>
            <div className="text-sm text-dark-500 dark:text-dark-400">Pending Payments</div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overduePayments}</div>
            <div className="text-sm text-dark-500 dark:text-dark-400">Overdue</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600'
          }`}
        >
          All Contracts
        </button>
        <button
          onClick={() => { setActiveTab('expiring'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'expiring'
              ? 'bg-orange-500 text-white'
              : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600'
          }`}
        >
          Expiring Soon
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by contract # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[250px] max-w-md rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
        {isLoading ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2" />
            Loading...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">
            No contracts found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500 dark:text-dark-400">
                    <th className="px-6 py-4 font-medium">Contract #</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Properties</th>
                    <th className="px-6 py-4 font-medium">Services</th>
                    <th className="px-6 py-4 font-medium">Period</th>
                    <th className="px-6 py-4 font-medium">Value</th>
                    <th className="px-6 py-4 font-medium">Terms</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const daysLeft = getDaysUntilExpiry(contract.endDate);
                    const isExpiringSoon = contract.status === 'ACTIVE' && daysLeft <= 30 && daysLeft > 0;

                    return (
                      <tr
                        key={contract.id}
                        className="border-b border-dark-100 dark:border-dark-700 last:border-0 hover:bg-dark-50 dark:hover:bg-dark-700/50"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/amc/${contract.id}`}
                            className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {contract.contractNo}
                          </Link>
                          {contract.autoRenew && (
                            <span className="ml-2 text-xs text-blue-500" title="Auto-renew enabled">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/customers/${contract.customer.id}`}
                            className="text-dark-700 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {getCustomerName(contract.customer)}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                          {getPropertySummary(contract.properties)}
                        </td>
                        <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                          <div className="flex flex-wrap gap-1">
                            {contract.services.slice(0, 2).map((s, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-dark-100 dark:bg-dark-700 rounded"
                              >
                                {s.complaintType.name}
                              </span>
                            ))}
                            {contract.services.length > 2 && (
                              <span className="text-xs text-dark-500">
                                +{contract.services.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-dark-700 dark:text-dark-300">
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                          </div>
                          {isExpiringSoon && (
                            <div className="text-xs text-orange-500 mt-1">
                              {daysLeft} days left
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-dark-800 dark:text-white">
                          {Number(contract.contractValue).toFixed(3)} BHD
                        </td>
                        <td className="px-6 py-4 text-dark-600 dark:text-dark-400 text-sm">
                          {PAYMENT_TERMS_LABELS[contract.paymentTerms] || contract.paymentTerms}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              STATUS_COLORS[contract.status] || STATUS_COLORS.DRAFT
                            }`}
                          >
                            {contract.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/amc/${contract.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-dark-100 dark:border-dark-700">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-dark-200 dark:border-dark-600 disabled:opacity-50 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Previous
                </button>
                <span className="text-sm text-dark-500 dark:text-dark-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-dark-200 dark:border-dark-600 disabled:opacity-50 hover:bg-dark-50 dark:hover:bg-dark-700"
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
