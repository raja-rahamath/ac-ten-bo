'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  customerNo: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
  customerType: string;
}

interface Unit {
  id: string;
  unitNo: string;
  flatNumber?: string;
  building?: { buildingNumber: string; name?: string };
}

interface ComplaintType {
  id: string;
  name: string;
}

interface SelectedProperty {
  unitId?: string;
  propertyId?: string;
  label: string;
  notes?: string;
}

interface SelectedService {
  complaintTypeId: string;
  name: string;
  frequency: string;
  visitsPerYear: number;
}

const PAYMENT_TERMS = [
  { value: 'UPFRONT', label: 'Upfront (Full Payment)' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
  { value: 'ANNUAL', label: 'Annual' },
];

const SERVICE_FREQUENCIES = [
  { value: 'WEEKLY', label: 'Weekly', visits: 52 },
  { value: 'BI_WEEKLY', label: 'Bi-Weekly', visits: 26 },
  { value: 'MONTHLY', label: 'Monthly', visits: 12 },
  { value: 'BI_MONTHLY', label: 'Bi-Monthly', visits: 6 },
  { value: 'QUARTERLY', label: 'Quarterly', visits: 4 },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual', visits: 2 },
  { value: 'ANNUAL', label: 'Annual', visits: 1 },
];

export default function NewAmcContractPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Lookups
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Form data
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('MONTHLY');
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewalReminderDays, setRenewalReminderDays] = useState('30');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Selected items
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperty[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

  // Modal states
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers();
    }
  }, [customerSearch]);

  async function fetchLookups() {
    try {
      const [unitsRes, complaintsRes] = await Promise.all([
        api.get<{ success: boolean; data: Unit[] }>('/units?limit=500&isActive=true'),
        api.get<{ success: boolean; data: ComplaintType[] }>('/complaint-types?limit=100'),
      ]);

      if (unitsRes.success) setUnits(unitsRes.data);
      if (complaintsRes.success) setComplaintTypes(complaintsRes.data);
    } catch (error) {
      console.error('Failed to fetch lookups:', error);
    }
  }

  async function searchCustomers() {
    try {
      const res = await api.get<{ success: boolean; data: Customer[] }>(
        `/customers?search=${customerSearch}&limit=10`
      );
      if (res.success) setCustomers(res.data);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  }

  function selectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setCustomers([]);
  }

  function getCustomerName(customer: Customer) {
    if (customer.customerType === 'ORGANIZATION') {
      return customer.orgName || 'Unknown Company';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
  }

  function addProperty(unit: Unit) {
    const label = unit.building
      ? `Bldg ${unit.building.buildingNumber} - Unit ${unit.flatNumber || unit.unitNo}`
      : `Unit ${unit.unitNo}`;

    if (!selectedProperties.find((p) => p.unitId === unit.id)) {
      setSelectedProperties([...selectedProperties, { unitId: unit.id, label }]);
    }
    setShowPropertyModal(false);
  }

  function removeProperty(index: number) {
    setSelectedProperties(selectedProperties.filter((_, i) => i !== index));
  }

  function addService(complaint: ComplaintType, frequency: string) {
    const freq = SERVICE_FREQUENCIES.find((f) => f.value === frequency);
    if (!selectedServices.find((s) => s.complaintTypeId === complaint.id)) {
      setSelectedServices([
        ...selectedServices,
        {
          complaintTypeId: complaint.id,
          name: complaint.name,
          frequency,
          visitsPerYear: freq?.visits || 12,
        },
      ]);
    }
    setShowServiceModal(false);
  }

  function removeService(index: number) {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  }

  function validateStep1() {
    if (!customerId) {
      setError('Please select a customer');
      return false;
    }
    if (!startDate || !endDate) {
      setError('Please set contract period');
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return false;
    }
    if (!contractValue || Number(contractValue) <= 0) {
      setError('Please enter a valid contract value');
      return false;
    }
    setError('');
    return true;
  }

  function validateStep2() {
    if (selectedProperties.length === 0) {
      setError('Please add at least one property');
      return false;
    }
    setError('');
    return true;
  }

  function validateStep3() {
    if (selectedServices.length === 0) {
      setError('Please add at least one service');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit() {
    if (!validateStep3()) return;

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        customerId,
        startDate,
        endDate,
        contractValue: Number(contractValue),
        paymentTerms,
        autoRenew,
        renewalReminderDays: autoRenew ? Number(renewalReminderDays) : undefined,
        terms: terms || undefined,
        notes: notes || undefined,
        properties: selectedProperties.map((p) => ({
          unitId: p.unitId,
          propertyId: p.propertyId,
          notes: p.notes,
        })),
        services: selectedServices.map((s) => ({
          complaintTypeId: s.complaintTypeId,
          frequency: s.frequency,
          visitsPerYear: s.visitsPerYear,
        })),
      };

      const res = await api.post<{ success: boolean; data: { id: string }; error?: { message: string } }>(
        '/amc',
        payload
      );

      if (res.success) {
        router.push(`/amc/${res.data.id}`);
      } else {
        throw new Error(res.error?.message || 'Failed to create contract');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">New AMC Contract</h1>
          <p className="text-dark-500 dark:text-dark-400">Create an Annual Maintenance Contract</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 dark:bg-dark-700 text-dark-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-20 md:w-32 h-1 mx-2 ${
                    step > s ? 'bg-primary-500' : 'bg-dark-100 dark:bg-dark-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-dark-600 dark:text-dark-400">Contract Details</span>
          <span className="text-dark-600 dark:text-dark-400">Properties</span>
          <span className="text-dark-600 dark:text-dark-400">Services</span>
          <span className="text-dark-600 dark:text-dark-400">Review</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-dark-100 dark:border-dark-700 p-6">
        {/* Step 1: Contract Details */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">Contract Details</h2>

            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Customer <span className="text-red-500">*</span>
              </label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                  <div>
                    <div className="font-medium text-dark-800 dark:text-white">
                      {getCustomerName(selectedCustomer)}
                    </div>
                    <div className="text-sm text-dark-500">{selectedCustomer.customerNo}</div>
                  </div>
                  <button
                    onClick={() => { setSelectedCustomer(null); setCustomerId(''); }}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer by name or ID..."
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                  />
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => selectCustomer(c)}
                          className="w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700 border-b border-dark-100 dark:border-dark-700 last:border-0"
                        >
                          <div className="font-medium text-dark-800 dark:text-white">
                            {getCustomerName(c)}
                          </div>
                          <div className="text-sm text-dark-500">{c.customerNo}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contract Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                />
              </div>
            </div>

            {/* Contract Value & Payment Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Contract Value (BHD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  placeholder="0.000"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                >
                  {PAYMENT_TERMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto Renew */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-dark-700 dark:text-dark-300">Auto-renew contract</span>
              </label>
              {autoRenew && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-dark-500">Remind</span>
                  <input
                    type="number"
                    value={renewalReminderDays}
                    onChange={(e) => setRenewalReminderDays(e.target.value)}
                    className="w-16 rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-2 py-1 text-center"
                  />
                  <span className="text-sm text-dark-500">days before</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white"
                placeholder="Optional notes about the contract..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Properties */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark-800 dark:text-white">Properties</h2>
              <button
                onClick={() => setShowPropertyModal(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
              >
                + Add Property
              </button>
            </div>

            {selectedProperties.length === 0 ? (
              <div className="text-center py-12 text-dark-500 dark:text-dark-400">
                No properties added yet. Click "Add Property" to select properties covered by this contract.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProperties.map((prop, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700 rounded-xl"
                  >
                    <div className="font-medium text-dark-800 dark:text-white">{prop.label}</div>
                    <button
                      onClick={() => removeProperty(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Services */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark-800 dark:text-white">Services</h2>
              <button
                onClick={() => setShowServiceModal(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
              >
                + Add Service
              </button>
            </div>

            {selectedServices.length === 0 ? (
              <div className="text-center py-12 text-dark-500 dark:text-dark-400">
                No services added yet. Click "Add Service" to select services included in this contract.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedServices.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-700 rounded-xl"
                  >
                    <div>
                      <div className="font-medium text-dark-800 dark:text-white">{service.name}</div>
                      <div className="text-sm text-dark-500">
                        {SERVICE_FREQUENCIES.find((f) => f.value === service.frequency)?.label} ({service.visitsPerYear} visits/year)
                      </div>
                    </div>
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white">Review Contract</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Customer</h3>
                <p className="text-dark-800 dark:text-white">{selectedCustomer ? getCustomerName(selectedCustomer) : '-'}</p>
              </div>
              <div>
                <h3 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Contract Period</h3>
                <p className="text-dark-800 dark:text-white">{startDate} to {endDate}</p>
              </div>
              <div>
                <h3 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Contract Value</h3>
                <p className="text-dark-800 dark:text-white">{Number(contractValue).toFixed(3)} BHD</p>
              </div>
              <div>
                <h3 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Payment Terms</h3>
                <p className="text-dark-800 dark:text-white">
                  {PAYMENT_TERMS.find((t) => t.value === paymentTerms)?.label}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Properties ({selectedProperties.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProperties.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-dark-100 dark:bg-dark-700 rounded-lg text-sm">
                    {p.label}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-dark-700 dark:text-dark-300 mb-2">Services ({selectedServices.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {autoRenew && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                Auto-renewal enabled. Reminder will be sent {renewalReminderDays} days before expiry.
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-dark-100 dark:border-dark-700">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 disabled:opacity-50"
          >
            Previous
          </button>
          {step < 4 ? (
            <button
              onClick={() => {
                if (step === 1 && validateStep1()) setStep(2);
                else if (step === 2 && validateStep2()) setStep(3);
                else if (step === 3 && validateStep3()) setStep(4);
              }}
              className="px-6 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Contract'}
            </button>
          )}
        </div>
      </div>

      {/* Property Selection Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
              <h3 className="font-semibold text-dark-800 dark:text-white">Select Property</h3>
              <button onClick={() => setShowPropertyModal(false)} className="text-dark-400 hover:text-dark-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {units.length === 0 ? (
                <p className="text-dark-500 text-center py-4">No units available</p>
              ) : (
                <div className="space-y-2">
                  {units.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => addProperty(unit)}
                      disabled={selectedProperties.some((p) => p.unitId === unit.id)}
                      className="w-full p-3 text-left border border-dark-200 dark:border-dark-600 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-dark-800 dark:text-white">
                        {unit.building ? `Bldg ${unit.building.buildingNumber}` : ''} - Unit {unit.flatNumber || unit.unitNo}
                      </div>
                      <div className="text-sm text-dark-500">{unit.unitNo}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between">
              <h3 className="font-semibold text-dark-800 dark:text-white">Add Service</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-dark-400 hover:text-dark-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <ServiceSelector
                complaintTypes={complaintTypes}
                selectedServices={selectedServices}
                onAdd={addService}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Service Selector Component
function ServiceSelector({
  complaintTypes,
  selectedServices,
  onAdd,
}: {
  complaintTypes: ComplaintType[];
  selectedServices: SelectedService[];
  onAdd: (complaint: ComplaintType, frequency: string) => void;
}) {
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintType | null>(null);
  const [frequency, setFrequency] = useState('MONTHLY');

  if (!selectedComplaint) {
    return (
      <div className="space-y-2">
        {complaintTypes.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setSelectedComplaint(ct)}
            disabled={selectedServices.some((s) => s.complaintTypeId === ct.id)}
            className="w-full p-3 text-left border border-dark-200 dark:border-dark-600 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50"
          >
            {ct.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-dark-800 dark:text-white mb-2">{selectedComplaint.name}</h4>
        <p className="text-sm text-dark-500 mb-4">Select service frequency</p>
      </div>
      <div className="space-y-2">
        {SERVICE_FREQUENCIES.map((f) => (
          <label
            key={f.value}
            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
              frequency === f.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-dark-200 dark:border-dark-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="frequency"
                value={f.value}
                checked={frequency === f.value}
                onChange={() => setFrequency(f.value)}
                className="w-4 h-4 text-primary-500"
              />
              <span className="text-dark-800 dark:text-white">{f.label}</span>
            </div>
            <span className="text-sm text-dark-500">{f.visits} visits/year</span>
          </label>
        ))}
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => setSelectedComplaint(null)}
          className="flex-1 px-4 py-2 border border-dark-200 dark:border-dark-600 rounded-lg"
        >
          Back
        </button>
        <button
          onClick={() => onAdd(selectedComplaint, frequency)}
          className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Add Service
        </button>
      </div>
    </div>
  );
}
