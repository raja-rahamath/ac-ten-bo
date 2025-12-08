'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { CommentsSection } from '@/components/CommentsSection';

interface TimelineEntry {
  id: string;
  action: string;
  description?: string;
  createdAt: string;
  performer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

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
  startedAt?: string;
  completedAt?: string;
  customer?: { id: string; firstName: string; lastName: string; phone?: string; email?: string };
  property?: { id: string; name: string; address?: string };
  unit?: {
    id: string;
    unitNo: string;
    flatNumber?: string;
    building?: {
      id: string;
      name?: string;
      buildingNumber: string;
      roadNumber: string;
      blockNumber: string;
    };
  };
  complaintType?: { id: string; name: string };
  assignedTo?: { id: string; firstName: string; lastName: string };
  zone?: { id: string; name: string };
  timeline?: TimelineEntry[];
  asset?: Asset;
  attachments?: Attachment[];
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: { name: string };
  zoneAssignments?: { zone: { id: string; name: string }; role: string }[];
}

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  createdAt: string;
}

interface Asset {
  id: string;
  assetNo: string;
  name?: string;
  type?: { id: string; name: string };
  serialNumber?: string;
  brand?: string;
  model?: string;
}

interface AssetType {
  id: string;
  name: string;
  description?: string;
}

interface Room {
  id: string;
  name: string;
  unitId: string;
}

interface ActionTemplate {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
}

interface Estimate {
  id: string;
  estimateNo: string;
  title: string;
  version: number;
  status: string;
  total: string;
  createdAt: string;
  isLatestVersion: boolean;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface Invoice {
  id: string;
  invoiceNo: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount?: number;
  status: string;
  dueDate?: string;
  createdAt: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Assign Employee Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Asset linking state
  const [showLinkAssetModal, setShowLinkAssetModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [linkingAsset, setLinkingAsset] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Create Asset Modal state
  const [showCreateAssetModal, setShowCreateAssetModal] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    typeId: '',
    serialNumber: '',
    brand: '',
    model: '',
  });

