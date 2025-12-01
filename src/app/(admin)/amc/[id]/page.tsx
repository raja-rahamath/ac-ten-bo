'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date';

interface AmcContract {
  id: string;
  contractNo: string;
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    orgName?: string;
    customerType: string;
    email?: string;
    phone?: string;
  };
  startDate: string;
  endDate: string;
  contractValue: string;
  paymentTerms: string;
  status: string;
  autoRenew: boolean;
  renewalReminderDays?: number;
  terms?: string;
  notes?: string;
  properties: Array<{
    id: string;
    unit?: { id: string; unitNo: string; building?: { buildingNumber: string; name?: string } };
    property?: { id: string; name?: string; propertyNo?: string };
    notes?: string;
  }>;
  services: Array<{
    id: string;
    complaintType: { id: string; name: string };
    frequency: string;
    visitsPerYear: number;
  }>;
  schedules: Array<{
    id: string;
    scheduledDate: string;
    scheduledTime?: string;
    status: string;
    complaintType: { name: string };
    unit?: { unitNo: string; building?: { buildingNumber: string } };
    property?: { name?: string; propertyNo?: string };
    serviceRequest?: { id: string; requestNo: string; status: string };
    notes?: string;
  }>;
  payments: Array<{
    id: string;
    installmentNo: number;
    dueDate: string;
    amount: string;
    status: string;
    paidAt?: string;
    paidAmount?: string;
    paymentMethod?: string;
  }>;
  createdBy?: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string;
  renewedFrom?: { id: string; contractNo: string };
  renewedTo?: Array<{ id: string; contractNo: string }>;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RENEWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const SCHEDULE_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  MISSED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  RESCHEDULED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  DUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  WAIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-Weekly',
  MONTHLY: 'Monthly',
  BI_MONTHLY: 'Bi-Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL: 'Annual',
};

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  UPFRONT: 'Upfront',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL: 'Annual',
};

