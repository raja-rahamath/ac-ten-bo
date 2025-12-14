'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Estimate {
  id: string;
  estimateNo: string;
  title: string;
  description?: string;
  scope?: string;
  version: number;
  status: string;
  isLatestVersion: boolean;

  // Costs
  materialCost: string;
  laborCost: string;
  equipmentCost: string;
  transportCost: string;
  otherCost: string;
  subtotal: string;

  // Profit
  profitMarginType?: string;
  profitMarginValue: string;
  profitAmount: string;

  // VAT & Discount
  vatRate: string;
  vatAmount: string;
  discountType?: string;
  discountValue: string;
  discountAmount: string;
  discountReason?: string;

  // Totals
  totalBeforeVat: string;
  total: string;

  // Timeline
  estimatedDuration?: string;
  estimatedStartDate?: string;
  estimatedEndDate?: string;

  // Notes
  internalNotes?: string;
  assumptions?: string;
  exclusions?: string;

  // Workflow
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  revisionNotes?: string;

  // Dates
  createdAt: string;
  updatedAt: string;

  // Relations
  serviceRequest: {
    id: string;
    requestNo: string;
    title: string;
    customer: {
      id: string;
      customerType: string;
      customerNo: string;
      firstName?: string;
      lastName?: string;
      orgName?: string;
      email?: string;
      phone?: string;
    };
    zone?: {
      id: string;
      name: string;
    };
    complaintType?: {
      id: string;
      name: string;
    };
  };
  siteVisit?: {
    id: string;
    visitNo: string;
    visitDate: string;
  };
  items: Array<{
    id: string;
    sortOrder: number;
    itemType: string;
    name: string;
    description?: string;
    sku?: string;
    quantity: string;
    unit: string;
    unitCost: string;
    totalCost: string;
    markupType?: string;
    markupValue: string;
    markupAmount: string;
    totalPrice: string;
    notes?: string;
  }>;
  laborItems: Array<{
    id: string;
    sortOrder: number;
    description: string;
    rateType: string;
    laborRateTypeId?: string;
    quantity: number;
    hours?: number;
    days?: number;
    hourlyRate: string;
    dailyRate: string;
    totalCost: string;
    markupType?: string;
    markupValue: string;
    markupAmount: string;
    totalPrice: string;
    notes?: string;
  }>;
  activities: Array<{
    id: string;
    action: string;
    description?: string;
    createdAt: string;
    performedBy?: { firstName: string; lastName: string };
  }>;
  revisions: Array<{
    id: string;
    estimateNo: string;
    version: number;
    status: string;
    total: string;
    createdAt: string;
  }>;
  parentEstimate?: { id: string; estimateNo: string; version: number };
  createdBy: { firstName: string; lastName: string };
  submittedBy?: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string };
  rejectedBy?: { firstName: string; lastName: string };
  convertedToQuote?: { id: string; quoteNo: string };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PENDING_MANAGER_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CONVERTED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_MANAGER_APPROVAL: 'Pending Approval',
  REVISION_REQUESTED: 'Revision Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONVERTED: 'Converted to Quote',
  CANCELLED: 'Cancelled',
};

