'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ServiceRequest {
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
  };
  zone?: { name: string };
}

interface LaborRateType {
  id: string;
  code: string;
  name: string;
  hourlyRate: string;
  dailyRate: string;
}

interface InventoryItem {
  id: string;
  itemNo: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  unit: string;
  unitPrice: number;
  category?: { id: string; name: string };
}

interface InventoryCategory {
  id: string;
  name: string;
}

interface MaterialItem {
  id: string;
  inventoryItemId?: string;
  itemType: string;
  name: string;
  description: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  markupType: string;
  markupValue: number;
  notes: string;
}

interface LaborItem {
  id: string;
  description: string;
  rateType: 'HOURLY' | 'DAILY';
  laborRateTypeId: string;
  quantity: number;
  hours: number;
  days: number;
  hourlyRate: number;
  dailyRate: number;
  markupType: string;
  markupValue: number;
  notes: string;
}

const itemTypes = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Other' },
];

const units = ['pcs', 'kg', 'ltr', 'm', 'sqm', 'sqft', 'set', 'box', 'roll', 'bag'];

const defaultMaterialItem: MaterialItem = {
  id: '',
  itemType: 'MATERIAL',
  name: '',
  description: '',
  sku: '',
  quantity: 1,
  unit: 'pcs',
  unitCost: 0,
  markupType: '',
  markupValue: 0,
  notes: '',
};

const defaultLaborItem: LaborItem = {
  id: '',
  description: '',
  rateType: 'HOURLY',
  laborRateTypeId: '',
  quantity: 1,
  hours: 1,
  days: 1,
  hourlyRate: 0,
  dailyRate: 0,
  markupType: '',
  markupValue: 0,
  notes: '',
};

