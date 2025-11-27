'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@agentcare/ui';

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
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [page, filter]);

  async function fetchRequests() {
    try {
      const token = localStorage.getItem('accessToken');
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : '';
      const response = await fetch(
        `http://localhost:4001/api/v1/service-requests?page=${page}&limit=20${statusParam}`,
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <Button asChild>
          <Link href="/requests/new">+ New Request</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['ALL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`rounded-full px-4 py-2 text-sm ${
              filter === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="rounded-xl bg-white shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No requests found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-500">
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
                    <tr key={request.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/requests/${request.id}`} className="text-primary hover:underline">
                          {request.requestNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">{request.title}</td>
                      <td className="px-6 py-4">
                        {request.customer ? `${request.customer.firstName} ${request.customer.lastName}` : '-'}
                      </td>
                      <td className="px-6 py-4">{request.complaintType?.name || '-'}</td>
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
                      <td className="px-6 py-4">
                        {request.assignedEmployee
                          ? `${request.assignedEmployee.firstName} ${request.assignedEmployee.lastName}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/requests/${request.id}`} className="text-primary hover:underline">
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
