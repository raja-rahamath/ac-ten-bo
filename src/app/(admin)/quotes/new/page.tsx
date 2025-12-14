'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  customerNo: string;
  customerType: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
}

interface QuoteItem {
  id: string;
  itemType: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: string | null;
  discountValue: number;
  taxRate: number;
}

const itemTypes = [
  { value: 'SERVICE', label: 'Service' },
  { value: 'LABOR', label: 'Labor' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'OTHER', label: 'Other' },
];

const defaultItem: QuoteItem = {
  id: '',
  itemType: 'SERVICE',
  name: '',
  description: '',
  quantity: 1,
  unit: 'unit',
  unitPrice: 0,
  discountType: null,
  discountValue: 0,
  taxRate: 0,
};

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    description: '',
    taxRate: 0,
    discountType: '' as string,
    discountValue: 0,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: '',
    notes: '',
    internalNotes: '',
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { ...defaultItem, id: crypto.randomUUID() },
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (customerSearch.length > 2) {
      searchCustomers(customerSearch);
    }
  }, [customerSearch]);

  const searchCustomers = async (search: string) => {
    try {
      setSearchingCustomer(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_URL}/customers?search=${encodeURIComponent(search)}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Failed to search customers:', error);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  };

  const calculateItemTotal = (item: QuoteItem) => {
    const subtotal = item.quantity * item.unitPrice;
    let discount = 0;
    if (item.discountType === 'PERCENTAGE') {
      discount = subtotal * (item.discountValue / 100);
    } else if (item.discountType === 'FIXED') {
      discount = item.discountValue;
    }
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (item.taxRate / 100);
    return afterDiscount + tax;
  };

  const calculateTotals = () => {
    const itemsSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const itemsDiscount = items.reduce((sum, item) => {
      if (item.discountType === 'PERCENTAGE') {
        return sum + item.quantity * item.unitPrice * (item.discountValue / 100);
      } else if (item.discountType === 'FIXED') {
        return sum + item.discountValue;
      }
      return sum;
    }, 0);

    let quoteDiscount = 0;
    if (formData.discountType === 'PERCENTAGE') {
      quoteDiscount = itemsSubtotal * (formData.discountValue / 100);
    } else if (formData.discountType === 'FIXED') {
      quoteDiscount = formData.discountValue;
    }

    const totalDiscount = itemsDiscount + quoteDiscount;
    const afterDiscount = itemsSubtotal - totalDiscount;
    const tax = afterDiscount * (formData.taxRate / 100);
    const total = afterDiscount + tax;

    return {
      subtotal: itemsSubtotal,
      discount: totalDiscount,
      tax,
      total,
    };
  };

  const addItem = () => {
    setItems([...items, { ...defaultItem, id: crypto.randomUUID() }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean = true) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (items.some((item) => !item.name.trim() || item.unitPrice <= 0)) {
      alert('Please complete all item details');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const payload = {
        ...formData,
        validUntil: new Date(formData.validUntil).toISOString(),
        discountType: formData.discountType || null,
        items: items.map((item) => ({
          itemType: item.itemType,
          name: item.name,
          description: item.description || undefined,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountType: item.discountType || undefined,
          discountValue: item.discountValue,
          taxRate: item.taxRate,
        })),
      };

      const response = await fetch('${API_URL}/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/quotes/${data.data.id}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create quote');
      }
    } catch (error) {
      console.error('Failed to create quote:', error);
      alert('Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">
            New Quote
          </h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Create a new quote for a customer
          </p>
        </div>
        <Link
          href="/quotes"
          className="px-4 py-2 text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
            Customer
          </h2>

          {selectedCustomer ? (
            <div className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700 rounded-lg">
              <div>
                <p className="font-medium text-dark-800 dark:text-white">
                  {getCustomerName(selectedCustomer)}
                </p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  {selectedCustomer.customerNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setFormData({ ...formData, customerId: '' });
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
                placeholder="Search customer by name or number..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
              {searchingCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {customers.length > 0 && !selectedCustomer && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setFormData({ ...formData, customerId: customer.id });
                        setCustomers([]);
                        setCustomerSearch('');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700"
                    >
                      <p className="font-medium text-dark-800 dark:text-white">
                        {getCustomerName(customer)}
                      </p>
                      <p className="text-sm text-dark-500 dark:text-dark-400">
                        {customer.customerNo}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quote Details */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
            Quote Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., AC Maintenance Service"
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Valid Until *
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
              Line Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-dark-50 dark:bg-dark-700 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-dark-600 dark:text-dark-400">
                    Item {index + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Type</label>
                    <select
                      value={item.itemType}
                      onChange={(e) => updateItem(item.id, 'itemType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white text-sm"
                    >
                      {itemTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="Item name"
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white text-sm"
                      required
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      min="0.001"
                      step="0.001"
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Unit</label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      placeholder="unit"
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Unit Price (BHD)</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.001"
                      className="w-full px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Total</label>
                    <div className="px-3 py-2 bg-dark-100 dark:bg-dark-600 rounded-lg text-sm font-medium text-dark-800 dark:text-white">
                      BHD {calculateItemTotal(item).toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
            Summary
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-dark-600 dark:text-dark-400">
              <span>Subtotal</span>
              <span>BHD {totals.subtotal.toFixed(3)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Discount</span>
                <span>-BHD {totals.discount.toFixed(3)}</span>
              </div>
            )}
            {totals.tax > 0 && (
              <div className="flex justify-between text-dark-600 dark:text-dark-400">
                <span>Tax ({formData.taxRate}%)</span>
                <span>BHD {totals.tax.toFixed(3)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-dark-200 dark:border-dark-600 flex justify-between text-lg font-semibold text-dark-800 dark:text-white">
              <span>Total</span>
              <span>BHD {totals.total.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
            Terms & Notes
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={3}
                placeholder="Payment terms, delivery terms, etc."
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Customer Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Notes visible to customer"
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                rows={2}
                placeholder="Internal notes (not visible to customer)"
                className="w-full px-4 py-2.5 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/quotes"
            className="px-6 py-2.5 text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quote'}
          </button>
        </div>
      </form>
    </div>
  );
}
