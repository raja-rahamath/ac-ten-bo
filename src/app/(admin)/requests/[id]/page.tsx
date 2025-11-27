'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@agentcare/ui';

interface ServiceRequest {
  id: string;
  requestNo: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; firstName: string; lastName: string; phone?: string; email?: string };
  property?: { id: string; name: string; address?: string };
  complaintType?: { id: string; name: string };
  assignedEmployee?: { id: string; firstName: string; lastName: string };
  zone?: { id: string; name: string };
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  async function fetchRequest() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setRequest(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch request:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        setRequest(data.data);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
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
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  if (!request) {
    return <div className="flex h-64 items-center justify-center">Request not found</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{request.requestNo}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-2">
          {request.status === 'NEW' && (
            <Button onClick={() => updateStatus('ASSIGNED')} disabled={isUpdating}>
              Assign
            </Button>
          )}
          {request.status === 'ASSIGNED' && (
            <Button onClick={() => updateStatus('IN_PROGRESS')} disabled={isUpdating}>
              Start Work
            </Button>
          )}
          {request.status === 'IN_PROGRESS' && (
            <Button onClick={() => updateStatus('COMPLETED')} disabled={isUpdating}>
              Complete
            </Button>
          )}
          {!['COMPLETED', 'CANCELLED'].includes(request.status) && (
            <Button variant="outline" onClick={() => updateStatus('CANCELLED')} disabled={isUpdating}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Request Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Title</label>
                <p className="font-medium">{request.title}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Description</label>
                <p className="whitespace-pre-wrap">{request.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Priority</label>
                  <p>
                    <span className={`rounded px-2 py-1 text-sm font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Source</label>
                  <p>{request.source}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Type</label>
                  <p>{request.complaintType?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Zone</label>
                  <p>{request.zone?.name || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Timeline</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <div className="h-full w-0.5 bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-medium">Request Created</p>
                  <p className="text-sm text-gray-500">{new Date(request.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {request.updatedAt !== request.createdAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm text-gray-500">{new Date(request.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Customer</h3>
            {request.customer ? (
              <div className="space-y-2">
                <p className="font-medium">{request.customer.firstName} {request.customer.lastName}</p>
                {request.customer.email && <p className="text-sm text-gray-500">{request.customer.email}</p>}
                {request.customer.phone && <p className="text-sm text-gray-500">{request.customer.phone}</p>}
                <Link href={`/customers/${request.customer.id}`} className="text-sm text-primary hover:underline">
                  View Profile
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">No customer assigned</p>
            )}
          </div>

          {/* Property */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Property</h3>
            {request.property ? (
              <div className="space-y-2">
                <p className="font-medium">{request.property.name}</p>
                {request.property.address && <p className="text-sm text-gray-500">{request.property.address}</p>}
              </div>
            ) : (
              <p className="text-gray-500">No property assigned</p>
            )}
          </div>

          {/* Assigned Employee */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Assigned To</h3>
            {request.assignedEmployee ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {request.assignedEmployee.firstName} {request.assignedEmployee.lastName}
                </p>
                <Link href={`/employees/${request.assignedEmployee.id}`} className="text-sm text-primary hover:underline">
                  View Profile
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-gray-500">Not assigned yet</p>
                <Button size="sm" variant="outline">
                  Assign Employee
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
