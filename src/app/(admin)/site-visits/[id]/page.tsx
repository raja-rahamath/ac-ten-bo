'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface Material {
  id: string;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  inventoryItem?: {
    itemNo: string;
    name: string;
  };
}

interface SiteVisit {
  id: string;
  visitNo: string;
  status: string;
  scheduledDate: string;
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  actualWorkMinutes?: number;
  notes?: string;
  completionNotes?: string;
  incompleteReason?: string;
  partsNeeded?: string;
  customerSignature?: string;
  technicianSignature?: string;
  createdAt: string;
  serviceRequest?: {
    id: string;
    requestNo: string;
    title: string;
    description?: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
    };
    property?: {
      id: string;
      name: string;
      address?: string;
    };
  };
  technician?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  materials?: Material[];
}

export default function SiteVisitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [visit, setVisit] = useState<SiteVisit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Awaiting Parts Modal
  const [showAwaitingPartsModal, setShowAwaitingPartsModal] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState('');
  const [partsNeeded, setPartsNeeded] = useState('');

  // Complete Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [actualWorkMinutes, setActualWorkMinutes] = useState(0);

  // Add Material Modal
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialData, setMaterialData] = useState({
    itemName: '',
    itemDescription: '',
    quantity: 1,
    unitPrice: 0,
  });

  useEffect(() => {
    fetchVisit();
  }, [params.id]);

  async function fetchVisit() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/site-visits/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setVisit(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch visit:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function startVisit() {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/site-visits/${params.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        await fetchVisit();
      }
    } catch (error) {
      console.error('Failed to start visit:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function markAwaitingParts() {
    if (!incompleteReason.trim() || !partsNeeded.trim()) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/site-visits/${params.id}/awaiting-parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incompleteReason,
          partsNeeded,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setShowAwaitingPartsModal(false);
        setIncompleteReason('');
        setPartsNeeded('');
        await fetchVisit();
      }
    } catch (error) {
      console.error('Failed to mark awaiting parts:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function resumeVisit() {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/site-visits/${params.id}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        await fetchVisit();
      }
    } catch (error) {
      console.error('Failed to resume visit:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function completeVisit() {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/site-visits/${params.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completionNotes,
          actualWorkMinutes: actualWorkMinutes > 0 ? actualWorkMinutes : undefined,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setShowCompleteModal(false);
        setCompletionNotes('');
        setActualWorkMinutes(0);
        await fetchVisit();
      }
    } catch (error) {
      console.error('Failed to complete visit:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function addMaterial() {
    if (!materialData.itemName.trim() || materialData.quantity < 1 || materialData.unitPrice <= 0) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/site-visits/${params.id}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(materialData),
      });
      const data = await response.json();

      if (data.success) {
        setShowAddMaterialModal(false);
        setMaterialData({
          itemName: '',
          itemDescription: '',
          quantity: 1,
          unitPrice: 0,
        });
        await fetchVisit();
      }
    } catch (error) {
      console.error('Failed to add material:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function removeMaterial(materialId: string) {
    if (!confirm('Are you sure you want to remove this material?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_URL}/site-visits/materials/${materialId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchVisit();
    } catch (error) {
      console.error('Failed to remove material:', error);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      AWAITING_PARTS: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      minimumFractionDigits: 3,
    }).format(amount);
  }

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  if (!visit) {
    return <div className="flex h-64 items-center justify-center">Site visit not found</div>;
  }

  const totalMaterialsCost = visit.materials?.reduce((sum, m) => sum + m.total, 0) || 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">{visit.visitNo}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(visit.status)}`}>
            {visit.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-2">
          {visit.status === 'SCHEDULED' && (
            <Button onClick={startVisit} disabled={isUpdating}>
              Start Visit
            </Button>
          )}
          {visit.status === 'IN_PROGRESS' && (
            <>
              <Button onClick={() => setShowCompleteModal(true)} disabled={isUpdating}>
                Complete
              </Button>
              <Button variant="outline" onClick={() => setShowAwaitingPartsModal(true)} disabled={isUpdating}>
                Awaiting Parts
              </Button>
            </>
          )}
          {visit.status === 'AWAITING_PARTS' && (
            <Button onClick={resumeVisit} disabled={isUpdating}>
              Resume Visit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Details */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Visit Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Scheduled Date</label>
                <p className="font-medium">{formatDate(visit.scheduledDate)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Scheduled Time</label>
                <p className="font-medium">{visit.scheduledTime || '-'}</p>
              </div>
              {visit.startedAt && (
                <div>
                  <label className="text-sm text-gray-500">Started At</label>
                  <p className="font-medium">{formatDateTime(visit.startedAt)}</p>
                </div>
              )}
              {visit.completedAt && (
                <div>
                  <label className="text-sm text-gray-500">Completed At</label>
                  <p className="font-medium">{formatDateTime(visit.completedAt)}</p>
                </div>
              )}
              {visit.actualWorkMinutes && (
                <div>
                  <label className="text-sm text-gray-500">Actual Work Time</label>
                  <p className="font-medium">{formatDuration(visit.actualWorkMinutes)}</p>
                </div>
              )}
            </div>

            {visit.notes && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm text-gray-500">Notes</label>
                <p className="whitespace-pre-wrap">{visit.notes}</p>
              </div>
            )}

            {visit.completionNotes && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm text-gray-500">Completion Notes</label>
                <p className="whitespace-pre-wrap">{visit.completionNotes}</p>
              </div>
            )}

            {visit.status === 'AWAITING_PARTS' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Awaiting Parts</h4>
                {visit.incompleteReason && (
                  <div className="mb-2">
                    <label className="text-xs text-yellow-700">Reason:</label>
                    <p className="text-sm text-yellow-800">{visit.incompleteReason}</p>
                  </div>
                )}
                {visit.partsNeeded && (
                  <div>
                    <label className="text-xs text-yellow-700">Parts Needed:</label>
                    <p className="text-sm text-yellow-800">{visit.partsNeeded}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Materials Used */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Materials Used</h2>
              {['IN_PROGRESS', 'AWAITING_PARTS'].includes(visit.status) && (
                <Button size="sm" onClick={() => setShowAddMaterialModal(true)}>
                  + Add Material
                </Button>
              )}
            </div>

            {visit.materials && visit.materials.length > 0 ? (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="pb-3 font-medium">Item</th>
                      <th className="pb-3 font-medium text-right">Qty</th>
                      <th className="pb-3 font-medium text-right">Unit Price</th>
                      <th className="pb-3 font-medium text-right">Total</th>
                      {['IN_PROGRESS', 'AWAITING_PARTS'].includes(visit.status) && (
                        <th className="pb-3 font-medium"></th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visit.materials.map((material) => (
                      <tr key={material.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div className="font-medium">{material.itemName}</div>
                          {material.itemDescription && (
                            <div className="text-xs text-gray-500">{material.itemDescription}</div>
                          )}
                          {material.inventoryItem && (
                            <div className="text-xs text-gray-400">SKU: {material.inventoryItem.itemNo}</div>
                          )}
                        </td>
                        <td className="py-3 text-right">{material.quantity}</td>
                        <td className="py-3 text-right">{formatCurrency(material.unitPrice)}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(material.total)}</td>
                        {['IN_PROGRESS', 'AWAITING_PARTS'].includes(visit.status) && (
                          <td className="py-3 text-right">
                            <button
                              onClick={() => removeMaterial(material.id)}
                              className="text-red-500 hover:underline text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Materials Cost</span>
                  <span className="text-xl font-bold">{formatCurrency(totalMaterialsCost)}</span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No materials added yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Service Request */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Service Request</h3>
            {visit.serviceRequest ? (
              <div className="space-y-2">
                <Link
                  href={`/requests/${visit.serviceRequest.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {visit.serviceRequest.requestNo}
                </Link>
                <p className="text-sm text-gray-600">{visit.serviceRequest.title}</p>
                {visit.serviceRequest.description && (
                  <p className="text-xs text-gray-500">{visit.serviceRequest.description}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No service request</p>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Customer</h3>
            {visit.serviceRequest?.customer ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {visit.serviceRequest.customer.firstName} {visit.serviceRequest.customer.lastName}
                </p>
                {visit.serviceRequest.customer.phone && (
                  <p className="text-sm text-gray-500">{visit.serviceRequest.customer.phone}</p>
                )}
                {visit.serviceRequest.customer.email && (
                  <p className="text-sm text-gray-500">{visit.serviceRequest.customer.email}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No customer info</p>
            )}
          </div>

          {/* Technician */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Technician</h3>
            {visit.technician ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {visit.technician.firstName} {visit.technician.lastName}
                </p>
                {visit.technician.phone && (
                  <p className="text-sm text-gray-500">{visit.technician.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Not assigned</p>
            )}
          </div>

          {/* Property */}
          {visit.serviceRequest?.property && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">Location</h3>
              <div className="space-y-2">
                <p className="font-medium">{visit.serviceRequest.property.name}</p>
                {visit.serviceRequest.property.address && (
                  <p className="text-sm text-gray-500">{visit.serviceRequest.property.address}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Awaiting Parts Modal */}
      {showAwaitingPartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Mark as Awaiting Parts</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">Reason *</label>
                <textarea
                  value={incompleteReason}
                  onChange={(e) => setIncompleteReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Why is the job incomplete?"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Parts Needed *</label>
                <textarea
                  value={partsNeeded}
                  onChange={(e) => setPartsNeeded(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="List the parts/materials needed"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAwaitingPartsModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={markAwaitingParts}
                disabled={isUpdating || !incompleteReason.trim() || !partsNeeded.trim()}
              >
                {isUpdating ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Complete Visit</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">Completion Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Describe the work done..."
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Actual Work Time (minutes)</label>
                <input
                  type="number"
                  value={actualWorkMinutes || ''}
                  onChange={(e) => setActualWorkMinutes(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 90"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowCompleteModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={completeVisit} disabled={isUpdating}>
                {isUpdating ? 'Completing...' : 'Complete Visit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Add Material</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-medium">Item Name *</label>
                <input
                  type="text"
                  value={materialData.itemName}
                  onChange={(e) => setMaterialData({ ...materialData, itemName: e.target.value })}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Filter, Pipe Fitting"
                />
              </div>

              <div>
                <label className="mb-2 block font-medium">Description</label>
                <input
                  type="text"
                  value={materialData.itemDescription}
                  onChange={(e) => setMaterialData({ ...materialData, itemDescription: e.target.value })}
                  className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-medium">Quantity *</label>
                  <input
                    type="number"
                    value={materialData.quantity}
                    onChange={(e) => setMaterialData({ ...materialData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    min="1"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-medium">Unit Price (BHD) *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={materialData.unitPrice || ''}
                    onChange={(e) => setMaterialData({ ...materialData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    min="0"
                  />
                </div>
              </div>

              {materialData.quantity > 0 && materialData.unitPrice > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold">{formatCurrency(materialData.quantity * materialData.unitPrice)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddMaterialModal(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={addMaterial}
                disabled={isUpdating || !materialData.itemName.trim() || materialData.quantity < 1 || materialData.unitPrice <= 0}
              >
                {isUpdating ? 'Adding...' : 'Add Material'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
