'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceRequest {
  id: string;
  requestNo: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  customer?: { firstName: string; lastName: string };
  complaintType?: { name: string };
  assignedEmployee?: { firstName: string; lastName: string };
  zone?: { id: string; name: string };
}

export default function RequestsPage() {
  const { isTechnician, userZones } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [page, filter, isTechnician, userZones]);

  async function fetchRequests() {
    try {
      const token = localStorage.getItem('accessToken');
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : '';

      // For technicians, filter by their assigned zones
      let zoneParam = '';
      if (isTechnician && userZones.length > 0) {
        const zoneIds = userZones.map((z) => z.zoneId).join(',');
        zoneParam = `&zoneIds=${zoneIds}`;
      }

      const response = await fetch(
        `http://localhost:4001/api/v1/service-requests?page=${page}&limit=20${statusParam}${zoneParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setRequests(data.data);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / 20));
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ASSIGNED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      LOW: 'text-gray-600 dark:text-gray-400',
      MEDIUM: 'text-yellow-600 dark:text-yellow-400',
      HIGH: 'text-orange-600 dark:text-orange-400',
      URGENT: 'text-red-600 dark:text-red-400',
    };
    return colors[priority] || 'text-gray-600 dark:text-gray-400';
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <Button asChild>
          <Link href="/requests/new">+ New Request</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['ALL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-700'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
        {isLoading ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2" />
            Loading...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">No requests found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500 dark:text-dark-400">
                    <th className="px-6 py-4 font-medium">Request #</th>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Assigned To</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-dark-100 dark:border-dark-700 last:border-0 hover:bg-dark-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4">
                        <Link href={`/requests/${request.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                          {request.requestNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-dark-700 dark:text-dark-300">{request.title}</td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">
                        {request.customer ? `${request.customer.firstName} ${request.customer.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-400">{request.complaintType?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                        {request.assignedEmployee
                          ? `${request.assignedEmployee.firstName} ${request.assignedEmployee.lastName}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-dark-500 dark:text-dark-400">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/requests/${request.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
