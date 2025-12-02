'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  employeeNo: string;
  hireDate?: string;
  createdAt: string;
  updatedAt: string;
  jobTitle?: { name: string };
  department?: { name: string };
  division?: { name: string };
  company?: { name: string };
  user?: { role?: { name: string } };
  zoneAssignments?: {
    zone: { id: string; name: string };
    isPrimary: boolean;
  }[];
  assignedRequests?: {
    id: string;
    requestNo: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
}

interface ServiceRequest {
  id: string;
  requestNo: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  customer?: { firstName: string; lastName: string };
  property?: { address: string };
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Assign Request Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedRequests, setUnassignedRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  async function fetchEmployee() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/employees/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setEmployee(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch employee:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUnassignedRequests() {
    setLoadingRequests(true);
    try {
      const token = localStorage.getItem('accessToken');
      // Fetch NEW requests that can be assigned
      const response = await fetch(`http://localhost:4001/api/v1/service-requests?status=NEW&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setUnassignedRequests(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  }

  function openAssignModal() {
    setShowAssignModal(true);
    setSelectedRequestIds([]);
    setSearchQuery('');
    setAssignError('');
    fetchUnassignedRequests();
  }

  function toggleRequestSelection(requestId: string) {
    setSelectedRequestIds((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  }

  function toggleSelectAll() {
    const filteredIds = filteredRequests.map((r) => r.id);
    const allSelected = filteredIds.every((id) => selectedRequestIds.includes(id));
    if (allSelected) {
      setSelectedRequestIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedRequestIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  }

  // Filter requests based on search query
  const filteredRequests = unassignedRequests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.requestNo.toLowerCase().includes(query) ||
      request.title.toLowerCase().includes(query) ||
      request.customer?.firstName?.toLowerCase().includes(query) ||
      request.customer?.lastName?.toLowerCase().includes(query)
    );
  });

  async function handleAssignRequest() {
    if (selectedRequestIds.length === 0) {
      setAssignError('Please select at least one request to assign');
      return;
    }

    setAssigning(true);
    setAssignError('');

    try {
      const token = localStorage.getItem('accessToken');
      const results = await Promise.allSettled(
        selectedRequestIds.map((requestId) =>
          fetch(`http://localhost:4001/api/v1/service-requests/${requestId}/assign`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ employeeId: params.id }),
          }).then((res) => res.json())
        )
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        setAssignError(`${failed} of ${selectedRequestIds.length} assignments failed`);
      }

      // Refresh employee data to show new assignments
      await fetchEmployee();
      if (failed === 0) {
        setShowAssignModal(false);
      }
    } catch (error: any) {
      setAssignError(error.message);
    } finally {
      setAssigning(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      ON_LEAVE: 'bg-yellow-100 text-yellow-800',
      TERMINATED: 'bg-red-100 text-red-800',
      NEW: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
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

  if (!employee) {
    return <div className="flex h-64 items-center justify-center">Employee not found</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">{employee.firstName} {employee.lastName}</h1>
            <p className="text-gray-500">{employee.employeeNo}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(employee.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
            {employee.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <Link href={`/employees/${params.id}/edit`}>
          <Button variant="outline">Edit Employee</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Employee Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{employee.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Company</label>
                <p className="font-medium">{employee.company?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Department</label>
                <p className="font-medium">{employee.department?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Job Title</label>
                <p className="font-medium">{employee.jobTitle?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium">{employee.user?.role?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Hire Date</label>
                <p className="font-medium">
                  {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Member Since</label>
                <p className="font-medium">{new Date(employee.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {/* Zones */}
            {employee.zoneAssignments && employee.zoneAssignments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-sm text-gray-500 block mb-2">Assigned Zones</label>
                <div className="flex flex-wrap gap-2">
                  {employee.zoneAssignments.map((za) => (
                    <span
                      key={za.zone.id}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                        za.isPrimary
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {za.zone.name}
                      {za.isPrimary && (
                        <span className="text-xs bg-primary-200 text-primary-800 px-1.5 py-0.5 rounded-full ml-1">
                          Primary
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Requests */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assigned Requests</h2>
              <Link href={`/requests?employeeId=${employee.id}`} className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            {employee.assignedRequests && employee.assignedRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Request #</th>
                      <th className="pb-3 font-medium">Title</th>
                      <th className="pb-3 font-medium">Priority</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employee.assignedRequests.slice(0, 10).map((request) => (
                      <tr key={request.id} className="border-b last:border-0">
                        <td className="py-3">
                          <Link href={`/requests/${request.id}`} className="text-primary hover:underline">
                            {request.requestNo}
                          </Link>
                        </td>
                        <td className="py-3">{request.title}</td>
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
            ) : (
              <p className="text-gray-500">No assigned requests</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Performance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{employee.assignedRequests?.length || 0}</p>
                <p className="text-sm text-gray-500">Total Requests</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employee.assignedRequests?.filter((r) => r.status === 'COMPLETED').length || 0}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employee.assignedRequests?.filter((r) => r.status === 'IN_PROGRESS').length || 0}
                </p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={openAssignModal}>
                Assign Request
              </Button>
              <Link href={`/schedule?employeeId=${employee.id}`}>
                <Button className="w-full" variant="outline">
                  View Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Request Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Assign Requests to {employee.firstName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedRequestIds.length > 0
                    ? `${selectedRequestIds.length} request${selectedRequestIds.length > 1 ? 's' : ''} selected`
                    : 'Select requests to assign'}
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {assignError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {assignError}
              </div>
            )}

            {/* Search Box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by request number, title, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading requests...</div>
                </div>
              ) : unassignedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No unassigned requests available</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <p>No requests match your search</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select All Header */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg sticky top-0">
                    <input
                      type="checkbox"
                      checked={filteredRequests.length > 0 && filteredRequests.every((r) => selectedRequestIds.includes(r.id))}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({filteredRequests.length})
                    </span>
                  </div>

                  {filteredRequests.map((request) => (
                    <label
                      key={request.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedRequestIds.includes(request.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRequestIds.includes(request.id)}
                        onChange={() => toggleRequestSelection(request.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-primary-600">{request.requestNo}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(request.priority)} bg-gray-100`}>
                            {request.priority}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{request.title}</p>
                        {request.customer && (
                          <p className="text-sm text-gray-500">
                            {request.customer.firstName} {request.customer.lastName}
                          </p>
                        )}
                        {request.property && (
                          <p className="text-sm text-gray-400 truncate">{request.property.address}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAssignRequest}
                disabled={selectedRequestIds.length === 0 || assigning}
              >
                {assigning
                  ? 'Assigning...'
                  : selectedRequestIds.length > 0
                  ? `Assign ${selectedRequestIds.length} Request${selectedRequestIds.length > 1 ? 's' : ''}`
                  : 'Select Requests'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
