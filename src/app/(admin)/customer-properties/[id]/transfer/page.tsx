'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

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
  };
  ownershipType: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  customerNo: string;
}

export default function TransferCustomerPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [currentRelation, setCurrentRelation] = useState<CustomerProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [newCustomerId, setNewCustomerId] = useState('');
  const [ownershipType, setOwnershipType] = useState<'OWNER' | 'TENANT' | 'PROPERTY_MANAGER' | 'AUTHORIZED_CONTACT'>('TENANT');
  const [transferDate, setTransferDate] = useState('');
  const [notes, setNotes] = useState('');

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCurrentRelation();
    }
  }, [params.id]);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  async function fetchCurrentRelation() {
    try {
      const data = await api.get<{ success: boolean; data: CustomerProperty }>(
        `/customer-properties/${params.id}`
      );
      if (data.success) {
        setCurrentRelation(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch current relationship');
    } finally {
      setIsLoading(false);
    }
  }

  async function searchCustomers() {
    try {
      const data = await api.get<{ success: boolean; data: Customer[] }>(
        `/customers?search=${encodeURIComponent(customerSearch)}&limit=10`
      );
      if (data.success) {
        // Filter out the current customer
        const filtered = data.data.filter(c => c.id !== currentRelation?.customer.id);
        setCustomers(filtered);
        setShowCustomerDropdown(true);
      }
    } catch (err) {
      console.error('Failed to search customers:', err);
    }
  }

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setNewCustomerId(customer.id);
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!newCustomerId) {
      setError('Please select a new customer');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        newCustomerId,
        ownershipType,
      };

      if (transferDate) {
        payload.transferDate = new Date(transferDate).toISOString();
      }
      if (notes) {
        payload.notes = notes;
      }

      await api.post(`/customer-properties/${params.id}/transfer`, payload);
      router.push('/customer-properties');
    } catch (err: any) {
      setError(err.message || 'Failed to transfer property');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-dark-500 dark:text-dark-400">Loading...</div>
      </div>
    );
  }

  if (!currentRelation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-6 text-center">
          <p className="text-red-700 dark:text-red-400">Relationship not found</p>
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/customer-properties/${params.id}`}
          className="text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Details
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-dark-800 dark:text-white">Transfer Property</h1>
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
          Transfer the property to a new customer
        </p>
      </div>

      {/* Current Relationship Info */}
      <div className="mb-6 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
        <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">Current Relationship</h3>
        <div className="text-sm text-orange-700 dark:text-orange-400">
          <p><strong>Customer:</strong> {currentRelation.customer.firstName} {currentRelation.customer.lastName} ({currentRelation.customer.customerNo})</p>
          <p><strong>Property:</strong> {currentRelation.property.name} ({currentRelation.property.propertyNo})</p>
          <p><strong>Type:</strong> {currentRelation.ownershipType}</p>
        </div>
        <p className="mt-2 text-xs text-orange-600 dark:text-orange-500">
          This relationship will be marked as "Transferred" and a new relationship will be created for the new customer.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          {/* New Customer Search */}
          <div className="mb-6 relative">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              New Customer *
            </label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer(null);
                setNewCustomerId('');
              }}
              onFocus={() => customerSearch.length >= 2 && setShowCustomerDropdown(true)}
              placeholder="Search by name, phone, or email..."
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  {selectedCustomer.phone || selectedCustomer.email || 'No contact info'}
                </p>
              </div>
            )}
            {showCustomerDropdown && customers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700 border-b border-dark-100 dark:border-dark-700 last:border-0"
                  >
                    <p className="font-medium text-dark-800 dark:text-white">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                      {customer.phone || customer.email || 'No contact info'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ownership Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Relationship Type for New Customer *
            </label>
            <select
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value as any)}
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="TENANT">Tenant</option>
              <option value="OWNER">Owner</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="AUTHORIZED_CONTACT">Authorized Contact</option>
            </select>
          </div>

          {/* Transfer Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Transfer Date
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">
              Leave empty to use today's date
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Transfer Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Reason for transfer, any relevant details..."
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href={`/customer-properties/${params.id}`}
            className="rounded-xl border border-dark-200 dark:border-dark-600 px-6 py-3 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Transferring...' : 'Transfer Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
