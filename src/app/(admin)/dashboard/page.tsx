'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value={stats.totalRequests} icon="📋" color="bg-blue-500" />
        <StatCard title="New Requests" value={stats.newRequests} icon="🔵" color="bg-cyan-500" />
        <StatCard title="In Progress" value={stats.inProgressRequests} icon="🟡" color="bg-yellow-500" />
        <StatCard title="Completed" value={stats.completedRequests} icon="🟢" color="bg-green-500" />
        <StatCard title="Total Customers" value={stats.totalCustomers} icon="👥" color="bg-indigo-500" />
        <StatCard title="Total Employees" value={stats.totalEmployees} icon="👷" color="bg-purple-500" />
        <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon="📄" color="bg-orange-500" />
        <StatCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon="💰" color="bg-emerald-500" />
      </div>

      {/* Recent Requests */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Service Requests</h2>
          <Link href="/requests" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No service requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Request #</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Priority</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link href={`/requests/${request.id}`} className="text-primary hover:underline">
                        {request.requestNo}
                      </Link>
                    </td>
                    <td className="py-3">{request.title}</td>
                    <td className="py-3">
                      {request.customer ? `${request.customer.firstName} ${request.customer.lastName}` : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
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

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color} text-white text-2xl`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
