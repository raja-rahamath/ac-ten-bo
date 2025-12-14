'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LeaveCalendar from '@/components/LeaveCalendar';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string;
}

interface LeaveType {
  id: string;
  name: string;
  nameAr?: string;
  defaultDays: number;
  isPaid: boolean;
  requiresApproval: boolean;
  maxConsecutiveDays?: number;
  isActive: boolean;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  employee: Employee;
  leaveType: { id: string; name: string; nameAr?: string };
  approver?: Employee;
  coveringEmployee?: Employee;
  createdAt: string;
}

interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  leaveType: { id: string; name: string; nameAr?: string; isPaid: boolean };
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  carryOverDays: number;
  availableDays: number;
}

type Tab = 'calendar' | 'requests' | 'types' | 'balances';

export default function LeavesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // New request form
  const [newRequest, setNewRequest] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    coveringEmployeeId: '',
  });

  useEffect(() => {
    fetchLeaveTypes();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab, statusFilter, pagination.page]);

  useEffect(() => {
    if (activeTab === 'balances' && selectedEmployee) {
      fetchBalances(selectedEmployee);
    }
  }, [activeTab, selectedEmployee]);

  async function fetchLeaveTypes() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/leaves/types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLeaveTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
    }
  }

  async function fetchEmployees() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/employees?limit=500&isActive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRequests() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_URL}/leaves/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchBalances(employeeId: string) {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const year = new Date().getFullYear();
      const response = await fetch(`${API_URL}/leaves/balances/${employeeId}?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBalances(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/leaves/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: newRequest.employeeId,
          leaveTypeId: newRequest.leaveTypeId,
          startDate: new Date(newRequest.startDate).toISOString(),
          endDate: new Date(newRequest.endDate).toISOString(),
          reason: newRequest.reason || undefined,
          coveringEmployeeId: newRequest.coveringEmployeeId || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowRequestModal(false);
        setNewRequest({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '', coveringEmployeeId: '' });
        fetchRequests();
      } else {
        alert(data.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('Failed to create request');
    }
  }

  async function handleApprove(requestId: string) {
    try {
      const token = localStorage.getItem('accessToken');
      // Get current user ID from token - for demo using first admin
      const response = await fetch(`${API_URL}/leaves/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approverId: employees[0]?.id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  }

  async function handleReject(requestId: string) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/leaves/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approverId: employees[0]?.id, rejectionReason: reason }),
      });
      const data = await response.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(data.message || 'Failed to reject');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Leave Management</h1>
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
        >
          + New Leave Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-100 dark:bg-dark-700 p-1 rounded-xl w-fit">
        {(['calendar', 'requests', 'types', 'balances'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-dark-600 text-dark-800 dark:text-white shadow-sm'
                : 'text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
            }`}
          >
            {tab === 'calendar' ? 'Calendar' : tab === 'requests' ? 'Leave Requests' : tab === 'types' ? 'Leave Types' : 'Employee Balances'}
          </button>
        ))}
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <LeaveCalendar />
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
          {/* Filters */}
          <div className="p-4 border-b border-dark-100 dark:border-dark-700">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2 text-sm text-dark-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Leave Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-dark-800 dark:text-white">
                          {request.employee.firstName} {request.employee.lastName}
                        </p>
                        <p className="text-sm text-dark-500">{request.employee.employeeNo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-300">{request.leaveType.name}</td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-300">
                      <div className="text-sm">
                        <p>{new Date(request.startDate).toLocaleDateString()}</p>
                        <p className="text-dark-500">to {new Date(request.endDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-300">{request.totalDays}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-dark-500">
                      No leave requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-dark-100 dark:border-dark-700 flex items-center justify-between">
              <p className="text-sm text-dark-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 rounded border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave Types Tab */}
      {activeTab === 'types' && (
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Default Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Requires Approval</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Max Consecutive</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 dark:text-dark-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {leaveTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-dark-800 dark:text-white">{type.name}</p>
                        {type.nameAr && <p className="text-sm text-dark-500" dir="rtl">{type.nameAr}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-300">{type.defaultDays}</td>
                    <td className="px-4 py-3">
                      {type.isPaid ? (
                        <span className="text-green-600 dark:text-green-400">Yes</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-300">{type.requiresApproval ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-300">{type.maxConsecutiveDays || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          type.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-4">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full max-w-md rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
            >
              <option value="">Choose an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeNo})
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && balances.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.map((balance) => (
                <div
                  key={balance.id}
                  className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-dark-800 dark:text-white">{balance.leaveType.name}</h3>
                    {balance.leaveType.isPaid ? (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                        Paid
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                        Unpaid
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dark-500">Total Days:</span>
                      <span className="font-medium text-dark-800 dark:text-white">{balance.totalDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-500">Used:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{balance.usedDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-500">Pending:</span>
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">{balance.pendingDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dark-500">Carry Over:</span>
                      <span className="font-medium text-dark-800 dark:text-white">{balance.carryOverDays}</span>
                    </div>
                    <hr className="border-dark-100 dark:border-dark-700" />
                    <div className="flex justify-between">
                      <span className="font-medium text-dark-700 dark:text-dark-300">Available:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{balance.availableDays}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedEmployee && balances.length === 0 && !isLoading && (
            <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-8 text-center">
              <p className="text-dark-500">No leave balances found for this employee</p>
              <p className="text-sm text-dark-400 mt-2">Balances are initialized when the first leave request is created</p>
            </div>
          )}
        </div>
      )}

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">New Leave Request</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Employee *</label>
                <select
                  value={newRequest.employeeId}
                  onChange={(e) => setNewRequest({ ...newRequest, employeeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Leave Type *</label>
                <select
                  value={newRequest.leaveTypeId}
                  onChange={(e) => setNewRequest({ ...newRequest, leaveTypeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.filter((t) => t.isActive).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.defaultDays} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Covering Employee</label>
                <select
                  value={newRequest.coveringEmployeeId}
                  onChange={(e) => setNewRequest({ ...newRequest, coveringEmployeeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                >
                  <option value="">No covering employee</option>
                  {employees
                    .filter((emp) => emp.id !== newRequest.employeeId)
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Reason</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
