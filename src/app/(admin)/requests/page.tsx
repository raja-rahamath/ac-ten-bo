'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceRequest {
  id: string;
  requestNo: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  customer?: { id: string; firstName: string; lastName: string };
  complaintType?: { id: string; name: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  zone?: { id: string; name: string };
  unit?: { id: string; unitNo: string; flatNumber?: string; building?: { id: string; name?: string } };
  property?: { id: string; name: string };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface ComplaintType {
  id: string;
  name: string;
}

export default function RequestsPage() {
  const { isTechnician, userZones } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [complaintTypeFilter, setComplaintTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);

  // Current employee ID for technician filtering
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchDropdownData();
    if (isTechnician) {
      fetchCurrentEmployee();
    }
  }, [isTechnician]);

  useEffect(() => {
    // Only fetch requests when we have the employee ID (for technicians) or immediately (for non-technicians)
    if (!isTechnician || currentEmployeeId !== null) {
      fetchRequests();
    }
  }, [page, statusFilter, priorityFilter, customerFilter, assignedToFilter, complaintTypeFilter, dateFromFilter, dateToFilter, searchQuery, isTechnician, userZones, currentEmployeeId]);

  async function fetchCurrentEmployee() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/employees/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCurrentEmployeeId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to fetch current employee:', error);
      // If we can't get the employee ID, don't block - just show all (filtered by zone)
      setCurrentEmployeeId('');
    }
  }

  async function fetchDropdownData() {
    try {
      const token = localStorage.getItem('accessToken');
      const [customersRes, employeesRes, typesRes] = await Promise.all([
        fetch('${API_URL}/customers?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('${API_URL}/employees?isActive=true&limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('${API_URL}/complaint-types', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [customersData, employeesData, typesData] = await Promise.all([
        customersRes.json(),
        employeesRes.json(),
        typesRes.json(),
      ]);

      if (customersData.success) setCustomers(customersData.data || []);
      if (employeesData.success) setEmployees(employeesData.data || []);
      if (typesData.success) setComplaintTypes(typesData.data || []);
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  }

  async function fetchRequests() {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');

      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (customerFilter) params.append('customerId', customerFilter);
      if (assignedToFilter) params.append('assignedEmployeeId', assignedToFilter);
      if (complaintTypeFilter) params.append('complaintTypeId', complaintTypeFilter);
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);
      if (searchQuery) params.append('search', searchQuery);

      // For technicians, filter by their assigned employee ID (only show requests assigned to them)
      if (isTechnician && currentEmployeeId) {
        params.append('assignedEmployeeId', currentEmployeeId);
      }

      const response = await fetch(
        `${API_URL}/service-requests?${params.toString()}`,
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

  function clearFilters() {
    setStatusFilter('');
    setPriorityFilter('');
    setCustomerFilter('');
    setAssignedToFilter('');
    setComplaintTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setSearchQuery('');
    setPage(1);
  }

  const hasActiveFilters = statusFilter || priorityFilter || customerFilter || assignedToFilter || complaintTypeFilter || dateFromFilter || dateToFilter || searchQuery;

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      ASSIGNED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      LOW: 'text-gray-600 dark:text-gray-400',
      MEDIUM: 'text-yellow-600 dark:text-yellow-400',
      HIGH: 'text-orange-600 dark:text-orange-400',
      EMERGENCY: 'text-red-600 dark:text-red-400',
    };
    return colors[priority] || 'text-gray-600 dark:text-gray-400';
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
    return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Requests</h1>
        <div className="flex gap-3">
          <Link
            href="/requests/wizard"
            className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            + New Request (Wizard)
          </Link>
          <Link
            href="/requests/new"
            className="rounded-xl border border-dark-200 dark:border-dark-600 px-4 py-2.5 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
          >
            Quick Add
          </Link>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by request #, title, or description..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-primary-500 text-white border-primary-500'
              : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border-dark-200 dark:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">Active</span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Customer</label>
              <select
                value={customerFilter}
                onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Assigned To</label>
              <select
                value={assignedToFilter}
                onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Request Type</label>
              <select
                value={complaintTypeFilter}
                onChange={(e) => { setComplaintTypeFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              >
                <option value="">All Types</option>
                {complaintTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">From Date</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => { setDateFromFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">To Date</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => { setDateToFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-dark-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-dark-100"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 disabled:opacity-50 hover:bg-dark-50 dark:hover:bg-dark-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status || 'ALL'}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-600 hover:bg-dark-50 dark:hover:bg-dark-700'
            }`}
          >
            {status ? status.replace('_', ' ') : 'ALL'}
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
                    <th className="px-6 py-4 font-medium">Created Date</th>
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
                        {request.assignedTo
                          ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-dark-500 dark:text-dark-400 whitespace-nowrap">
                        {formatDateTime(request.createdAt)}
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
