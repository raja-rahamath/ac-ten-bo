'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  orgName?: string;
}

interface ServiceRequest {
  id: string;
  requestNo: string;
  title: string;
  customerId: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(searchParams.get('customerId') || '');
  const [selectedServiceRequestId, setSelectedServiceRequestId] = useState(searchParams.get('serviceRequestId') || '');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Auto-select customer when service request is selected
  useEffect(() => {
    if (selectedServiceRequestId) {
      const sr = serviceRequests.find(r => r.id === selectedServiceRequestId);
      if (sr && sr.customerId) {
        setSelectedCustomerId(sr.customerId);
      }
    }
  }, [selectedServiceRequestId, serviceRequests]);

  async function fetchDropdownData() {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [customersRes, requestsRes] = await Promise.all([
        fetch('http://localhost:4001/api/v1/customers?limit=100', { headers }),
        fetch('http://localhost:4001/api/v1/service-requests?limit=100&status=COMPLETED', { headers }),
      ]);

      const customersData = await customersRes.json();
      const requestsData = await requestsRes.json();

      if (customersData.success) {
        setCustomers(customersData.data);
      }
      if (requestsData.success) {
        setServiceRequests(requestsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  }

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function calculateSubtotal() {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  function calculateTax() {
    return calculateSubtotal() * 0.05; // 5% VAT
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateTax();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const validItems = items
      .filter((item) => item.description && item.unitPrice > 0)
      .map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

    if (validItems.length === 0) {
      setError('Please add at least one invoice item');
      setIsLoading(false);
      return;
    }

    const dueDate = formData.get('dueDate') as string;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          serviceRequestId: selectedServiceRequestId || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: formData.get('notes') || undefined,
          items: validItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create invoice');
      }

      router.push(`/invoices/${data.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
    }).format(amount);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
      </div>

      <div className="rounded-xl bg-white p-8 shadow-sm">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="serviceRequestId" className="mb-2 block font-medium">
                Service Request *
              </label>
              <select
                id="serviceRequestId"
                name="serviceRequestId"
                required
                value={selectedServiceRequestId}
                onChange={(e) => setSelectedServiceRequestId(e.target.value)}
                className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a service request</option>
                {serviceRequests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.requestNo} - {request.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">Only completed service requests are shown</p>
            </div>
            <div>
              <label htmlFor="customerId" className="mb-2 block font-medium">
                Customer *
              </label>
              <select
                id="customerId"
                name="customerId"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.orgName || `${customer.firstName} ${customer.lastName}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="mb-2 block font-medium">
              Due Date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              className="w-full max-w-xs rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Invoice Items */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <label className="font-medium">Invoice Items *</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                + Add Item
              </Button>
            </div>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 rounded-lg border p-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full rounded-lg border p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      min="0"
                      step="0.001"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border p-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="w-32 py-2 text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">VAT (5%)</span>
                    <span>{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-lg border p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Additional notes for the invoice..."
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