  // Create Room Modal state
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '' });

  // Complete Request Modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedActionTemplate, setSelectedActionTemplate] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [actionTemplates, setActionTemplates] = useState<ActionTemplate[]>([]);
  const [loadingActionTemplates, setLoadingActionTemplates] = useState(false);

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmStyle: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Estimates state
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loadingEstimates, setLoadingEstimates] = useState(false);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  // Cancel Request Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchRequest();
    fetchEstimates();
    fetchInvoices();
    // Get user role from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Role can be either a string or an object with name property
        const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
        setUserRole(roleName || null);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
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

  async function fetchEstimates() {
    try {
      setLoadingEstimates(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/estimates?serviceRequestId=${params.id}&latestOnly=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success || data.data) {
        setEstimates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch estimates:', error);
    } finally {
      setLoadingEstimates(false);
    }
  }

  async function fetchInvoices() {
    try {
      setLoadingInvoices(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/invoices?serviceRequestId=${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success || data.data) {
        setInvoices(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function generateInvoice() {
    setGeneratingInvoice(true);
    setInvoiceError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/invoices/from-service-request/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate invoice');
      }

      // Refresh invoices list
      await fetchInvoices();
      // Navigate to the new invoice
      router.push(`/invoices/${data.data.id}`);
    } catch (error: any) {
      setInvoiceError(error.message);
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        // Refetch to get updated timeline
        await fetchRequest();
      } else {
        console.error('Failed to update status:', data.error);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function fetchEmployees() {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('accessToken');
      // Fetch employees, optionally filter by zone
      const zoneParam = request?.zone?.id ? `&zoneId=${request.zone.id}` : '';
      const response = await fetch(`http://localhost:4001/api/v1/employees?isActive=true&limit=100${zoneParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  }

  function openAssignModal() {
    setShowAssignModal(true);
    setSelectedEmployeeId('');
    setSearchQuery('');
    setAssignError('');
    fetchEmployees();
  }

  async function handleAssignEmployee() {
    if (!selectedEmployeeId) {
      setAssignError('Please select an employee');
      return;
    }

    setAssigning(true);
    setAssignError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId: selectedEmployeeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to assign employee');
      }

      // Refresh request data
      await fetchRequest();
      setShowAssignModal(false);
    } catch (error: any) {
      setAssignError(error.message);
    } finally {
      setAssigning(false);
    }
  }

  // Filter employees based on search query
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(query) ||
      emp.lastName.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.jobTitle?.name?.toLowerCase().includes(query)
    );
  });

  // File upload handler
  async function uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('accessToken');

      for (const file of Array.from(files)) {
        // Create FormData to send actual file
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}/attachments`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - browser will set it automatically with boundary for multipart/form-data
          },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to upload file');
        }
      }

      await fetchRequest();
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files) {
      await uploadFiles(files);
      event.target.value = '';
    }
  }

  // Drag and drop handlers
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  }

  // Delete attachment handler
  function handleDeleteAttachment(attachmentId: string, fileName: string) {
    setConfirmModalConfig({
      title: 'Delete Attachment',
      message: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmStyle: 'danger',
      onConfirm: async () => {
        setIsConfirming(true);
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(
            `http://localhost:4001/api/v1/service-requests/${params.id}/attachments/${attachmentId}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || 'Failed to delete attachment');
          }

          await fetchRequest();
          setShowConfirmModal(false);
          setConfirmModalConfig(null);
        } catch (error: any) {
          console.error('Failed to delete attachment:', error);
        } finally {
          setIsConfirming(false);
        }
      },
    });
    setShowConfirmModal(true);
  }

  // Fetch assets for linking
  async function fetchAssets() {
    setLoadingAssets(true);
    try {
      const token = localStorage.getItem('accessToken');
      const unitId = request?.unit?.id;
      const queryParams = unitId ? `?unitId=${unitId}` : '';
      const response = await fetch(`http://localhost:4001/api/v1/assets${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setAssets(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  }

  // Link asset handler
  async function handleLinkAsset() {
    if (!selectedAssetId) return;

    setLinkingAsset(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}/asset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assetId: selectedAssetId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to link asset');
      }

      await fetchRequest();
      setShowLinkAssetModal(false);
    } catch (error: any) {
      console.error('Failed to link asset:', error);
    } finally {
      setLinkingAsset(false);
    }
  }

  // Unlink asset handler
  function handleUnlinkAsset() {
    setConfirmModalConfig({
      title: 'Unlink Asset',
      message: `Are you sure you want to unlink "${request?.asset?.name || 'this asset'}" from this service request?`,
      confirmText: 'Unlink',
      confirmStyle: 'warning',
      onConfirm: async () => {
        setIsConfirming(true);
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}/asset`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || 'Failed to unlink asset');
          }

          await fetchRequest();
          setShowConfirmModal(false);
          setConfirmModalConfig(null);
        } catch (error: any) {
          console.error('Failed to unlink asset:', error);
        } finally {
          setIsConfirming(false);
        }
      },
    });
    setShowConfirmModal(true);
  }

  // Fetch asset types
  async function fetchAssetTypes() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/asset-types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setAssetTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch asset types:', error);
    }
  }

  // Create asset handler
  async function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!newAsset.name || !newAsset.typeId) return;

    setCreatingAsset(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newAsset,
          unitId: request?.unit?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create asset');
      }

      // Link the new asset to the service request
      const linkResponse = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}/asset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assetId: data.data.id }),
      });

      if (!linkResponse.ok) {
        console.error('Asset created but failed to link');
      }

      await fetchRequest();
      setShowCreateAssetModal(false);
      setNewAsset({ name: '', typeId: '', serialNumber: '', brand: '', model: '' });
    } catch (error: any) {
      console.error('Failed to create asset:', error);
    } finally {
      setCreatingAsset(false);
    }
  }

  // Create room handler
  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoom.name || !request?.unit?.id) return;

    setCreatingRoom(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoom.name,
          unitId: request.unit.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create room');
      }

      await fetchRequest();
      setShowCreateRoomModal(false);
      setNewRoom({ name: '' });
    } catch (error: any) {
      console.error('Failed to create room:', error);
    } finally {
      setCreatingRoom(false);
    }
  }

  // Open modals with data fetching
  function openLinkAssetModal() {
    setShowLinkAssetModal(true);
    setSelectedAssetId('');
    setAssetSearchQuery('');
    fetchAssets();
  }

  function openCreateAssetModal() {
    setShowCreateAssetModal(true);
    setNewAsset({ name: '', typeId: '', serialNumber: '', brand: '', model: '' });
    fetchAssetTypes();
  }

  // Fetch action templates from API
  async function fetchActionTemplates() {
    setLoadingActionTemplates(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/action-templates?isActive=true&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setActionTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch action templates:', error);
    } finally {
      setLoadingActionTemplates(false);
    }
  }

  function openCompleteModal() {
    setShowCompleteModal(true);
    setSelectedActionTemplate('');
    setCompletionNotes('');
    fetchActionTemplates();
  }

  function handleActionTemplateChange(templateId: string) {
    setSelectedActionTemplate(templateId);
    const template = actionTemplates.find(t => t.id === templateId);
    if (template && template.description) {
      setCompletionNotes(template.description);
    }
  }

  async function handleCompleteRequest() {
    if (!completionNotes.trim()) {
      return;
    }

    setCompleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          internalNotes: completionNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        setShowCompleteModal(false);
      } else {
        console.error('Failed to complete request:', data.error);
      }
    } catch (error) {
      console.error('Failed to complete request:', error);
    } finally {
      setCompleting(false);
    }
  }

  // Cancel request handler
  function openCancelModal() {
    setShowCancelModal(true);
    setCancellationReason('');
  }

  async function handleCancelRequest() {
    if (!cancellationReason.trim()) {
      return;
    }

    setCancelling(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancellationReason: cancellationReason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequest();
        setShowCancelModal(false);
      } else {
        console.error('Failed to cancel request:', data.error);
      }
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setCancelling(false);
    }
  }

  // Filter assets based on search query
  const filteredAssets = assets.filter((asset) => {
    if (!assetSearchQuery) return true;
    const query = assetSearchQuery.toLowerCase();
    return (
      asset.assetNo.toLowerCase().includes(query) ||
      asset.name?.toLowerCase().includes(query) ||
      asset.type?.name?.toLowerCase().includes(query) ||
      asset.brand?.toLowerCase().includes(query) ||
      asset.model?.toLowerCase().includes(query)
    );
  });

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on type
  function getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('pdf')) return '📄';
    return '📎';
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Get timeline dot color based on status for STATUS_CHANGED entries
  function getTimelineDotColor(action: string, description?: string) {
    if (action === 'STATUS_CHANGED' && description) {
      // Parse "Status changed from X to Y" to get the new status
      const match = description.match(/to\s+(\w+)/i);
      if (match) {
        const status = match[1].toUpperCase();
        const colors: Record<string, string> = {
          NEW: 'bg-blue-500',
          ASSIGNED: 'bg-yellow-500',
          IN_PROGRESS: 'bg-purple-500',
          COMPLETED: 'bg-green-500',
          CANCELLED: 'bg-red-500',
        };
        return colors[status] || 'bg-gray-500';
      }
    }
    // Default colors for other actions
    if (action === 'REQUEST_CREATED') return 'bg-blue-500';
    if (action === 'ASSIGNED' || action === 'AUTO_ASSIGNED') return 'bg-yellow-500';
    if (action === 'COMPLETED') return 'bg-green-500';
    return 'bg-gray-500';
  }

  // Extract status from timeline description and return badge
  function getStatusBadgeFromDescription(description?: string) {
    if (!description) return null;
    // Parse "Status changed from X to Y"
    const match = description.match(/from\s+(\w+)\s+to\s+(\w+)/i);
    if (match) {
      const toStatus = match[2].toUpperCase();
      return (
        <span className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(toStatus)}`}>
          {toStatus.replace('_', ' ')}
        </span>
      );
    }
    return null;
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      EMERGENCY: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  }

  // Format date as dd/mm/yyyy
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Format date and time as dd/mm/yyyy HH:mm
  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // Calculate duration between two dates
  function calculateDuration(startDate: string, endDate?: string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    // Ensure we're comparing in the same timezone
    const diffMs = Math.abs(end.getTime() - start.getTime());

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;

    if (days > 0) {
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (totalHours > 0) {
      return remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours}h`;
    }
    return `${totalMinutes}m`;
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
          {request.status === 'ASSIGNED' && userRole !== 'receptionist' && (
            <Button onClick={() => updateStatus('IN_PROGRESS')} disabled={isUpdating}>
              Start Work
            </Button>
          )}
          {request.status === 'IN_PROGRESS' && userRole !== 'receptionist' && (
            <Button onClick={openCompleteModal} disabled={isUpdating}>
              Complete
            </Button>
          )}
          {!['COMPLETED', 'CANCELLED'].includes(request.status) && (
            <Button variant="outline" onClick={openCancelModal} disabled={isUpdating}>
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
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <label className="text-sm text-gray-500">Created</label>
                  <p>{formatDateTime(request.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Duration</label>
                  <p className="font-medium">
                    {request.status === 'COMPLETED' && request.completedAt && request.startedAt
                      ? calculateDuration(request.startedAt, request.completedAt)
                      : request.status === 'IN_PROGRESS' && request.startedAt
                        ? `${calculateDuration(request.startedAt)} (ongoing)`
                        : '-'}
                  </p>
                </div>
                {request.startedAt && (
                  <div>
                    <label className="text-sm text-gray-500">Started</label>
                    <p>{formatDateTime(request.startedAt)}</p>
                  </div>
                )}
                {request.completedAt && (
                  <div>
                    <label className="text-sm text-gray-500">Completed</label>
                    <p>{formatDateTime(request.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Details - Attachments & Asset */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Service Details</h2>

            {/* Attachments Section */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Attachments</h3>

              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                  isDragging
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="text-primary font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Photos, videos, PDF, DOC (max 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm">
                  {uploadError}
                </div>
              )}

              {request.attachments && request.attachments.length > 0 ? (
                <div className="space-y-2">
                  {request.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{getFileIcon(attachment.fileType)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{attachment.fileName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {/* View button - for images and PDFs */}
                        {(attachment.fileType.startsWith('image/') || attachment.fileType.includes('pdf')) && (
                          <a
                            href={`http://localhost:4001${attachment.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-sky-500 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                        )}
                        {/* Download button */}
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`http://localhost:4001${attachment.filePath}`);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = attachment.fileName;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('Failed to download file:', error);
                            }
                          }}
                          className="text-gray-400 hover:text-green-500 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteAttachment(attachment.id, attachment.fileName)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">No files uploaded yet</p>
              )}
            </div>

            {/* Linked Asset Section */}
            <div className="mb-6 pt-4 border-t dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Linked Asset</h3>
                {!request.asset && (
                  <div className="flex gap-2">
                    <button
                      onClick={openLinkAssetModal}
                      className="text-sm text-primary hover:underline"
                    >
                      Link Existing
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={openCreateAssetModal}
                      className="text-sm text-primary hover:underline"
                    >
                      Create New
                    </button>
                  </div>
                )}
              </div>

              {request.asset ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{request.asset.name || request.asset.assetNo}</p>
                      {request.asset.type && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{request.asset.type.name}</p>
                      )}
                      {(request.asset.brand || request.asset.model) && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {[request.asset.brand, request.asset.model].filter(Boolean).join(' - ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/assets/${request.asset.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={handleUnlinkAsset}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No asset linked to this service request.</p>
              )}
            </div>

            {/* Quick Actions */}
            {request.unit && (
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowCreateRoomModal(true)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    + Add Room
                  </button>
                  <button
                    onClick={openCreateAssetModal}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    + Add Asset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Estimates Section */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estimates</h2>
              <Link
                href={`/estimates/new?serviceRequestId=${params.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Estimate
              </Link>
            </div>

            {loadingEstimates ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                Loading estimates...
              </div>
            ) : estimates.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No estimates created yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Create an estimate to start the quotation process
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {estimates.map((estimate) => (
                  <Link
                    key={estimate.id}
                    href={`/estimates/${estimate.id}`}
                    className="block p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {estimate.estimateNo}
                          </span>
                          {estimate.version > 1 && (
                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                              V{estimate.version}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            estimate.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                            estimate.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            estimate.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            estimate.status === 'PENDING_MANAGER_APPROVAL' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            estimate.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {estimate.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {estimate.title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(estimate.createdAt)}
                          {estimate.createdBy && ` by ${estimate.createdBy.firstName} ${estimate.createdBy.lastName}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('en-BH', {
                            style: 'currency',
                            currency: 'BHD',
                            minimumFractionDigits: 3,
                          }).format(parseFloat(estimate.total) || 0)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Invoices Section */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoices</h2>
              {request.status === 'COMPLETED' && invoices.length === 0 && (
                <button
                  onClick={generateInvoice}
                  disabled={generatingInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {generatingInvoice ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Invoice
                    </>
                  )}
                </button>
              )}
            </div>

            {invoiceError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {invoiceError}
              </div>
            )}

            {loadingInvoices ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                Loading invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No invoices generated yet</p>
                {request.status === 'COMPLETED' ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Click "Generate Invoice" to create an invoice for this completed request
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Complete the service request to generate an invoice
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="block p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {invoice.invoiceNo}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                            invoice.status === 'SENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            invoice.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            invoice.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDate(invoice.createdAt)}
                          {invoice.dueDate && ` • Due: ${formatDate(invoice.dueDate)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('en-BH', {
                            style: 'currency',
                            currency: 'BHD',
                            minimumFractionDigits: 3,
                          }).format(invoice.total || 0)}
                        </p>
                        {invoice.paidAmount && invoice.paidAmount > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Paid: {new Intl.NumberFormat('en-BH', {
                              style: 'currency',
                              currency: 'BHD',
                              minimumFractionDigits: 3,
                            }).format(invoice.paidAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Comments & Activity */}
          <CommentsSection serviceRequestId={params.id as string} />
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
            {request.unit ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {request.unit.flatNumber
                    ? `Flat ${request.unit.flatNumber}, Building ${request.unit.building?.buildingNumber}`
                    : `Building ${request.unit.building?.buildingNumber}`}
                </p>
                {request.unit.building && (
                  <p className="text-sm text-gray-500">
                    Road {request.unit.building.roadNumber}, Block {request.unit.building.blockNumber}
                  </p>
                )}
                {request.unit.building?.name && (
                  <p className="text-sm text-gray-400">{request.unit.building.name}</p>
                )}
              </div>
            ) : request.property ? (
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
            {request.assignedTo ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {request.assignedTo.firstName} {request.assignedTo.lastName}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Link href={`/employees/${request.assignedTo.id}`} className="text-sm text-primary hover:underline">
                    View Profile
                  </Link>
                  <Button size="sm" variant="outline" onClick={openAssignModal}>
                    Reassign
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-gray-500">Not assigned yet</p>
                <Button size="sm" variant="outline" onClick={openAssignModal}>
                  Assign Employee
                </Button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
            <div className="space-y-3">
              {request.timeline && request.timeline.length > 0 ? (
                request.timeline.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-2.5 w-2.5 rounded-full ${getTimelineDotColor(entry.action, entry.description)}`}></div>
                      {index < request.timeline!.length - 1 && (
                        <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-600 min-h-[16px]"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-2 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.action.replace(/_/g, ' ')}
                        </p>
                        {entry.action === 'STATUS_CHANGED' && getStatusBadgeFromDescription(entry.description)}
                      </div>
                      {entry.description && entry.action !== 'STATUS_CHANGED' && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{entry.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(entry.createdAt)}
                        </p>
                        {entry.performer && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            • {entry.performer.firstName} {entry.performer.lastName}
                          </span>
                        )}
                        {!entry.performer && entry.action === 'AUTO_ASSIGNED' && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">• System</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Request Created</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(request.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Employee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Assign Employee</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {request.zone ? `Zone: ${request.zone.name}` : 'Select an employee to assign'}
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {assignError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {assignError}
              </div>
            )}

            {/* Search Box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading employees...</div>
                </div>
              ) : employees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No employees available</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <p>No employees match your search</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedEmployeeId === emp.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="employee"
                        value={emp.id}
                        checked={selectedEmployeeId === emp.id}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{emp.email}</p>
                        {emp.jobTitle && (
                          <p className="text-xs text-gray-400">{emp.jobTitle.name}</p>
                        )}
                        {emp.zoneAssignments && emp.zoneAssignments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {emp.zoneAssignments.map((za) => (
                              <span
                                key={za.zone.id}
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  za.zone.id === request.zone?.id
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {za.zone.name}
                                {za.role === 'PRIMARY_HEAD' && ' (Head)'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAssignEmployee}
                disabled={!selectedEmployeeId || assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Employee'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link Asset Modal */}
      {showLinkAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Link Asset</h2>
              <button
                onClick={() => setShowLinkAssetModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search assets..."
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingAssets ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">Loading assets...</div>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No assets found</p>
                  <button
                    onClick={() => {
                      setShowLinkAssetModal(false);
                      openCreateAssetModal();
                    }}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Create a new asset
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAssets.map((asset) => (
                    <label
                      key={asset.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAssetId === asset.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="asset"
                        value={asset.id}
                        checked={selectedAssetId === asset.id}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {asset.name || asset.assetNo}
                        </p>
                        {asset.type && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{asset.type.name}</p>
                        )}
                        {(asset.brand || asset.model) && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {[asset.brand, asset.model].filter(Boolean).join(' - ')}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowLinkAssetModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleLinkAsset}
                disabled={!selectedAssetId || linkingAsset}
              >
                {linkingAsset ? 'Linking...' : 'Link Asset'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Asset Modal */}
      {showCreateAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Asset</h2>
              <button
                onClick={() => setShowCreateAssetModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAsset}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., AC Unit, Water Heater"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asset Type *
                  </label>
                  <select
                    required
                    value={newAsset.typeId}
                    onChange={(e) => setNewAsset({ ...newAsset, typeId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select Type</option>
                    {assetTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="e.g., LG, Samsung"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Model
                    </label>
                    <input
                      type="text"
                      value={newAsset.model}
                      onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="e.g., XYZ-123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateAssetModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!newAsset.name || !newAsset.typeId || creatingAsset}
                >
                  {creatingAsset ? 'Creating...' : 'Create & Link Asset'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Room</h2>
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Living Room, Kitchen, Bedroom 1"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateRoomModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!newRoom.name || creatingRoom}
                >
                  {creatingRoom ? 'Creating...' : 'Add Room'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Request Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Complete Service Request</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Describe the action taken to resolve this request
                </p>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action Template
                </label>
                <select
                  value={selectedActionTemplate}
                  onChange={(e) => handleActionTemplateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={loadingActionTemplates}
                >
                  {loadingActionTemplates ? (
                    <option value="">Loading templates...</option>
                  ) : (
                    <>
                      <option value="">Select an action template...</option>
                      {actionTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action Description *
                </label>
                <textarea
                  required
                  rows={5}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  placeholder="Describe the action taken to resolve this service request..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can edit the auto-populated description or write your own
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCompleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCompleteRequest}
                disabled={!completionNotes.trim() || completing}
              >
                {completing ? 'Completing...' : 'Complete Request'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmModalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${
                confirmModalConfig.confirmStyle === 'danger'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : 'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    confirmModalConfig.confirmStyle === 'danger'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {confirmModalConfig.title}
                </h2>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {confirmModalConfig.message}
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmModalConfig(null);
                }}
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className={`flex-1 ${
                  confirmModalConfig.confirmStyle === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
                onClick={confirmModalConfig.onConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? 'Processing...' : confirmModalConfig.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Cancel Service Request
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to cancel this service request? Please provide a reason for the cancellation.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cancellation Reason *
              </label>
              <textarea
                required
                rows={4}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                placeholder="Please explain why this request is being cancelled..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Go Back
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelRequest}
                disabled={!cancellationReason.trim() || cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
