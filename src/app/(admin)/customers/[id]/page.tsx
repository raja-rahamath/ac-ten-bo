'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button, AsyncSelect, AsyncSelectOption } from '@/components/ui';
import { formatDate } from '@/lib/date';

interface CustomerUnit {
  unitId: string;
  ownershipType: string;
  isPrimary: boolean;
  unit: {
    id: string;
    unitNo: string;
    flatNumber?: string;
    building: {
      id: string;
      buildingNumber: string;
      roadNumber: string;
      blockNumber: string;
      name?: string;
      zone?: { name: string };
    };
    type?: { name: string };
  };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  units?: CustomerUnit[];
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
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingUnit, setLinkingUnit] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [ownershipType, setOwnershipType] = useState<'OWNER' | 'TENANT'>('TENANT');

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const searchProperties = useCallback(async (query: string): Promise<AsyncSelectOption[]> => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(
        `${API_URL}/buildings/properties?building=${encodeURIComponent(query)}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.data) {
        return data.data
          .filter((p: { type: string }) => p.type === 'unit') // Only units, not buildings
          .map((p: {
            id: string;
            flatNumber?: string;
            buildingNumber: string;
            roadNumber: string;
            blockNumber: string;
            zoneName?: string;
            unitType: string;
          }) => ({
            value: p.id,
            label: p.flatNumber
              ? `Flat ${p.flatNumber}, Building ${p.buildingNumber}`
              : `Building ${p.buildingNumber}`,
            sublabel: `Road ${p.roadNumber}, Block ${p.blockNumber}${p.zoneName ? `, ${p.zoneName}` : ''} - ${p.unitType}`,
          }));
      }
    } catch (error) {
      console.error('Failed to search properties:', error);
    }
    return [];
  }, []);

  async function handleLinkUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnitId) {
      toast.error('Please select a property');
      return;
    }

    setLinkingUnit(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/customers/${params.id}/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unitId: selectedUnitId,
          ownershipType,
          isPrimary: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to link property');
      }

      toast.success('Property linked successfully!');
      setShowLinkModal(false);
      setSelectedUnitId('');
      setOwnershipType('TENANT');
      fetchCustomer(); // Refresh data
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link property');
    } finally {
      setLinkingUnit(false);
    }
  }

  async function handleUnlinkUnit(unitId: string) {
    if (!confirm('Are you sure you want to unlink this property?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/customers/${params.id}/units/${unitId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to unlink property');
      }

      toast.success('Property unlinked successfully!');
      fetchCustomer(); // Refresh data
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to unlink property');
    }
  }

  async function fetchCustomer() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/customers/${params.id}`, {
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
              <button
                onClick={() => setShowLinkModal(true)}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                + Link Property
              </button>
            </div>
            {customer.units && customer.units.length > 0 ? (
              <div className="space-y-4">
                {customer.units.map((cu) => (
                  <div key={cu.unitId} className="rounded-lg border dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {cu.unit.flatNumber
                            ? `Flat ${cu.unit.flatNumber}, Building ${cu.unit.building.buildingNumber}`
                            : `Building ${cu.unit.building.buildingNumber}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Road {cu.unit.building.roadNumber}, Block {cu.unit.building.blockNumber}
                          {cu.unit.building.zone?.name && `, ${cu.unit.building.zone.name}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cu.unit.type?.name || 'Unit'} • {cu.ownershipType}
                          {cu.isPrimary && ' • Primary'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnlinkUnit(cu.unitId)}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Unlink
                      </button>
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
      {/* Link Property Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-dark-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Link Property</h2>
            <form onSubmit={handleLinkUnit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Property
                </label>
                <AsyncSelect
                  onSearch={searchProperties}
                  placeholder="Type building number to search..."
                  onChange={(value) => setSelectedUnitId(value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ownership Type
                </label>
                <select
                  value={ownershipType}
                  onChange={(e) => setOwnershipType(e.target.value as 'OWNER' | 'TENANT')}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card px-3 py-2 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="TENANT">Tenant</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedUnitId('');
                    setOwnershipType('TENANT');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={linkingUnit || !selectedUnitId}>
                  {linkingUnit ? 'Linking...' : 'Link Property'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