export default function NewEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceRequestIdParam = searchParams.get('serviceRequestId');

  const [loading, setLoading] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [laborRateTypes, setLaborRateTypes] = useState<LaborRateType[]>([]);
  const [searchingServiceRequest, setSearchingServiceRequest] = useState(false);
  const [serviceRequestSearch, setServiceRequestSearch] = useState('');
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null);
  const [scopeFromNote, setScopeFromNote] = useState(false);

  // Inventory item states
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);
  const [itemSearchText, setItemSearchText] = useState<{ [key: string]: string }>({});
  const [showItemDropdown, setShowItemDropdown] = useState<string | null>(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [activeItemRowId, setActiveItemRowId] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    nameAr: '',
    categoryId: '',
    unit: 'pcs',
    unitPrice: 0,
  });
  const [savingNewItem, setSavingNewItem] = useState(false);

  // Target total for rounding/discount calculation
  const [targetTotal, setTargetTotal] = useState<string>('');

  const [formData, setFormData] = useState({
    serviceRequestId: '',
    title: '',
    description: '',
    scope: '',
    transportCost: 0,
    profitMarginType: 'PERCENTAGE',
    profitMarginValue: 10,
    vatRate: 10,
    discountType: '',
    discountValue: 0,
    discountReason: '',
    estimatedDuration: '',
    estimatedStartDate: '',
    estimatedEndDate: '',
    internalNotes: '',
    assumptions: '',
    exclusions: '',
  });

  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    { ...defaultMaterialItem, id: crypto.randomUUID() },
  ]);

  const [laborItems, setLaborItems] = useState<LaborItem[]>([
    { ...defaultLaborItem, id: crypto.randomUUID() },
  ]);

  // Fetch labor rate types and inventory items on mount
  useEffect(() => {
    fetchLaborRateTypes();
    fetchInventoryItems();
    fetchInventoryCategories();
    if (serviceRequestIdParam) {
      fetchServiceRequestById(serviceRequestIdParam);
    }
  }, [serviceRequestIdParam]);

  // Search service requests
  useEffect(() => {
    if (serviceRequestSearch.length > 2) {
      searchServiceRequests(serviceRequestSearch);
    }
  }, [serviceRequestSearch]);

  const fetchLaborRateTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/labor-rate-types?isActive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLaborRateTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch labor rate types:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/inventory-items?isActive=true&limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    }
  };

  const fetchInventoryCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/inventory-categories?isActive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory categories:', error);
    }
  };

  const handleSelectInventoryItem = (materialItemId: string, inventoryItem: InventoryItem) => {
    setMaterialItems(
      materialItems.map((item) =>
        item.id === materialItemId
          ? {
              ...item,
              inventoryItemId: inventoryItem.id,
              name: inventoryItem.name,
              unit: inventoryItem.unit,
              unitCost: Number(inventoryItem.unitPrice),
            }
          : item
      )
    );
    setShowItemDropdown(null);
    setItemSearchText({ ...itemSearchText, [materialItemId]: '' });
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim() || !newItemForm.categoryId) {
      alert('Please fill in required fields');
      return;
    }

    setSavingNewItem(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/inventory-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newItemForm,
          currentStock: 0,
          minStock: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newItem = data.data;
        // Add to inventory items list
        setInventoryItems([...inventoryItems, newItem]);
        // Auto-select the new item for the active row
        if (activeItemRowId) {
          handleSelectInventoryItem(activeItemRowId, newItem);
        }
        // Reset form and close modal
        setShowNewItemModal(false);
        setNewItemForm({ name: '', nameAr: '', categoryId: '', unit: 'pcs', unitPrice: 0 });
        setActiveItemRowId(null);
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Failed to create item');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Failed to create item');
    } finally {
      setSavingNewItem(false);
    }
  };

  const getFilteredInventoryItems = (searchText: string) => {
    if (!searchText) return inventoryItems.slice(0, 10);
    const search = searchText.toLowerCase();
    return inventoryItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(search) ||
          item.itemNo.toLowerCase().includes(search) ||
          (item.nameAr && item.nameAr.includes(searchText))
      )
      .slice(0, 10);
  };

  const fetchServiceRequestById = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/service-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        const serviceRequest = result.data;
        setSelectedServiceRequest(serviceRequest);
        setFormData((prev) => ({
          ...prev,
          serviceRequestId: serviceRequest.id,
          title: serviceRequest.title || '',
        }));
        // Fetch and populate Scope of Work from notes
        fetchScopeOfWorkNote(id, token);
      }
    } catch (error) {
      console.error('Failed to fetch service request:', error);
    }
  };

  const fetchScopeOfWorkNote = async (serviceRequestId: string, token: string | null) => {
    try {
      setScopeFromNote(false);
      const response = await fetch(
        `http://localhost:4001/api/v1/comments?serviceRequestId=${serviceRequestId}&commentType=SCOPE_OF_WORK&sortOrder=desc`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const result = await response.json();
        const comments = result.data || [];
        // Get the most recent SCOPE_OF_WORK note
        if (comments.length > 0) {
          const latestScopeNote = comments[0]; // API returns newest first
          setFormData((prev) => ({
            ...prev,
            scope: latestScopeNote.content || '',
          }));
          setScopeFromNote(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch scope of work note:', error);
    }
  };

  const searchServiceRequests = async (search: string) => {
    try {
      setSearchingServiceRequest(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:4001/api/v1/service-requests?search=${encodeURIComponent(search)}&limit=10&status=PENDING,IN_PROGRESS,SCHEDULED`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setServiceRequests(data.data || []);
      }
    } catch (error) {
      console.error('Failed to search service requests:', error);
    } finally {
      setSearchingServiceRequest(false);
    }
  };

  const getCustomerName = (customer: ServiceRequest['customer']) => {
    if (!customer) return 'N/A';
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  };

  // Calculate material item totals
  const calculateMaterialItemTotals = (item: MaterialItem) => {
    const totalCost = item.quantity * item.unitCost;
    let markupAmount = 0;
    if (item.markupType === 'PERCENTAGE' && item.markupValue > 0) {
      markupAmount = totalCost * (item.markupValue / 100);
    } else if (item.markupType === 'FIXED' && item.markupValue > 0) {
      markupAmount = item.markupValue;
    }
    return { totalCost, markupAmount, totalPrice: totalCost + markupAmount };
  };

  // Calculate labor item totals
  const calculateLaborItemTotals = (item: LaborItem) => {
    let totalCost: number;
    if (item.rateType === 'DAILY') {
      totalCost = item.quantity * item.days * item.dailyRate;
    } else {
      totalCost = item.quantity * item.hours * item.hourlyRate;
    }

    let markupAmount = 0;
    if (item.markupType === 'PERCENTAGE' && item.markupValue > 0) {
      markupAmount = totalCost * (item.markupValue / 100);
    } else if (item.markupType === 'FIXED' && item.markupValue > 0) {
      markupAmount = item.markupValue;
    }
    return { totalCost, markupAmount, totalPrice: totalCost + markupAmount };
  };

  // Calculate overall totals
  const calculateTotals = () => {
    const materialTotal = materialItems.reduce((sum, item) => {
      const { totalPrice } = calculateMaterialItemTotals(item);
      return sum + totalPrice;
    }, 0);

    const laborTotal = laborItems.reduce((sum, item) => {
      const { totalPrice } = calculateLaborItemTotals(item);
      return sum + totalPrice;
    }, 0);

    const subtotal = materialTotal + laborTotal + formData.transportCost;

    let profitAmount = 0;
    if (formData.profitMarginType === 'PERCENTAGE' && formData.profitMarginValue > 0) {
      profitAmount = subtotal * (formData.profitMarginValue / 100);
    } else if (formData.profitMarginType === 'FIXED' && formData.profitMarginValue > 0) {
      profitAmount = formData.profitMarginValue;
    }

    let discountAmount = 0;
    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 0) {
      discountAmount = (subtotal + profitAmount) * (formData.discountValue / 100);
    } else if (formData.discountType === 'FIXED' && formData.discountValue > 0) {
      discountAmount = formData.discountValue;
    }

    const totalBeforeVat = subtotal + profitAmount - discountAmount;
    const vatAmount = totalBeforeVat * (formData.vatRate / 100);
    const total = totalBeforeVat + vatAmount;

    return {
      materialTotal,
      laborTotal,
      subtotal,
      profitAmount,
      discountAmount,
      totalBeforeVat,
      vatAmount,
      total,
    };
  };

  // Calculate discount from target total
  const calculateDiscountFromTarget = () => {
    const target = parseFloat(targetTotal);
    if (!target || target <= 0) return;

    // Get current values without discount
    const materialTotal = materialItems.reduce((sum, item) => {
      const { totalPrice } = calculateMaterialItemTotals(item);
      return sum + totalPrice;
    }, 0);

    const laborTotal = laborItems.reduce((sum, item) => {
      const { totalPrice } = calculateLaborItemTotals(item);
      return sum + totalPrice;
    }, 0);

    const subtotal = materialTotal + laborTotal + formData.transportCost;

    let profitAmount = 0;
    if (formData.profitMarginType === 'PERCENTAGE' && formData.profitMarginValue > 0) {
      profitAmount = subtotal * (formData.profitMarginValue / 100);
    } else if (formData.profitMarginType === 'FIXED' && formData.profitMarginValue > 0) {
      profitAmount = formData.profitMarginValue;
    }

    const amountBeforeDiscount = subtotal + profitAmount;

    // Calculate what totalBeforeVat needs to be to get target total
    // target = totalBeforeVat * (1 + vatRate/100)
    // totalBeforeVat = target / (1 + vatRate/100)
    const targetTotalBeforeVat = target / (1 + formData.vatRate / 100);

    // discountAmount = amountBeforeDiscount - targetTotalBeforeVat
    const requiredDiscountAmount = amountBeforeDiscount - targetTotalBeforeVat;

    if (requiredDiscountAmount <= 0) {
      // Target is higher than current total - no discount needed
      setFormData({ ...formData, discountType: '', discountValue: 0 });
      return;
    }

    // Use FIXED amount discount for exact target total
    setFormData({
      ...formData,
      discountType: 'FIXED',
      discountValue: Math.round(requiredDiscountAmount * 1000) / 1000, // Round to 3 decimal places
    });

    // Clear target input after applying
    setTargetTotal('');
  };

  // Material item handlers
  const addMaterialItem = () => {
    setMaterialItems([...materialItems, { ...defaultMaterialItem, id: crypto.randomUUID() }]);
  };

  const removeMaterialItem = (id: string) => {
    if (materialItems.length > 1) {
      setMaterialItems(materialItems.filter((item) => item.id !== id));
    }
  };

  const updateMaterialItem = (id: string, field: keyof MaterialItem, value: any) => {
    setMaterialItems(
      materialItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Labor item handlers
  const addLaborItem = () => {
    setLaborItems([...laborItems, { ...defaultLaborItem, id: crypto.randomUUID() }]);
  };

  const removeLaborItem = (id: string) => {
    if (laborItems.length > 1) {
      setLaborItems(laborItems.filter((item) => item.id !== id));
    }
  };

  const updateLaborItem = (id: string, field: keyof LaborItem, value: any) => {
    setLaborItems(
      laborItems.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // If labor rate type changed, update rates
        if (field === 'laborRateTypeId' && value) {
          const rateType = laborRateTypes.find((rt) => rt.id === value);
          if (rateType) {
            updated.hourlyRate = parseFloat(rateType.hourlyRate) || 0;
            updated.dailyRate = parseFloat(rateType.dailyRate) || 0;
          }
        }
        return updated;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serviceRequestId) {
      alert('Please select a service request');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    // Validate material items
    const validMaterialItems = materialItems.filter((item) => item.name.trim());
    if (validMaterialItems.some((item) => item.unitCost <= 0)) {
      alert('Please enter valid unit costs for all material items');
      return;
    }

    // Validate labor items
    const validLaborItems = laborItems.filter((item) => item.description.trim());

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const payload = {
        serviceRequestId: formData.serviceRequestId,
        title: formData.title,
        description: formData.description || undefined,
        scope: formData.scope || undefined,
        transportCost: formData.transportCost,
        profitMarginType: formData.profitMarginType || undefined,
        profitMarginValue: formData.profitMarginValue,
        vatRate: formData.vatRate,
        discountType: formData.discountType || undefined,
        discountValue: formData.discountValue,
        discountReason: formData.discountReason || undefined,
        estimatedDuration: formData.estimatedDuration || undefined,
        estimatedStartDate: formData.estimatedStartDate || undefined,
        estimatedEndDate: formData.estimatedEndDate || undefined,
        internalNotes: formData.internalNotes || undefined,
        assumptions: formData.assumptions || undefined,
        exclusions: formData.exclusions || undefined,
        items: validMaterialItems.map((item) => ({
          itemType: item.itemType,
          name: item.name,
          description: item.description || undefined,
          sku: item.sku || undefined,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          markupType: item.markupType || undefined,
          markupValue: item.markupValue,
          notes: item.notes || undefined,
        })),
        laborItems: validLaborItems.map((item) => ({
          description: item.description,
          rateType: item.rateType,
          laborRateTypeId: item.laborRateTypeId || undefined,
          quantity: item.quantity,
          hours: item.rateType === 'HOURLY' ? item.hours : undefined,
          days: item.rateType === 'DAILY' ? item.days : undefined,
          hourlyRate: item.hourlyRate,
          dailyRate: item.dailyRate,
          markupType: item.markupType || undefined,
          markupValue: item.markupValue,
          notes: item.notes || undefined,
        })),
      };

      const response = await fetch('http://localhost:4001/api/v1/estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/estimates/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Failed to create estimate');
      }
    } catch (error) {
      console.error('Failed to create estimate:', error);
      alert('Failed to create estimate');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {serviceRequestIdParam && (
            <Link
              href={`/requests/${serviceRequestIdParam}`}
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Request Details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Request</span>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">New Estimate</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create an internal cost estimate for a service request
            </p>
          </div>
        </div>
        <Link
          href={serviceRequestIdParam ? `/requests/${serviceRequestIdParam}` : '/estimates'}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Request Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Service Request
          </h2>

          {selectedServiceRequest ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  {selectedServiceRequest.requestNo}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedServiceRequest.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Customer: {getCustomerName(selectedServiceRequest.customer)}
                  {selectedServiceRequest.zone && ` | Zone: ${selectedServiceRequest.zone.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedServiceRequest(null);
                  setFormData({ ...formData, serviceRequestId: '' });
                }}
                className="text-red-500 hover:text-red-600"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search by request number or title..."
                value={serviceRequestSearch}
                onChange={(e) => setServiceRequestSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {searchingServiceRequest && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {serviceRequests.length > 0 && !selectedServiceRequest && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {serviceRequests.map((sr) => (
                    <button
                      key={sr.id}
                      type="button"
                      onClick={() => {
                        setSelectedServiceRequest(sr);
                        setFormData({
                          ...formData,
                          serviceRequestId: sr.id,
                          title: sr.title || '',
                        });
                        setServiceRequests([]);
                        setServiceRequestSearch('');
                        // Fetch and populate Scope of Work from notes
                        const token = localStorage.getItem('accessToken');
                        fetchScopeOfWorkNote(sr.id, token);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <p className="font-medium text-gray-800 dark:text-white">
                        {sr.requestNo} - {sr.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getCustomerName(sr.customer)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Estimate Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Estimate Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Plumbing Repair Estimate"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Brief description of the work"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scope of Work
                </label>
                {scopeFromNote && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Pre-filled from Technician Note
                  </span>
                )}
              </div>
              <textarea
                value={formData.scope}
                onChange={(e) => {
                  setFormData({ ...formData, scope: e.target.value });
                  if (scopeFromNote) setScopeFromNote(false);
                }}
                rows={3}
                placeholder="Detailed scope of work..."
                className={`w-full px-4 py-2.5 rounded-lg border ${scopeFromNote ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'} text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500`}
              />
              {scopeFromNote && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This scope was pre-filled from a technician&apos;s note. Feel free to enhance or modify it.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Material Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Material Items
            </h2>
            <button
              type="button"
              onClick={addMaterialItem}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {materialItems.map((item, index) => {
              const itemTotals = calculateMaterialItemTotals(item);
              return (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Item {index + 1}
                    </span>
                    {materialItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaterialItem(item.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                      <select
                        value={item.itemType}
                        onChange={(e) => updateMaterialItem(item.id, 'itemType', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      >
                        {itemTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 relative">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name *</label>
                      <input
                        type="text"
                        value={showItemDropdown === item.id ? (itemSearchText[item.id] || '') : item.name}
                        onChange={(e) => {
                          setItemSearchText({ ...itemSearchText, [item.id]: e.target.value });
                          if (!item.inventoryItemId) {
                            updateMaterialItem(item.id, 'name', e.target.value);
                          }
                        }}
                        onFocus={() => setShowItemDropdown(item.id)}
                        placeholder="Search or type item name..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      />
                      {item.inventoryItemId && (
                        <button
                          type="button"
                          onClick={() => {
                            updateMaterialItem(item.id, 'inventoryItemId', undefined);
                            updateMaterialItem(item.id, 'name', '');
                            setShowItemDropdown(item.id);
                          }}
                          className="absolute right-2 top-7 text-gray-400 hover:text-gray-600"
                          title="Clear selection"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {showItemDropdown === item.id && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {getFilteredInventoryItems(itemSearchText[item.id] || '').map((invItem) => (
                            <button
                              key={invItem.id}
                              type="button"
                              onClick={() => handleSelectInventoryItem(item.id, invItem)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                            >
                              <p className="font-medium text-gray-800 dark:text-white">{invItem.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {invItem.itemNo} | {invItem.unit} | {Number(invItem.unitPrice).toFixed(3)} BHD
                              </p>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveItemRowId(item.id);
                              setNewItemForm({
                                ...newItemForm,
                                name: itemSearchText[item.id] || item.name || '',
                              });
                              setShowNewItemModal(true);
                              setShowItemDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm text-blue-600 dark:text-blue-400 border-t border-gray-200 dark:border-gray-600"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create New Item
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateMaterialItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                        min="0.001"
                        step="0.001"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Unit</label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateMaterialItem(item.id, 'unit', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      >
                        {units.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Unit Cost (BHD)</label>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateMaterialItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.001"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Markup Type</label>
                      <select
                        value={item.markupType}
                        onChange={(e) => updateMaterialItem(item.id, 'markupType', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      >
                        <option value="">No Markup</option>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Markup {item.markupType === 'PERCENTAGE' ? '(%)' : '(BHD)'}
                      </label>
                      <input
                        type="number"
                        value={item.markupValue}
                        onChange={(e) => updateMaterialItem(item.id, 'markupValue', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        disabled={!item.markupType}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm text-gray-800 dark:text-white">
                        {formatCurrency(itemTotals.totalCost)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Markup</label>
                      <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-400">
                        +{formatCurrency(itemTotals.markupAmount)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Total</label>
                      <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-400">
                        {formatCurrency(itemTotals.totalPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300">Materials Total:</span>
            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totals.materialTotal)}</span>
          </div>
        </div>

        {/* Labor Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Labor Items
            </h2>
            <button
              type="button"
              onClick={addLaborItem}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Labor
            </button>
          </div>

          <div className="space-y-4">
            {laborItems.map((item, index) => {
              const itemTotals = calculateLaborItemTotals(item);
              return (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Labor {index + 1}
                    </span>
                    {laborItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLaborItem(item.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description *</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLaborItem(item.id, 'description', e.target.value)}
                        placeholder="e.g., Technician, Painter, Helper"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rate Type</label>
                      <select
                        value={item.laborRateTypeId}
                        onChange={(e) => updateLaborItem(item.id, 'laborRateTypeId', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      >
                        <option value="">Custom Rate</option>
                        {laborRateTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Billing</label>
                      <select
                        value={item.rateType}
                        onChange={(e) => updateLaborItem(item.id, 'rateType', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      >
                        <option value="HOURLY">Hourly</option>
                        <option value="DAILY">Daily</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Workers</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLaborItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      />
                    </div>

                    {item.rateType === 'HOURLY' ? (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hours</label>
                          <input
                            type="number"
                            value={item.hours}
                            onChange={(e) => updateLaborItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hourly Rate (BHD)</label>
                          <input
                            type="number"
                            value={item.hourlyRate}
                            onChange={(e) => updateLaborItem(item.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.001"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Days</label>
                          <input
                            type="number"
                            value={item.days}
                            onChange={(e) => updateLaborItem(item.id, 'days', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.5"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Rate (BHD)</label>
                          <input
                            type="number"
                            value={item.dailyRate}
                            onChange={(e) => updateLaborItem(item.id, 'dailyRate', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.001"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Markup Type</label>
                      <select
                        value={item.markupType}
                        onChange={(e) => updateLaborItem(item.id, 'markupType', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm"
                      >
                        <option value="">No Markup</option>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FIXED">Fixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Markup {item.markupType === 'PERCENTAGE' ? '(%)' : '(BHD)'}
                      </label>
                      <input
                        type="number"
                        value={item.markupValue}
                        onChange={(e) => updateLaborItem(item.id, 'markupValue', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        disabled={!item.markupType}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm text-gray-800 dark:text-white">
                        {formatCurrency(itemTotals.totalCost)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Markup</label>
                      <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-400">
                        +{formatCurrency(itemTotals.markupAmount)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Total</label>
                      <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-400">
                        {formatCurrency(itemTotals.totalPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex justify-between items-center">
            <span className="font-medium text-gray-700 dark:text-gray-300">Labor Total:</span>
            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(totals.laborTotal)}</span>
          </div>
        </div>

        {/* Additional Costs & Profit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Additional Costs & Profit
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transport Cost (BHD)
              </label>
              <input
                type="number"
                value={formData.transportCost}
                onChange={(e) => setFormData({ ...formData, transportCost: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.001"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profit Margin Type
              </label>
              <select
                value={formData.profitMarginType}
                onChange={(e) => setFormData({ ...formData, profitMarginType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Profit Margin</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profit Value {formData.profitMarginType === 'PERCENTAGE' ? '(%)' : '(BHD)'}
              </label>
              <input
                type="number"
                value={formData.profitMarginValue}
                onChange={(e) => setFormData({ ...formData, profitMarginValue: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                disabled={!formData.profitMarginType}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                VAT Rate (%)
              </label>
              <input
                type="number"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Type
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Discount</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(BHD)'}
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.001"
                disabled={!formData.discountType}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Target Total for Rounding */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              Set Target Total (BHD)
            </label>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Enter your desired final amount (e.g., 275) to auto-calculate the discount
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={targetTotal}
                onChange={(e) => setTargetTotal(e.target.value)}
                placeholder={`Current: ${formatCurrency(totals.total)}`}
                min="0"
                step="0.001"
                className="flex-1 px-4 py-2.5 rounded-lg border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={calculateDiscountFromTarget}
                disabled={!targetTotal}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Materials</span>
              <span>{formatCurrency(totals.materialTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Labor</span>
              <span>{formatCurrency(totals.laborTotal)}</span>
            </div>
            {formData.transportCost > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Transport</span>
                <span>{formatCurrency(formData.transportCost)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between text-gray-800 dark:text-white">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.profitAmount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Profit ({formData.profitMarginType === 'PERCENTAGE' ? `${formData.profitMarginValue}%` : 'Fixed'})</span>
                <span>+{formatCurrency(totals.profitAmount)}</span>
              </div>
            )}
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Before VAT</span>
              <span>{formatCurrency(totals.totalBeforeVat)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>VAT ({formData.vatRate}%)</span>
              <span>{formatCurrency(totals.vatAmount)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-between text-xl font-bold text-gray-900 dark:text-white">
              <span>Total</span>
              <span className="text-blue-600 dark:text-blue-400">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Timeline & Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Timeline & Notes</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 2-3 days"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated Start Date
              </label>
              <input
                type="date"
                value={formData.estimatedStartDate}
                onChange={(e) => setFormData({ ...formData, estimatedStartDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated End Date
              </label>
              <input
                type="date"
                value={formData.estimatedEndDate}
                onChange={(e) => setFormData({ ...formData, estimatedEndDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                rows={2}
                placeholder="Notes for internal use only"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assumptions
              </label>
              <textarea
                value={formData.assumptions}
                onChange={(e) => setFormData({ ...formData, assumptions: e.target.value })}
                rows={2}
                placeholder="Assumptions made for this estimate"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Exclusions
              </label>
              <textarea
                value={formData.exclusions}
                onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                rows={2}
                placeholder="What is NOT included in this estimate"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/estimates"
            className="px-6 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Estimate'}
          </button>
        </div>
      </form>

      {/* Create New Item Modal */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Create New Inventory Item
            </h2>
            <form onSubmit={handleCreateNewItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (English) *</label>
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name (Arabic)</label>
                <input
                  type="text"
                  value={newItemForm.nameAr}
                  onChange={(e) => setNewItemForm({ ...newItemForm, nameAr: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select
                  value={newItemForm.categoryId}
                  onChange={(e) => setNewItemForm({ ...newItemForm, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  required
                >
                  <option value="">Select a category</option>
                  {inventoryCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <select
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price (BHD)</label>
                  <input
                    type="number"
                    value={newItemForm.unitPrice}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    min="0"
                    step="0.001"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewItemModal(false);
                    setActiveItemRowId(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewItem}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {savingNewItem ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showItemDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowItemDropdown(null)}
        />
      )}
    </div>
  );
}
