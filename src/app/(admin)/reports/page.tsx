'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface DashboardSummary {
  period: { from: string; to: string };
  serviceRequests: {
    total: number;
    byStatus: Record<string, number>;
  };
  invoices: {
    count: number;
    total: number;
  };
  collections: {
    count: number;
    total: number;
  };
  newCustomers: number;
  activeEmployees: number;
  activeAmcContracts: number;
}

interface ServiceRequestReport {
  period: { from: string; to: string };
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
}

interface RevenueReport {
  period: { from: string; to: string };
  summary: {
    totalInvoiced: number;
    invoiceCount: number;
    totalCollected: number;
    paymentCount: number;
    collectionRate: number;
  };
  collectionsByMethod: Array<{ method: string; amount: number; count: number }>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [srReport, setSrReport] = useState<ServiceRequestReport | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'revenue' | 'amc'>('overview');

  useEffect(() => {
    fetchReports();
  }, [period]);

  async function fetchReports() {
    setIsLoading(true);
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [dashboardRes, srRes, revenueRes] = await Promise.all([
        fetch(`http://localhost:4001/api/v1/reports/dashboard?period=${period}`, { headers }),
        fetch(`http://localhost:4001/api/v1/reports/service-requests?period=${period}`, { headers }),
        fetch(`http://localhost:4001/api/v1/reports/revenue?period=${period}`, { headers }),
      ]);

      const [dashboardJson, srJson, revenueJson] = await Promise.all([
        dashboardRes.json(),
        srRes.json(),
        revenueRes.json(),
      ]);

      if (dashboardJson.success) setDashboardData(dashboardJson.data);
      if (srJson.success) setSrReport(srJson.data);
      if (revenueJson.success) setRevenueReport(revenueJson.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
    }).format(amount);
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-500',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-green-500',
      CANCELLED: 'bg-gray-500',
      PENDING: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-400';
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-500">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'requests', label: 'Service Requests' },
            { id: 'revenue', label: 'Revenue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Service Requests</p>
                  <p className="text-3xl font-bold">{dashboardData.serviceRequests.total}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <Link href="/requests" className="mt-4 text-sm text-primary hover:underline inline-block">
                View all requests →
              </Link>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Invoiced</p>
                  <p className="text-3xl font-bold">{formatCurrency(dashboardData.invoices.total)}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">{dashboardData.invoices.count} invoices</p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Collections</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(dashboardData.collections.total)}</p>
                </div>
                <div className="rounded-full bg-emerald-100 p-3">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">{dashboardData.collections.count} payments</p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">New Customers</p>
                  <p className="text-3xl font-bold">{dashboardData.newCustomers}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <Link href="/customers" className="mt-4 text-sm text-primary hover:underline inline-block">
                View customers →
              </Link>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Service Requests by Status */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Service Requests by Status</h3>
              <div className="space-y-4">
                {Object.entries(dashboardData.serviceRequests.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(status)}`}></div>
                    <span className="flex-1 text-sm">{status.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(status)}`}
                        style={{ width: `${(count / dashboardData.serviceRequests.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Business Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Active Employees</p>
                  <p className="text-2xl font-bold">{dashboardData.activeEmployees}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Active AMC Contracts</p>
                  <p className="text-2xl font-bold">{dashboardData.activeAmcContracts}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Collection Rate</p>
                  <p className="text-2xl font-bold">
                    {dashboardData.invoices.total > 0
                      ? ((dashboardData.collections.total / dashboardData.invoices.total) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Avg Invoice Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      dashboardData.invoices.count > 0
                        ? dashboardData.invoices.total / dashboardData.invoices.count
                        : 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Requests Tab */}
      {activeTab === 'requests' && srReport && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Status */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">By Status</h3>
              <div className="space-y-3">
                {srReport.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`}></div>
                      <span className="text-sm">{item.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-sm text-gray-400">
                        ({((item.count / srReport.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Type */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">By Type</h3>
              <div className="space-y-3">
                {srReport.byType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm">{item.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.count}</span>
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(item.count / srReport.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && revenueReport && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total Invoiced</p>
              <p className="text-2xl font-bold">{formatCurrency(revenueReport.summary.totalInvoiced)}</p>
              <p className="text-xs text-gray-400">{revenueReport.summary.invoiceCount} invoices</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueReport.summary.totalCollected)}</p>
              <p className="text-xs text-gray-400">{revenueReport.summary.paymentCount} payments</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(revenueReport.summary.totalInvoiced - revenueReport.summary.totalCollected)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Collection Rate</p>
              <p className="text-2xl font-bold">{revenueReport.summary.collectionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Collections by Method */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Collections by Payment Method</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium text-right">Count</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueReport.collectionsByMethod.map((method) => (
                    <tr key={method.method} className="border-b">
                      <td className="py-3">{getMethodLabel(method.method)}</td>
                      <td className="py-3 text-right">{method.count}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(method.amount)}</td>
                      <td className="py-3 text-right text-gray-500">
                        {((method.amount / revenueReport.summary.totalCollected) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="pt-3">Total</td>
                    <td className="pt-3 text-right">{revenueReport.summary.paymentCount}</td>
                    <td className="pt-3 text-right">{formatCurrency(revenueReport.summary.totalCollected)}</td>
                    <td className="pt-3 text-right">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-8 flex justify-end">
        <Button variant="outline" onClick={() => window.print()}>
          Print Report
        </Button>
      </div>
    </div>
  );
}