export default function AmcContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<AmcContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedules' | 'payments'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [params.id]);

  async function fetchContract() {
    try {
      const res = await api.get<{ success: boolean; data: AmcContract }>(`/amc/${params.id}`);
      if (res.success) {
        setContract(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(status: string, reason?: string) {
    if (!contract) return;
    setIsUpdating(true);
    try {
      await api.patch(`/amc/${contract.id}/status`, { status, reason });
      await fetchContract();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function generateSchedules() {
    if (!contract) return;
    setIsUpdating(true);
    try {
      await api.post(`/amc/${contract.id}/schedules/generate`, {});
      await fetchContract();
    } catch (error) {
      console.error('Failed to generate schedules:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function renewContract() {
    if (!contract) return;
    setIsUpdating(true);
    try {
      const res = await api.post<{ success: boolean; data: { id: string } }>(`/amc/${contract.id}/renew`, {});
      if (res.success) {
        router.push(`/amc/${res.data.id}`);
      }
    } catch (error) {
      console.error('Failed to renew contract:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  function getCustomerName() {
    if (!contract) return '';
    const c = contract.customer;
    if (c.customerType === 'ORGANIZATION') return c.orgName || 'Unknown';
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
  }

  function getDaysLeft() {
    if (!contract) return 0;
    const end = new Date(contract.endDate);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-500">Contract not found</p>
        <Link href="/amc" className="text-primary-500 hover:underline mt-2 inline-block">
          Back to Contracts
        </Link>
      </div>
    );
  }

  const daysLeft = getDaysLeft();
  const isExpiringSoon = contract.status === 'ACTIVE' && daysLeft <= 30 && daysLeft > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark-800 dark:text-white">{contract.contractNo}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[contract.status]}`}>
                {contract.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-dark-500 dark:text-dark-400">
              {getCustomerName()} &bull; {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === 'DRAFT' && (
            <button
              onClick={() => updateStatus('PENDING_APPROVAL')}
              disabled={isUpdating}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm"
            >
              Submit for Approval
            </button>
          )}
          {contract.status === 'PENDING_APPROVAL' && (
            <button
              onClick={() => updateStatus('ACTIVE')}
              disabled={isUpdating}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
            >
              Approve & Activate
            </button>
          )}
          {(contract.status === 'ACTIVE' || contract.status === 'EXPIRED') && (
            <button
              onClick={renewContract}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm"
            >
              Renew Contract
            </button>
          )}
          {contract.status === 'ACTIVE' && (
            <button
              onClick={() => updateStatus('SUSPENDED')}
              disabled={isUpdating}
              className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 text-sm"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {isExpiringSoon && (
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-orange-700 dark:text-orange-300">
            This contract expires in {daysLeft} days. Consider renewing.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-dark-100 dark:border-dark-700">
        {(['overview', 'schedules', 'payments'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-dark-500 hover:text-dark-700'
            }`}
          >
            {tab}
            {tab === 'schedules' && (
              <span className="ml-2 px-2 py-0.5 bg-dark-100 dark:bg-dark-700 rounded-full text-xs">
                {contract.schedules.length}
              </span>
            )}
            {tab === 'payments' && (
              <span className="ml-2 px-2 py-0.5 bg-dark-100 dark:bg-dark-700 rounded-full text-xs">
                {contract.payments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Contract Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-500">Contract Value</span>
                  <p className="font-medium text-dark-800 dark:text-white">{Number(contract.contractValue).toFixed(3)} BHD</p>
                </div>
                <div>
                  <span className="text-dark-500">Payment Terms</span>
                  <p className="font-medium text-dark-800 dark:text-white">{PAYMENT_TERMS_LABELS[contract.paymentTerms]}</p>
                </div>
                <div>
                  <span className="text-dark-500">Auto-Renew</span>
                  <p className="font-medium text-dark-800 dark:text-white">
                    {contract.autoRenew ? `Yes (${contract.renewalReminderDays} days reminder)` : 'No'}
                  </p>
                </div>
                <div>
                  <span className="text-dark-500">Created</span>
                  <p className="font-medium text-dark-800 dark:text-white">{formatDate(contract.createdAt)}</p>
                </div>
                {contract.approvedAt && (
                  <div>
                    <span className="text-dark-500">Approved</span>
                    <p className="font-medium text-dark-800 dark:text-white">
                      {formatDate(contract.approvedAt)}
                      {contract.approvedBy && ` by ${contract.approvedBy.firstName} ${contract.approvedBy.lastName}`}
                    </p>
                  </div>
                )}
                {contract.renewedFrom && (
                  <div>
                    <span className="text-dark-500">Renewed From</span>
                    <Link href={`/amc/${contract.renewedFrom.id}`} className="text-primary-500 hover:underline">
                      {contract.renewedFrom.contractNo}
                    </Link>
                  </div>
                )}
              </div>
              {contract.notes && (
                <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
                  <span className="text-dark-500 text-sm">Notes</span>
                  <p className="text-dark-800 dark:text-white mt-1">{contract.notes}</p>
                </div>
              )}
            </div>

            {/* Properties */}
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="font-semibold text-dark-800 dark:text-white mb-4">
                Properties ({contract.properties.length})
              </h3>
              <div className="space-y-3">
                {contract.properties.map((prop) => (
                  <div key={prop.id} className="p-3 bg-dark-50 dark:bg-dark-700 rounded-lg">
                    <div className="font-medium text-dark-800 dark:text-white">
                      {prop.unit
                        ? `Bldg ${prop.unit.building?.buildingNumber || ''} - Unit ${prop.unit.unitNo}`
                        : prop.property?.name || prop.property?.propertyNo}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="font-semibold text-dark-800 dark:text-white mb-4">
                Services ({contract.services.length})
              </h3>
              <div className="space-y-3">
                {contract.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-dark-50 dark:bg-dark-700 rounded-lg">
                    <div className="font-medium text-dark-800 dark:text-white">{service.complaintType.name}</div>
                    <div className="text-sm text-dark-500">
                      {FREQUENCY_LABELS[service.frequency]} ({service.visitsPerYear} visits/year)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Card */}
          <div>
            <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Customer</h3>
              <div className="space-y-3">
                <div>
                  <Link href={`/customers/${contract.customer.id}`} className="text-lg font-medium text-primary-600 dark:text-primary-400 hover:underline">
                    {getCustomerName()}
                  </Link>
                </div>
                {contract.customer.email && (
                  <div className="text-sm">
                    <span className="text-dark-500">Email: </span>
                    <span className="text-dark-700 dark:text-dark-300">{contract.customer.email}</span>
                  </div>
                )}
                {contract.customer.phone && (
                  <div className="text-sm">
                    <span className="text-dark-500">Phone: </span>
                    <span className="text-dark-700 dark:text-dark-300">{contract.customer.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {contract.status === 'ACTIVE' && (
              <div className="mt-6 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
                <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={generateSchedules}
                    disabled={isUpdating}
                    className="w-full px-4 py-2 border border-dark-200 dark:border-dark-600 rounded-lg text-sm hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    Regenerate Schedules
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700">
          {contract.schedules.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              <p>No service schedules yet.</p>
              {contract.status === 'ACTIVE' && (
                <button
                  onClick={generateSchedules}
                  disabled={isUpdating}
                  className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  Generate Schedules
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Service</th>
                    <th className="px-6 py-3 font-medium">Property</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Service Request</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.schedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b border-dark-100 dark:border-dark-700 last:border-0">
                      <td className="px-6 py-4 text-dark-800 dark:text-white">
                        {formatDate(schedule.scheduledDate)}
                        {schedule.scheduledTime && (
                          <span className="text-dark-500 ml-2">{schedule.scheduledTime}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">{schedule.complaintType.name}</td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                        {schedule.unit
                          ? `Bldg ${schedule.unit.building?.buildingNumber || ''} - ${schedule.unit.unitNo}`
                          : schedule.property?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${SCHEDULE_STATUS_COLORS[schedule.status]}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {schedule.serviceRequest ? (
                          <Link
                            href={`/requests/${schedule.serviceRequest.id}`}
                            className="text-primary-500 hover:underline"
                          >
                            {schedule.serviceRequest.requestNo}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700">
          {contract.payments.length === 0 ? (
            <div className="text-center py-12 text-dark-500">
              No payment schedule generated yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500">
                    <th className="px-6 py-3 font-medium">#</th>
                    <th className="px-6 py-3 font-medium">Due Date</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Paid</th>
                    <th className="px-6 py-3 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-dark-100 dark:border-dark-700 last:border-0">
                      <td className="px-6 py-4 text-dark-800 dark:text-white">{payment.installmentNo}</td>
                      <td className="px-6 py-4 text-dark-700 dark:text-dark-300">{formatDate(payment.dueDate)}</td>
                      <td className="px-6 py-4 font-medium text-dark-800 dark:text-white">
                        {Number(payment.amount).toFixed(3)} BHD
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                        {payment.paidAt ? (
                          <>
                            {formatDate(payment.paidAt)}
                            {payment.paidAmount && (
                              <span className="block text-sm">{Number(payment.paidAmount).toFixed(3)} BHD</span>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-dark-600 dark:text-dark-400">
                        {payment.paymentMethod?.replace('_', ' ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
