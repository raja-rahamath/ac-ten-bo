'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@agentcare/ui';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: string;
  employeeNo: string;
  dateOfJoining?: string;
  createdAt: string;
  updatedAt: string;
  department?: { name: string };
  designation?: { name: string };
  company?: { name: string };
  user?: { role?: { name: string } };
  assignedRequests?: {
    id: string;
    requestNo: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      ON_LEAVE: 'bg-yellow-100 text-yellow-800',
      TERMINATED: 'bg-red-100 text-red-800',
      NEW: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
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
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(employee.status)}`}>
            {employee.status.replace('_', ' ')}
          </span>
        </div>
        <Button variant="outline">Edit Employee</Button>
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
                <label className="text-sm text-gray-500">Designation</label>
                <p className="font-medium">{employee.designation?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium">{employee.user?.role?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date of Joining</label>
                <p className="font-medium">
                  {employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Member Since</label>
                <p className="font-medium">{new Date(employee.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
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
              <Button className="w-full" variant="outline">
                Assign Request
              </Button>
              <Button className="w-full" variant="outline">
                View Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