const itemTypeLabels: Record<string, string> = {
  MATERIAL: 'Material',
  EQUIPMENT: 'Equipment',
  SERVICE: 'Service',
  OTHER: 'Other',
};

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [convertData, setConvertData] = useState({
    validUntil: '',
    title: '',
    description: '',
    terms: '',
  });

  useEffect(() => {
    fetchEstimate();
  }, [params.id]);

  const fetchEstimate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/estimates/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setEstimate(data);
        // Pre-fill convert modal data
        if (data) {
          const validUntil = new Date();
          validUntil.setDate(validUntil.getDate() + 30);
          setConvertData({
            validUntil: validUntil.toISOString().split('T')[0],
            title: data.title || '',
            description: data.description || '',
            terms: '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, payload?: any) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/estimates/${params.id}/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: payload ? JSON.stringify(payload) : undefined,
        }
      );

      if (response.ok) {
        fetchEstimate();
        setShowRejectModal(false);
        setShowRevisionModal(false);
        setShowConvertModal(false);
        setRejectReason('');
        setRevisionReason('');
        setRevisionNotes('');
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/estimates/${params.id}/create-revision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const newEstimate = await response.json();
        router.push(`/estimates/${newEstimate.id}`);
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Failed to create revision');
      }
    } catch (error) {
      console.error('Failed to create revision:', error);
      alert('Failed to create revision');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToQuote = async () => {
    await handleAction('convert-to-quote', convertData);
  };

  const getCustomerName = (customer: Estimate['serviceRequest']['customer']) => {
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  };

  const formatCurrency = (amount: string | number, currency: string = 'BHD') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency,
      minimumFractionDigits: 3,
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Estimate not found</h2>
        <Link href="/estimates" className="mt-4 text-blue-500 hover:text-blue-600">
          Back to Estimates
        </Link>
      </div>
    );
  }

  // Separate items by type
  const materialItems = estimate.items.filter(i => i.itemType === 'MATERIAL');
  const equipmentItems = estimate.items.filter(i => i.itemType === 'EQUIPMENT');
  const otherItems = estimate.items.filter(i => !['MATERIAL', 'EQUIPMENT'].includes(i.itemType));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/estimates"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {estimate.estimateNo}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{estimate.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 ml-11">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[estimate.status]}`}>
              {statusLabels[estimate.status]}
            </span>
            {estimate.version > 1 && (
              <span className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Version {estimate.version}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {estimate.status === 'DRAFT' && (
            <>
              <Link
                href={`/estimates/${estimate.id}/edit`}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => handleAction('submit', {})}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Submit for Approval
              </button>
            </>
          )}
          {estimate.status === 'REVISION_REQUESTED' && (
            <>
              <Link
                href={`/estimates/${estimate.id}/edit`}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => handleAction('submit', {})}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Resubmit
              </button>
            </>
          )}
          {estimate.status === 'PENDING_MANAGER_APPROVAL' && (
            <>
              <button
                onClick={() => handleAction('approve', {})}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRevisionModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                Request Revision
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {estimate.status === 'APPROVED' && !estimate.convertedToQuote && (
            <button
              onClick={() => setShowConvertModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              Convert to Quote
            </button>
          )}
          {['REJECTED', 'REVISION_REQUESTED'].includes(estimate.status) && estimate.isLatestVersion && (
            <button
              onClick={handleCreateRevision}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              Create New Revision
            </button>
          )}
          {!['CANCELLED', 'CONVERTED'].includes(estimate.status) && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this estimate?')) {
                  handleAction('cancel');
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Rejection Notice */}
      {estimate.status === 'REJECTED' && estimate.rejectionReason && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Estimate Rejected</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{estimate.rejectionReason}</p>
              {estimate.rejectedBy && estimate.rejectedAt && (
                <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                  by {estimate.rejectedBy.firstName} {estimate.rejectedBy.lastName} on {formatDate(estimate.rejectedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Notice */}
      {estimate.status === 'REVISION_REQUESTED' && estimate.revisionNotes && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-300">Revision Requested</p>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">{estimate.revisionNotes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Converted Notice */}
      {estimate.convertedToQuote && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                This estimate has been converted to a quote
              </p>
              <Link
                href={`/quotes/${estimate.convertedToQuote.id}`}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View Quote {estimate.convertedToQuote.quoteNo}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {[
            { id: 'details', label: 'Details' },
            { id: 'materials', label: 'Materials', count: materialItems.length },
            { id: 'labor', label: 'Labor', count: estimate.laborItems.length },
            { id: 'equipment', label: 'Equipment', count: equipmentItems.length },
            { id: 'activity', label: 'Activity', count: estimate.activities.length },
            { id: 'versions', label: 'Versions', count: estimate.revisions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-700">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Request Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Service Request</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Request No</p>
                <Link
                  href={`/requests/${estimate.serviceRequest.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {estimate.serviceRequest.requestNo}
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                <p className="font-medium text-gray-800 dark:text-white">{estimate.serviceRequest.title}</p>
              </div>
              {estimate.serviceRequest.zone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Zone</p>
                  <p className="font-medium text-gray-800 dark:text-white">{estimate.serviceRequest.zone.name}</p>
                </div>
              )}
              {estimate.serviceRequest.complaintType && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Service Type</p>
                  <p className="font-medium text-gray-800 dark:text-white">{estimate.serviceRequest.complaintType.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Customer</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {getCustomerName(estimate.serviceRequest.customer)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customer No</p>
                <p className="font-medium text-gray-800 dark:text-white">{estimate.serviceRequest.customer.customerNo}</p>
              </div>
              {estimate.serviceRequest.customer.email && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-800 dark:text-white">{estimate.serviceRequest.customer.email}</p>
                </div>
              )}
              {estimate.serviceRequest.customer.phone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-800 dark:text-white">{estimate.serviceRequest.customer.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Estimate Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Estimate Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium text-gray-800 dark:text-white">{formatDate(estimate.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {estimate.createdBy.firstName} {estimate.createdBy.lastName}
                </p>
              </div>
              {estimate.approvedAt && estimate.approvedBy && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {formatDate(estimate.approvedAt)} by {estimate.approvedBy.firstName} {estimate.approvedBy.lastName}
                  </p>
                </div>
              )}
              {estimate.estimatedDuration && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Duration</p>
                  <p className="font-medium text-gray-800 dark:text-white">{estimate.estimatedDuration}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Cost Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Materials</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.materialCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Labor</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.laborCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Equipment</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.equipmentCost)}</span>
              </div>
              {Number(estimate.transportCost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Transport</span>
                  <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.transportCost)}</span>
                </div>
              )}
              {Number(estimate.otherCost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Other</span>
                  <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.otherCost)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.subtotal)}</span>
              </div>
              {Number(estimate.profitAmount) > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Profit ({estimate.profitMarginType === 'PERCENTAGE' ? `${estimate.profitMarginValue}%` : 'Fixed'})</span>
                  <span>+{formatCurrency(estimate.profitAmount)}</span>
                </div>
              )}
              {Number(estimate.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(estimate.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-500 dark:text-gray-400">Before VAT</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.totalBeforeVat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">VAT ({estimate.vatRate}%)</span>
                <span className="text-gray-800 dark:text-white">{formatCurrency(estimate.vatAmount)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between text-lg font-bold">
                <span className="text-gray-800 dark:text-white">Total</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(estimate.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {(estimate.estimatedStartDate || estimate.estimatedEndDate) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Timeline</h3>
              <div className="space-y-3">
                {estimate.estimatedStartDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Start</p>
                    <p className="font-medium text-gray-800 dark:text-white">{formatDate(estimate.estimatedStartDate)}</p>
                  </div>
                )}
                {estimate.estimatedEndDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estimated End</p>
                    <p className="font-medium text-gray-800 dark:text-white">{formatDate(estimate.estimatedEndDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {estimate.description && (
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{estimate.description}</p>
            </div>
          )}

          {/* Scope */}
          {estimate.scope && (
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Scope of Work</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{estimate.scope}</p>
            </div>
          )}

          {/* Assumptions & Exclusions */}
          {(estimate.assumptions || estimate.exclusions) && (
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {estimate.assumptions && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Assumptions</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{estimate.assumptions}</p>
                </div>
              )}
              {estimate.exclusions && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Exclusions</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{estimate.exclusions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {materialItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No material items in this estimate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Markup</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {materialItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-gray-800 dark:text-white">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                        )}
                        {item.sku && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">SKU: {item.sku}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {Number(item.quantity)} {item.unit}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                        {Number(item.markupAmount) > 0 ? `+${formatCurrency(item.markupAmount)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800 dark:text-white">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <td colSpan={6} className="px-6 py-3 text-right font-medium text-gray-800 dark:text-white">
                      Materials Total:
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-gray-800 dark:text-white">
                      {formatCurrency(materialItems.reduce((sum, item) => sum + Number(item.totalPrice), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Labor Tab */}
      {activeTab === 'labor' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {estimate.laborItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No labor items in this estimate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Workers</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duration</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Markup</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {estimate.laborItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-gray-800 dark:text-white">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white">{item.description}</div>
                        {item.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {item.rateType === 'DAILY'
                          ? `${item.days || 0} day${(item.days || 0) !== 1 ? 's' : ''}`
                          : `${item.hours || 0} hr${(item.hours || 0) !== 1 ? 's' : ''}`
                        }
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {item.rateType === 'DAILY'
                          ? `${formatCurrency(item.dailyRate)}/day`
                          : `${formatCurrency(item.hourlyRate)}/hr`
                        }
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                        {Number(item.markupAmount) > 0 ? `+${formatCurrency(item.markupAmount)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800 dark:text-white">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <td colSpan={7} className="px-6 py-3 text-right font-medium text-gray-800 dark:text-white">
                      Labor Total:
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-gray-800 dark:text-white">
                      {formatCurrency(estimate.laborItems.reduce((sum, item) => sum + Number(item.totalPrice), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {equipmentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No equipment items in this estimate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Markup</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {equipmentItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-gray-800 dark:text-white">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800 dark:text-white">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {Number(item.quantity)} {item.unit}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 dark:text-white">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">
                        {Number(item.markupAmount) > 0 ? `+${formatCurrency(item.markupAmount)}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800 dark:text-white">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <td colSpan={6} className="px-6 py-3 text-right font-medium text-gray-800 dark:text-white">
                      Equipment Total:
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-gray-800 dark:text-white">
                      {formatCurrency(equipmentItems.reduce((sum, item) => sum + Number(item.totalPrice), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {estimate.activities.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No activity recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {estimate.activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {index < estimate.activities.length - 1 && (
                      <div className="w-px h-full bg-gray-200 dark:bg-gray-600 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-800 dark:text-white">{activity.action.replace(/_/g, ' ')}</p>
                    {activity.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDateTime(activity.createdAt)}
                      {activity.performedBy && (
                        <span> by {activity.performedBy.firstName} {activity.performedBy.lastName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {estimate.revisions.length === 0 && !estimate.parentEstimate ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              This is the original version with no revisions.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estimate No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Current version */}
                <tr className="bg-blue-50 dark:bg-blue-900/20">
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                    V{estimate.version} (Current)
                  </td>
                  <td className="px-6 py-4 text-gray-800 dark:text-white">{estimate.estimateNo}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[estimate.status]}`}>
                      {statusLabels[estimate.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800 dark:text-white">{formatCurrency(estimate.total)}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(estimate.createdAt)}</td>
                </tr>
                {/* Previous versions */}
                {estimate.revisions.map((rev) => (
                  <tr key={rev.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">V{rev.version}</td>
                    <td className="px-6 py-4">
                      <Link href={`/estimates/${rev.id}`} className="text-blue-600 hover:underline">
                        {rev.estimateNo}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[rev.status]}`}>
                        {statusLabels[rev.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-800 dark:text-white">{formatCurrency(rev.total)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(rev.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowRejectModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reject Estimate</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500"
                rows={4}
                required
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction('reject', { reason: rejectReason })}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowRevisionModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Request Revision</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Revision *
                  </label>
                  <textarea
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="What needs to be changed..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Any additional notes for the technician..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction('request-revision', { reason: revisionReason, notes: revisionNotes })}
                  disabled={!revisionReason.trim() || actionLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  Request Revision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Quote Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowConvertModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Convert to Quote</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={convertData.validUntil}
                    onChange={(e) => setConvertData({ ...convertData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote Title
                  </label>
                  <input
                    type="text"
                    value={convertData.title}
                    onChange={(e) => setConvertData({ ...convertData, title: e.target.value })}
                    placeholder="Optional: Override estimate title"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={convertData.description}
                    onChange={(e) => setConvertData({ ...convertData, description: e.target.value })}
                    placeholder="Customer-facing description..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={convertData.terms}
                    onChange={(e) => setConvertData({ ...convertData, terms: e.target.value })}
                    placeholder="Quote terms and conditions..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertToQuote}
                  disabled={!convertData.validUntil || actionLoading}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                >
                  Convert to Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
