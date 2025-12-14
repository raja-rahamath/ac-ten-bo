'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface SiteVisit {
  id: string;
  visitNo: string;
  status: string;
  scheduledDate: string;
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  incompleteReason?: string;
  partsNeeded?: string;
  createdAt: string;
  serviceRequest?: {
    id: string;
    requestNo: string;
    title: string;
    customer?: {
      firstName: string;
      lastName: string;
    };
    property?: {
      name: string;
      address?: string;
    };
  };
  technician?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function SiteVisitsPage() {
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSiteVisits();
  }, [page, filter]);

  async function fetchSiteVisits() {
    try {
      const token = localStorage.getItem('accessToken');
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : '';
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(
        `${API_URL}/site-visits?page=${page}&limit=20${statusParam}${searchParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setSiteVisits(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch site visits:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchSiteVisits();
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      AWAITING_PARTS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatTime(time?: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site Visits</h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search visits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'AWAITING_PARTS'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-700'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Site Visits Table */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
        {isLoading ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2" />
            Loading...
          </div>
        ) : siteVisits.length === 0 ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">No site visits found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500 dark:text-dark-400">
                    <th className="px-6 py-4 font-medium">Visit #</th>
                    <th className="px-6 py-4 font-medium">Service Request</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Technician</th>
                    <th className="px-6 py-4 font-medium">Scheduled</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {siteVisits.map((visit) => (
                    <tr key={visit.id} className="border-b border-dark-100 dark:border-dark-700 last:border-0 hover:bg-dark-50 dark:hover:bg-dark-700/50">
                      <td className="px-6 py-4">
                        <Link href={`/site-visits/${visit.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                          {visit.visitNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {visit.serviceRequest ? (
                          <Link href={`/requests/${visit.serviceRequest.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                            <div className="font-medium">{visit.serviceRequest.requestNo}</div>
                            <div className="text-xs text-dark-500 dark:text-dark-400">{visit.serviceRequest.title}</div>
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">
                        {visit.serviceRequest?.customer ? (
                          `${visit.serviceRequest.customer.firstName} ${visit.serviceRequest.customer.lastName}`
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">
                        {visit.technician ? (
                          `${visit.technician.firstName} ${visit.technician.lastName}`
                        ) : (
                          <span className="text-dark-400 dark:text-dark-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">
                        <div>{formatDate(visit.scheduledDate)}</div>
                        {visit.scheduledTime && (
                          <div className="text-xs text-dark-400 dark:text-dark-500">{formatTime(visit.scheduledTime)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(visit.status)}`}>
                          {visit.status.replace('_', ' ')}
                        </span>
                        {visit.status === 'AWAITING_PARTS' && visit.partsNeeded && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Needs: {visit.partsNeeded.substring(0, 30)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/site-visits/${visit.id}`} className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
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
