'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface CustomerProperty {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    customerNo: string;
  };
  property: {
    id: string;
    name: string;
    propertyNo: string;
    address?: string;
    type?: { name: string };
    areaRef?: { name: string };
  };
  ownershipType: 'OWNER' | 'TENANT' | 'PROPERTY_MANAGER' | 'AUTHORIZED_CONTACT';
  status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED';
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  serviceRequests?: {
    id: string;
    requestNo: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }[];
}

export default function CustomerPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customerProperty, setCustomerProperty] = useState<CustomerProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    ownershipType: '' as 'OWNER' | 'TENANT' | 'PROPERTY_MANAGER' | 'AUTHORIZED_CONTACT',
    isPrimary: false,
    notes: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCustomerProperty();
    }
  }, [params.id]);

  async function fetchCustomerProperty() {
    try {
      const data = await api.get<{ success: boolean; data: CustomerProperty }>(
        `/customer-properties/${params.id}`
      );
      if (data.success) {
        setCustomerProperty(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customer-property details');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeactivate() {
    setIsDeactivating(true);
    try {
      await api.post(`/customer-properties/${params.id}/deactivate`, {});
      await fetchCustomerProperty();
      setShowDeactivateModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate relationship');
    } finally {
      setIsDeactivating(false);
    }
  }

  function openEditModal() {
    if (customerProperty) {
      setEditForm({
        ownershipType: customerProperty.ownershipType,
        isPrimary: customerProperty.isPrimary,
        notes: customerProperty.notes || '',
      });
      setShowEditModal(true);
    }
  }

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      await api.put(`/customer-properties/${params.id}`, editForm);
      await fetchCustomerProperty();
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update relationship');
    } finally {
      setIsUpdating(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'TRANSFERRED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  function getOwnershipColor(type: string) {
    switch (type) {
      case 'OWNER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'TENANT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'PROPERTY_MANAGER':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'AUTHORIZED_CONTACT':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }

  function formatOwnershipType(type: string) {
    return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-dark-500 dark:text-dark-400">Loading...</div>
      </div>
    );
  }

  if (error || !customerProperty) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-6 text-center">
          <p className="text-red-700 dark:text-red-400">{error || 'Customer-Property relationship not found'}</p>
          <Link
            href="/customer-properties"
            className="mt-4 inline-block text-primary-600 dark:text-primary-400 hover:underline"
          >
            Back to Customer Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/customer-properties"
          className="text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customer Properties
        </Link>
        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Customer-Property Details</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(customerProperty.status)}`}>
                {customerProperty.status}
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getOwnershipColor(customerProperty.ownershipType)}`}>
                {formatOwnershipType(customerProperty.ownershipType)}
              </span>
              {customerProperty.isPrimary && (
                <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Primary Contact
                </span>
              )}
            </div>
          </div>
          {customerProperty.status === 'ACTIVE' && (
            <div className="flex gap-2">
              <button
                onClick={openEditModal}
                className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                Edit
              </button>
              <Link
                href={`/customer-properties/${customerProperty.id}/transfer`}
                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              >
                Transfer
              </Link>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Deactivate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Card */}
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Customer</h2>
          <div className="space-y-3">
            <div>
              <Link
                href={`/customers/${customerProperty.customer.id}`}
                className="text-lg font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                {customerProperty.customer.firstName} {customerProperty.customer.lastName}
              </Link>
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              <span className="text-dark-600 dark:text-dark-300">Customer No:</span> {customerProperty.customer.customerNo}
            </div>
            {customerProperty.customer.phone && (
              <div className="text-sm text-dark-500 dark:text-dark-400">
                <span className="text-dark-600 dark:text-dark-300">Phone:</span> {customerProperty.customer.phone}
              </div>
            )}
            {customerProperty.customer.email && (
              <div className="text-sm text-dark-500 dark:text-dark-400">
                <span className="text-dark-600 dark:text-dark-300">Email:</span> {customerProperty.customer.email}
              </div>
            )}
          </div>
        </div>

        {/* Property Card */}
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Property</h2>
          <div className="space-y-3">
            <div>
              <Link
                href={`/properties/${customerProperty.property.id}`}
                className="text-lg font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                {customerProperty.property.name}
              </Link>
            </div>
            <div className="text-sm text-dark-500 dark:text-dark-400">
              <span className="text-dark-600 dark:text-dark-300">Property No:</span> {customerProperty.property.propertyNo}
            </div>
            {customerProperty.property.type && (
              <div className="text-sm text-dark-500 dark:text-dark-400">
                <span className="text-dark-600 dark:text-dark-300">Type:</span> {customerProperty.property.type.name}
              </div>
            )}
            {customerProperty.property.address && (
              <div className="text-sm text-dark-500 dark:text-dark-400">
                <span className="text-dark-600 dark:text-dark-300">Address:</span> {customerProperty.property.address}
              </div>
            )}
            {customerProperty.property.areaRef && (
              <div className="text-sm text-dark-500 dark:text-dark-400">
                <span className="text-dark-600 dark:text-dark-300">Area:</span> {customerProperty.property.areaRef.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Relationship Details */}
      <div className="mt-6 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
        <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Relationship Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-dark-500 dark:text-dark-400 uppercase tracking-wider">Start Date</p>
            <p className="mt-1 text-dark-800 dark:text-white">
              {customerProperty.startDate ? formatDate(customerProperty.startDate) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500 dark:text-dark-400 uppercase tracking-wider">End Date</p>
            <p className="mt-1 text-dark-800 dark:text-white">
              {customerProperty.endDate ? formatDate(customerProperty.endDate) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-500 dark:text-dark-400 uppercase tracking-wider">Created</p>
            <p className="mt-1 text-dark-800 dark:text-white">{formatDate(customerProperty.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-dark-500 dark:text-dark-400 uppercase tracking-wider">Last Updated</p>
            <p className="mt-1 text-dark-800 dark:text-white">{formatDate(customerProperty.updatedAt)}</p>
          </div>
        </div>
        {customerProperty.notes && (
          <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
            <p className="text-xs text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2">Notes</p>
            <p className="text-dark-700 dark:text-dark-300 whitespace-pre-wrap">{customerProperty.notes}</p>
          </div>
        )}
      </div>

      {/* Service Request History */}
      {customerProperty.serviceRequests && customerProperty.serviceRequests.length > 0 && (
        <div className="mt-6 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Service Request History</h2>
          <div className="space-y-3">
            {customerProperty.serviceRequests.map((sr) => (
              <Link
                key={sr.id}
                href={`/requests/${sr.id}`}
                className="block p-3 rounded-lg bg-dark-50 dark:bg-dark-700 hover:bg-dark-100 dark:hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-dark-800 dark:text-white">{sr.requestNo}</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">{sr.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-dark-500 dark:text-dark-400">{formatDate(sr.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {customerProperty.status === 'ACTIVE' && (
        <div className="mt-6 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-6">
          <h3 className="font-semibold text-primary-800 dark:text-primary-300 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/requests/new?customerId=${customerProperty.customer.id}&propertyId=${customerProperty.property.id}&customerPropertyId=${customerProperty.id}`}
              className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
            >
              Create Service Request
            </Link>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivate}
        title="Deactivate Relationship"
        message="Are you sure you want to deactivate this customer-property relationship? This will mark the relationship as inactive but preserve the history."
        confirmText="Deactivate"
        variant="danger"
        isLoading={isDeactivating}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Edit Relationship
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Ownership Type */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Ownership Type
                </label>
                <select
                  value={editForm.ownershipType}
                  onChange={(e) => setEditForm({ ...editForm, ownershipType: e.target.value as typeof editForm.ownershipType })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="AUTHORIZED_CONTACT">Authorized Contact</option>
                </select>
              </div>

              {/* Primary Contact */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={editForm.isPrimary}
                  onChange={(e) => setEditForm({ ...editForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPrimary" className="text-sm font-medium text-dark-700 dark:text-dark-300">
                  Primary Contact
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none resize-none"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-dark-100 dark:border-dark-700 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
