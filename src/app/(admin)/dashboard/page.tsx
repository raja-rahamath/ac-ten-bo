'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Modern SVG Icons
const Icons = {
  clipboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  document: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  currency: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

interface Stats {
  totalRequests: number;
  newRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  totalCustomers: number;
  totalEmployees: number;
  pendingInvoices: number;
  revenue: number;
}

interface RecentRequest {
  id: string;
  requestNo: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  customer?: { firstName: string; lastName: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    newRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    pendingInvoices: 0,
    revenue: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [requestsRes, customersRes, employeesRes, invoicesRes] = await Promise.all([
        fetch('http://localhost:4001/api/v1/service-requests?limit=10', { headers }),
        fetch('http://localhost:4001/api/v1/customers?limit=1', { headers }),
        fetch('http://localhost:4001/api/v1/employees?limit=1', { headers }),
        fetch('http://localhost:4001/api/v1/invoices?limit=1', { headers }),
      ]);

      const [requestsData, customersData, employeesData, invoicesData] = await Promise.all([
        requestsRes.json(),
        customersRes.json(),
        employeesRes.json(),
        invoicesRes.json(),
      ]);

      if (requestsData.success) {
        setRecentRequests(requestsData.data);
        const requests = requestsData.data;
        setStats((prev) => ({
          ...prev,
          totalRequests: requestsData.pagination?.total || requests.length,
          newRequests: requests.filter((r: any) => r.status === 'NEW').length,
          inProgressRequests: requests.filter((r: any) => ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length,
          completedRequests: requests.filter((r: any) => r.status === 'COMPLETED').length,
        }));
      }

      if (customersData.success) {
        setStats((prev) => ({ ...prev, totalCustomers: customersData.pagination?.total || 0 }));
      }

      if (employeesData.success) {
        setStats((prev) => ({ ...prev, totalEmployees: employeesData.pagination?.total || 0 }));
      }

      if (invoicesData.success) {
        const pending = invoicesData.data.filter((i: any) => i.status === 'PENDING').length;
        const revenue = invoicesData.data
          .filter((i: any) => i.status === 'PAID')
          .reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);
        setStats((prev) => ({ ...prev, pendingInvoices: pending, revenue }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      NEW: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
      ASSIGNED: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
      IN_PROGRESS: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
      COMPLETED: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
      CANCELLED: 'bg-dark-100 text-dark-600 ring-1 ring-dark-200',
    };
    return styles[status] || 'bg-dark-100 text-dark-600 ring-1 ring-dark-200';
  }

  function getPriorityBadge(priority: string) {
    const styles: Record<string, string> = {
      LOW: 'text-dark-500',
      MEDIUM: 'text-amber-600 font-medium',
      HIGH: 'text-orange-600 font-semibold',
      URGENT: 'text-red-600 font-bold',
    };
    return styles[priority] || 'text-dark-500';
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          <span className="text-dark-400 text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Requests', value: stats.totalRequests, icon: Icons.clipboard, gradient: 'stat-blue', trend: '+12%' },
    { title: 'New Requests', value: stats.newRequests, icon: Icons.sparkles, gradient: 'stat-indigo', trend: '+5' },
    { title: 'In Progress', value: stats.inProgressRequests, icon: Icons.clock, gradient: 'stat-orange', trend: null },
    { title: 'Completed', value: stats.completedRequests, icon: Icons.check, gradient: 'stat-green', trend: '+8' },
    { title: 'Customers', value: stats.totalCustomers, icon: Icons.users, gradient: 'stat-purple', trend: '+3%' },
    { title: 'Employees', value: stats.totalEmployees, icon: Icons.briefcase, gradient: 'stat-pink', trend: null },
    { title: 'Pending Invoices', value: stats.pendingInvoices, icon: Icons.document, gradient: 'stat-orange', trend: '-2' },
    { title: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: Icons.currency, gradient: 'stat-green', trend: '+18%' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-accent-purple p-6 text-white shadow-glow">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="mt-1 text-primary-100">Here's what's happening with your business today.</p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.gradient} text-white shadow-lg`}>
                {card.icon}
              </div>
              {card.trend && (
                <span className={`text-xs font-medium ${card.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {card.trend}
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-dark-800">{card.value}</p>
              <p className="mt-1 text-sm text-dark-400">{card.title}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-dark-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="card-modern overflow-hidden">
        <div className="flex items-center justify-between border-b border-dark-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-dark-800">Recent Service Requests</h2>
            <p className="text-sm text-dark-400">Latest requests from your customers</p>
          </div>
          <Link
            href="/requests"
            className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            View all
            {Icons.arrowRight}
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.clipboard}
            </div>
            <p className="text-dark-500 font-medium">No service requests yet</p>
            <p className="text-sm text-dark-400 mt-1">They will appear here once created</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Request #</th>
                  <th>Title</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td>
                      <Link href={`/requests/${request.id}`} className="font-medium text-primary-500 hover:text-primary-600 transition-colors">
                        {request.requestNo}
                      </Link>
                    </td>
                    <td className="font-medium text-dark-700 max-w-[200px] truncate">{request.title}</td>
                    <td>
                      {request.customer ? (
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center text-white text-xs font-medium">
                            {request.customer.firstName[0]}{request.customer.lastName[0]}
                          </div>
                          <span>{request.customer.firstName} {request.customer.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-dark-400">-</span>
                      )}
                    </td>
                    <td>
                      <span className={getPriorityBadge(request.priority)}>
                        {request.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-dark-400">
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
