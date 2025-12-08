'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  customerNo: string;
}

interface Property {
  id: string;
  name: string;
  propertyNo: string;
  address?: string;
  type?: { name: string };
  areaRef?: { name: string };
}

export default function NewCustomerPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [customerId, setCustomerId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [ownershipType, setOwnershipType] = useState<'OWNER' | 'TENANT' | 'PROPERTY_MANAGER' | 'AUTHORIZED_CONTACT'>('TENANT');
  const [isPrimary, setIsPrimary] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  // Search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Refs for click outside handling
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const propertyDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
      if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(event.target as Node)) {
        setShowPropertyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search customers
  useEffect(() => {
    if (customerSearch.length >= 1) {
      const timer = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  // Search properties
  useEffect(() => {
    if (propertySearch.length >= 1) {
      const timer = setTimeout(() => {
        searchProperties();
      }, 300);
      return () => clearTimeout(timer);
    } else if (propertySearch.length === 0 && showPropertyDropdown) {
      // Load initial properties when dropdown is shown but no search
      loadInitialProperties();
    }
  }, [propertySearch, showPropertyDropdown]);

  async function searchCustomers() {
    setIsLoadingCustomers(true);
    try {
      const data = await api.get<{ success: boolean; data: Customer[] }>(
        `/customers?search=${encodeURIComponent(customerSearch)}&limit=10`
      );
      if (data.success) {
        setCustomers(data.data);
        setShowCustomerDropdown(true);
      }
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setIsLoadingCustomers(false);
    }
  }

  async function loadInitialProperties() {
    setIsLoadingProperties(true);
    try {
      const data = await api.get<{ success: boolean; data: Property[] }>(
        `/properties?limit=20`
      );
      if (data.success) {
        setProperties(data.data);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setIsLoadingProperties(false);
    }
  }

  async function searchProperties() {
    setIsLoadingProperties(true);
    try {
      const data = await api.get<{ success: boolean; data: Property[] }>(
        `/properties?search=${encodeURIComponent(propertySearch)}&limit=20`
      );
      if (data.success) {
        setProperties(data.data);
        setShowPropertyDropdown(true);
      }
    } catch (err) {
      console.error('Failed to search properties:', err);
    } finally {
      setIsLoadingProperties(false);
    }
  }

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerDropdown(false);
  }

  function selectProperty(property: Property) {
    setSelectedProperty(property);
    setPropertyId(property.id);
    setPropertySearch(property.address || property.name);
    setShowPropertyDropdown(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    if (!propertyId) {
      setError('Please select a property');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        customerId,
        propertyId,
        ownershipType,
        isPrimary,
      };

      if (startDate) {
        payload.startDate = new Date(startDate).toISOString();
      }
      if (notes) {
        payload.notes = notes;
      }

      await api.post('/customer-properties', payload);
      router.push('/customer-properties');
    } catch (err: any) {
      setError(err.message || 'Failed to create customer-property link');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
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
        <h1 className="mt-4 text-2xl font-bold text-dark-800 dark:text-white">Link Customer to Property</h1>
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
          Create a relationship between a customer and a property
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          {/* Customer Search */}
          <div className="mb-6 relative" ref={customerDropdownRef}>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Customer *
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomer(null);
                  setCustomerId('');
                }}
                onFocus={() => customerSearch.length >= 1 && setShowCustomerDropdown(true)}
                placeholder="Search by name, phone, or email..."
                className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 pr-10 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              {isLoadingCustomers && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
                </div>
              )}
            </div>
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400">
                    {selectedCustomer.phone || selectedCustomer.email || 'No contact info'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerId('');
                    setCustomerSearch('');
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {showCustomerDropdown && !selectedCustomer && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                {isLoadingCustomers ? (
                  <div className="px-4 py-6 text-center text-dark-500 dark:text-dark-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2" />
                    Searching...
                  </div>
                ) : customers.length > 0 ? (
                  customers.map((customer) => (
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
                  ))
                ) : customerSearch.length >= 1 ? (
                  <div className="px-4 py-6 text-center text-dark-500 dark:text-dark-400">
                    No customers found
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-dark-500 dark:text-dark-400">
                    Type to search customers...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property Search */}
          <div className="mb-6 relative" ref={propertyDropdownRef}>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Property *
            </label>
            <div className="relative">
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => {
                  setPropertySearch(e.target.value);
                  setSelectedProperty(null);
                  setPropertyId('');
                }}
                onFocus={() => {
                  setShowPropertyDropdown(true);
                  if (propertySearch.length === 0) {
                    loadInitialProperties();
                  }
                }}
                placeholder="Type to search or click to select..."
                className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 pr-10 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isLoadingProperties ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
                ) : (
                  <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
            {selectedProperty && (
              <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                    {selectedProperty.address || selectedProperty.name}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400">
                    {selectedProperty.type?.name || 'Unknown type'}{selectedProperty.areaRef?.name ? `, ${selectedProperty.areaRef.name}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProperty(null);
                    setPropertyId('');
                    setPropertySearch('');
                  }}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {showPropertyDropdown && !selectedProperty && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                {isLoadingProperties ? (
                  <div className="px-4 py-6 text-center text-dark-500 dark:text-dark-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2" />
                    Loading properties...
                  </div>
                ) : properties.length > 0 ? (
                  properties.map((property) => (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => selectProperty(property)}
                      className="w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700 border-b border-dark-100 dark:border-dark-700 last:border-0"
                    >
                      <p className="font-medium text-dark-800 dark:text-white">
                        {property.address || property.name}
                      </p>
                      <p className="text-xs text-dark-500 dark:text-dark-400">
                        {property.type?.name || 'Unknown type'}{property.areaRef?.name ? `, ${property.areaRef.name}` : ''}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-dark-500 dark:text-dark-400">
                    No properties found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ownership Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Relationship Type *
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

          {/* Start Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Is Primary */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-700 dark:text-dark-300">
                Set as primary contact for this property
              </span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/customer-properties"
            className="rounded-xl border border-dark-200 dark:border-dark-600 px-6 py-3 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Link'}
          </button>
        </div>
      </form>
    </div>
  );
}
