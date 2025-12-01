'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { formatDate } from '@/lib/date';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  properties?: {
    property: {
      id: string;
      name: string;
      address?: string;
      propertyType?: { name: string };
    };
    ownershipType: string;
  }[];
  serviceRequests?: {
    id: string;
    requestNo: string;
    title: string;
    status: string;
    createdAt: string;
  }[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  async function fetchCustomer() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/customers/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setCustomer(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  if (!customer) {
    return <div className="flex h-64 items-center justify-center">Customer not found</div>;
  }

  const customerStatus = customer.isActive ? 'ACTIVE' : 'INACTIVE';

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.firstName} {customer.lastName}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(customerStatus)}`}>
            {customerStatus}
          </span>
        </div>
        <Button asChild variant="outline">
          <Link href={`/customers/${customer.id}/edit`}>Edit Customer</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                <p className="font-medium text-gray-900 dark:text-white">{customer.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Phone</label>
                <p className="font-medium text-gray-900 dark:text-white">{customer.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Member Since</label>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(customer.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(customer.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
            {customer.properties && customer.properties.length > 0 ? (
              <div className="space-y-4">
                {customer.properties.map((cp, index) => (
                  <div key={index} className="rounded-lg border dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{cp.property.name}</p>
                        {cp.property.address && <p className="text-sm text-gray-500 dark:text-gray-400">{cp.property.address}</p>}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cp.property.propertyType?.name} • {cp.ownershipType}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No properties linked</p>
            )}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Requests</h3>
              <Link href={`/requests?customerId=${customer.id}`} className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            {customer.serviceRequests && customer.serviceRequests.length > 0 ? (
              <div className="space-y-3">
                {customer.serviceRequests.slice(0, 5).map((request) => (
                  <Link
                    key={request.id}
                    href={`/requests/${request.id}`}
                    className="block rounded-lg border dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-dark-hover"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{request.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{request.requestNo}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No service requests</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white dark:bg-dark-card p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/requests/new?customerId=${customer.id}`}>Create Request</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/invoices/new?customerId=${customer.id}`}>Create Invoice</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
