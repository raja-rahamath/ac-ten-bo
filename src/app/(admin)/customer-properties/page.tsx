'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date';

interface CustomerProperty {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  property: {
    id: string;
    name: string;
    propertyNo: string;
    address?: string;
    type?: {
      name: string;
    };
    areaRef?: {
      name: string;
    };
  };
  ownershipType: 'OWNER' | 'TENANT' | 'PROPERTY_MANAGER' | 'AUTHORIZED_CONTACT';
  status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED';
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function CustomerPropertiesPage() {
  const [customerProperties, setCustomerProperties] = useState<CustomerProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('');

  useEffect(() => {
    fetchCustomerProperties();
  }, [page, statusFilter, ownershipFilter]);

  async function fetchCustomerProperties() {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter) params.append('status', statusFilter);
      if (ownershipFilter) params.append('ownershipType', ownershipFilter);
      if (search) params.append('search', search);

      const data = await api.get<{
        success: boolean;
        data: CustomerProperty[];
        pagination?: { total: number };
      }>(`/customer-properties?${params}`);

      if (data.success) {
        setCustomerProperties(data.data);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / 20));
      }
    } catch (error) {
      console.error('Failed to fetch customer properties:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCustomerProperties();
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Customer Properties</h1>
          <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
            Manage relationships between customers and properties
          </p>
        </div>
        <Link
          href="/customer-properties/new"
          className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
        >
          + Link Customer to Property
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by customer or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-dark-100 dark:bg-dark-700 px-4 py-3 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="TRANSFERRED">Transferred</option>
        </select>

        <select
          value={ownershipFilter}
          onChange={(e) => { setOwnershipFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Types</option>
          <option value="OWNER">Owner</option>
          <option value="TENANT">Tenant</option>
          <option value="PROPERTY_MANAGER">Property Manager</option>
          <option value="AUTHORIZED_CONTACT">Authorized Contact</option>
        </select>
      </div>

      {/* Customer Properties Table */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
        {isLoading ? (
          <div className="py-12 text-center text-dark-500 dark:text-dark-400">Loading...</div>
        ) : customerProperties.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-dark-500 dark:text-dark-400 mb-4">No customer-property relationships found</p>
            <Link
              href="/customer-properties/new"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Create your first customer-property link
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500 dark:text-dark-400">
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Property</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Primary</th>
                    <th className="px-6 py-4 font-medium">Start Date</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customerProperties.map((cp) => (
                    <tr
                      key={cp.id}
                      className="border-b border-dark-100 dark:border-dark-700 last:border-0 hover:bg-dark-50 dark:hover:bg-dark-700/50"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${cp.customer.id}`}
                          className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {cp.customer.firstName} {cp.customer.lastName}
                        </Link>
                        <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                          {cp.customer.phone || cp.customer.email || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/properties/${cp.property.id}`}
                          className="font-medium text-dark-800 dark:text-white hover:text-primary-600"
                        >
                          {cp.property.name}
                        </Link>
                        <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                          {cp.property.propertyNo} {cp.property.areaRef?.name ? `- ${cp.property.areaRef.name}` : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getOwnershipColor(cp.ownershipType)}`}>
                          {formatOwnershipType(cp.ownershipType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(cp.status)}`}>
                          {cp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {cp.isPrimary && (
                          <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Primary
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-dark-500 dark:text-dark-400">
                        {cp.startDate ? formatDate(cp.startDate) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/customer-properties/${cp.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                          >
                            View
                          </Link>
                          {cp.status === 'ACTIVE' && (
                            <Link
                              href={`/customer-properties/${cp.id}/transfer`}
                              className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
                            >
                              Transfer
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-dark-100 dark:border-dark-700 px-6 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-dark-500 dark:text-dark-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-50"
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
