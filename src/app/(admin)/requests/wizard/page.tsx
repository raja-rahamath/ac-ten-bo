'use client';

import { useState, useEffect } from 'react';
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

interface CustomerProperty {
  id: string;
  propertyId: string;
  property: Property;
  ownershipType: string;
  status: string;
  isPrimary: boolean;
}

interface ComplaintType {
  id: string;
  name: string;
  nameAr?: string;
}

interface RequestType {
  id: string;
  name: string;
  nameAr?: string;
}

interface PropertyType {
  id: string;
  name: string;
  nameAr?: string;
}

const STEPS = [
  { number: 1, title: 'Select Customer', description: 'Search and select a customer' },
  { number: 2, title: 'Select Property', description: 'Choose a property for the service' },
  { number: 3, title: 'Issue Details', description: 'Describe the issue' },
  { number: 4, title: 'Confirm & Submit', description: 'Review and submit' },
];

export default function NewRequestWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+973',
    phoneNumber: '',
    email: '',
  });

  // Step 2: Property selection
  const [customerProperties, setCustomerProperties] = useState<CustomerProperty[]>([]);
  const [selectedCustomerProperty, setSelectedCustomerProperty] = useState<CustomerProperty | null>(null);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedNewProperty, setSelectedNewProperty] = useState<Property | null>(null);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [newOwnershipType, setNewOwnershipType] = useState<'OWNER' | 'TENANT' | 'PROPERTY_MANAGER' | 'AUTHORIZED_CONTACT'>('TENANT');
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [zones, setZones] = useState<{ id: string; name: string; governorateId?: string }[]>([]);
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [newPropertyForm, setNewPropertyForm] = useState({
    flatNumber: '',
    buildingNumber: '',
    roadNumber: '',
    blockNumber: '',
    areaId: '',
    typeId: '',
  });

  // Step 3: Issue details
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [selectedComplaintTypeId, setSelectedComplaintTypeId] = useState('');
  const [selectedRequestTypeId, setSelectedRequestTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('MEDIUM');

  // Load complaint types and request types on mount
  useEffect(() => {
    fetchReferenceData();
  }, []);

  // Search customers
  useEffect(() => {
    if (customerSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  // Load customer properties when customer selected
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerProperties(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  // Search properties for adding new
  useEffect(() => {
    if (propertySearch.length >= 2) {
      const timer = setTimeout(() => {
        searchProperties();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setProperties([]);
    }
  }, [propertySearch]);

  async function fetchReferenceData() {
    try {
      const [complaintTypesRes, requestTypesRes, areasRes, governoratesRes, propertyTypesRes] = await Promise.all([
        api.get<{ success: boolean; data: ComplaintType[] }>('/complaint-types'),
        api.get<{ success: boolean; data: RequestType[] }>('/request-types'),
        api.get<{ success: boolean; data: { id: string; name: string; governorateId?: string }[] }>('/areas?limit=200'),
        api.get<{ success: boolean; data: { id: string; name: string }[] }>('/governorates?limit=100'),
        api.get<{ success: boolean; data: PropertyType[] }>('/property-types'),
      ]);
      if (complaintTypesRes.success) setComplaintTypes(complaintTypesRes.data);
      if (requestTypesRes.success) setRequestTypes(requestTypesRes.data);
      if (areasRes.success) setZones(areasRes.data);
      if (governoratesRes.success) setGovernorates(governoratesRes.data);
      if (propertyTypesRes.success) setPropertyTypes(propertyTypesRes.data);
    } catch (err) {
      console.error('Failed to fetch reference data:', err);
    }
  }

  async function searchCustomers() {
    setIsSearchingCustomers(true);
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
      setIsSearchingCustomers(false);
    }
  }

  async function fetchCustomerProperties(customerId: string) {
    setIsLoadingProperties(true);
    try {
      const data = await api.get<{ success: boolean; data: CustomerProperty[] }>(
        `/customer-properties/by-customer/${customerId}?status=ACTIVE`
      );
      if (data.success) {
        setCustomerProperties(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customer properties:', err);
      setCustomerProperties([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }

  async function searchProperties() {
    try {
      const data = await api.get<{ success: boolean; data: Property[] }>(
        `/properties?search=${encodeURIComponent(propertySearch)}&limit=10`
      );
      if (data.success) {
        // Filter out properties already linked to this customer
        const linkedPropertyIds = customerProperties.map(cp => cp.propertyId);
        const filtered = data.data.filter(p => !linkedPropertyIds.includes(p.id));
        setProperties(filtered);
        setShowPropertyDropdown(true);
      }
    } catch (err) {
      console.error('Failed to search properties:', err);
    }
  }

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerDropdown(false);
    // Reset property selection when customer changes
    setSelectedCustomerProperty(null);
    setSelectedNewProperty(null);
    setShowAddProperty(false);
  }

  async function handleCreateCustomer() {
    if (!newCustomerForm.firstName.trim() || !newCustomerForm.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    if (!newCustomerForm.phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setIsCreatingCustomer(true);
    setError(null);

    try {
      const payload: any = {
        customerType: 'INDIVIDUAL',
        firstName: newCustomerForm.firstName.trim(),
        lastName: newCustomerForm.lastName.trim(),
        phone: `${newCustomerForm.countryCode}${newCustomerForm.phoneNumber}`,
        isActive: true,
      };

      if (newCustomerForm.email.trim()) {
        payload.email = newCustomerForm.email.trim();
      }

      const result = await api.post<{ success: boolean; data: Customer }>('/customers', payload);
      if (result.success) {
        // Select the newly created customer
        selectCustomer(result.data);
        // Reset form and close modal
        setShowAddCustomer(false);
        setNewCustomerForm({
          firstName: '',
          lastName: '',
          countryCode: '+973',
          phoneNumber: '',
          email: '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
    } finally {
      setIsCreatingCustomer(false);
    }
  }

  function selectProperty(property: Property) {
    setSelectedNewProperty(property);
    setPropertySearch(property.address || property.name);
    setShowPropertyDropdown(false);
  }

  async function handleCreateProperty() {
    if (!newPropertyForm.buildingNumber.trim() || !newPropertyForm.roadNumber.trim() || !newPropertyForm.blockNumber.trim()) {
      setError('Building, Road, and Block numbers are required');
      return;
    }
    if (!newPropertyForm.typeId) {
      setError('Property Type is required');
      return;
    }

    setIsCreatingProperty(true);
    setError(null);

    try {
      // Build address string
      const addressParts = [];
      if (newPropertyForm.flatNumber.trim()) {
        addressParts.push(`Flat ${newPropertyForm.flatNumber.trim()}`);
      }
      addressParts.push(`Building ${newPropertyForm.buildingNumber.trim()}`);
      addressParts.push(`Road ${newPropertyForm.roadNumber.trim()}`);
      addressParts.push(`Block ${newPropertyForm.blockNumber.trim()}`);

      const selectedZone = zones.find(z => z.id === newPropertyForm.areaId);
      if (selectedZone) {
        addressParts.push(selectedZone.name);
      }

      const address = addressParts.join(', ');
      const name = newPropertyForm.flatNumber.trim()
        ? `Building ${newPropertyForm.buildingNumber} Flat ${newPropertyForm.flatNumber}`
        : `Building ${newPropertyForm.buildingNumber}`;

      const payload: any = {
        name,
        address,
        building: newPropertyForm.buildingNumber.trim(),
        road: newPropertyForm.roadNumber.trim(),
        block: newPropertyForm.blockNumber.trim(),
        flat: newPropertyForm.flatNumber.trim() || undefined,
        areaId: newPropertyForm.areaId || undefined,
        typeId: newPropertyForm.typeId,
      };

      const result = await api.post<{ success: boolean; data: Property }>('/properties', payload);
      if (result.success) {
        // Select the newly created property
        setSelectedNewProperty(result.data);
        setPropertySearch(result.data.address || result.data.name);
        // Reset form and close modal
        setShowCreateProperty(false);
        setNewPropertyForm({
          flatNumber: '',
          buildingNumber: '',
          roadNumber: '',
          blockNumber: '',
          areaId: '',
          typeId: '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create property');
    } finally {
      setIsCreatingProperty(false);
    }
  }

  async function handleAddPropertyLink() {
    if (!selectedCustomer || !selectedNewProperty) return;

    try {
      const payload = {
        customerId: selectedCustomer.id,
        propertyId: selectedNewProperty.id,
        ownershipType: newOwnershipType,
        isPrimary: customerProperties.length === 0,
      };

      const result = await api.post<{ success: boolean; data: CustomerProperty }>('/customer-properties', payload);
      if (result.success) {
        // Add to local list and select it
        setCustomerProperties([...customerProperties, result.data]);
        setSelectedCustomerProperty(result.data);
        setShowAddProperty(false);
        setPropertySearch('');
        setSelectedNewProperty(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add property link');
    }
  }

  function canProceedToNext(): boolean {
    switch (currentStep) {
      case 1:
        return !!selectedCustomer;
      case 2:
        return !!selectedCustomerProperty;
      case 3:
        return !!selectedComplaintTypeId && !!title.trim();
      case 4:
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (canProceedToNext() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleSubmit() {
    if (!selectedCustomer || !selectedCustomerProperty) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        customerId: selectedCustomer.id,
        propertyId: selectedCustomerProperty.property.id,
        customerPropertyId: selectedCustomerProperty.id,
        complaintTypeId: selectedComplaintTypeId,
        title: title.trim(),
        priority,
      };

      if (description.trim()) {
        payload.description = description.trim();
      }
      if (selectedRequestTypeId) {
        payload.requestTypeId = selectedRequestTypeId;
      }

      await api.post('/service-requests', payload);
      router.push('/requests');
    } catch (err: any) {
      setError(err.message || 'Failed to create service request');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatOwnershipType(type: string) {
    return type.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/requests"
          className="text-sm text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Requests
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-dark-800 dark:text-white">New Service Request</h1>
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
          Follow the steps to create a new service request
        </p>
      </div>

      {/* Step Indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step.number < currentStep
                      ? 'bg-green-500 text-white'
                      : step.number === currentStep
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-200 dark:bg-dark-700 text-dark-500 dark:text-dark-400'
                  }`}
                >
                  {step.number < currentStep ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium ${
                    step.number === currentStep
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-dark-500 dark:text-dark-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step.number < currentStep
                    ? 'bg-green-500'
                    : 'bg-dark-200 dark:bg-dark-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selection Summary - Always visible after selections are made */}
      {(selectedCustomer || selectedCustomerProperty) && currentStep > 1 && (
        <div className="mb-6 rounded-xl bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700 p-4">
          <div className="flex flex-wrap gap-4">
            {/* Customer Summary */}
            {selectedCustomer && (
              <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-dark-800 rounded-lg border border-dark-200 dark:border-dark-600">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Customer</p>
                  <p className="text-sm font-medium text-dark-800 dark:text-white">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-xs underline"
                >
                  Change
                </button>
              </div>
            )}

            {/* Property Summary */}
            {selectedCustomerProperty && (
              <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-dark-800 rounded-lg border border-dark-200 dark:border-dark-600">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400">Property</p>
                  <p className="text-sm font-medium text-dark-800 dark:text-white">
                    {selectedCustomerProperty.property.address || selectedCustomerProperty.property.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-xs underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
        {/* Step 1: Select Customer */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
              Step 1: Select Customer
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
              Search for a customer by name, phone number, or email
            </p>

            <div className="relative">
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                Search Customer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomer(null);
                  }}
                  onFocus={() => customerSearch.length >= 2 && setShowCustomerDropdown(true)}
                  placeholder="Enter name, phone, or email..."
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {isSearchingCustomers && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
                  </div>
                )}
              </div>

              {/* Customer dropdown */}
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {customers.map((customer) => (
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
                  ))}
                </div>
              )}
            </div>

            {/* Selected customer display */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-primary-700 dark:text-primary-300">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        Phone: {selectedCustomer.phone}
                      </p>
                    )}
                    {selectedCustomer.email && (
                      <p className="text-sm text-primary-600 dark:text-primary-400">
                        Email: {selectedCustomer.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch('');
                      setCustomerProperties([]);
                    }}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Add New Customer Button */}
            {!selectedCustomer && (
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="mt-4 w-full py-3 px-4 rounded-xl border-2 border-dashed border-dark-300 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add New Customer
              </button>
            )}
          </div>
        )}

        {/* Step 2: Select Property */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
              Step 2: Select Property
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
              Choose a property linked to {selectedCustomer?.firstName} {selectedCustomer?.lastName}
            </p>

            {isLoadingProperties ? (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2" />
                <p className="text-dark-500 dark:text-dark-400">Loading properties...</p>
              </div>
            ) : customerProperties.length > 0 ? (
              <div className="space-y-3">
                {customerProperties.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => setSelectedCustomerProperty(cp)}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      selectedCustomerProperty?.id === cp.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-dark-200 dark:border-dark-600 hover:border-primary-300 hover:bg-dark-50 dark:hover:bg-dark-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-dark-800 dark:text-white">
                          {cp.property.address || cp.property.name}
                        </p>
                        <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">
                          {formatOwnershipType(cp.ownershipType)}
                          {cp.isPrimary && ' (Primary)'}
                        </p>
                      </div>
                      {selectedCustomerProperty?.id === cp.id && (
                        <div className="text-primary-500">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-dark-500 dark:text-dark-400">
                No properties linked to this customer yet.
              </div>
            )}

            {/* Add new property link */}
            {!showAddProperty ? (
              <button
                type="button"
                onClick={() => setShowAddProperty(true)}
                className="mt-4 w-full py-3 px-4 rounded-xl border-2 border-dashed border-dark-300 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Property Link
              </button>
            ) : (
              <div className="mt-6 p-4 rounded-xl border border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-900">
                <h3 className="font-medium text-dark-800 dark:text-white mb-4">Link New Property</h3>

                <div className="relative mb-4">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Search Property
                  </label>
                  <input
                    type="text"
                    value={propertySearch}
                    onChange={(e) => {
                      setPropertySearch(e.target.value);
                      setSelectedNewProperty(null);
                    }}
                    onFocus={() => propertySearch.length >= 2 && setShowPropertyDropdown(true)}
                    placeholder="Search by property name or number..."
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />

                  {showPropertyDropdown && properties.length > 0 && !selectedNewProperty && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600 rounded-xl shadow-lg max-h-48 overflow-auto">
                      {properties.map((property) => (
                        <button
                          key={property.id}
                          type="button"
                          onClick={() => selectProperty(property)}
                          className="w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700 border-b border-dark-100 dark:border-dark-700 last:border-0"
                        >
                          <p className="font-medium text-dark-800 dark:text-white">
                            {property.address || property.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create New Property Button */}
                <button
                  type="button"
                  onClick={() => setShowCreateProperty(true)}
                  className="mb-4 w-full py-2 px-4 rounded-xl border border-dashed border-dark-300 dark:border-dark-600 text-dark-600 dark:text-dark-400 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Property
                </button>

                {selectedNewProperty && (
                  <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <p className="font-medium text-primary-700 dark:text-primary-300">
                      {selectedNewProperty.address || selectedNewProperty.name}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                    Relationship Type
                  </label>
                  <select
                    value={newOwnershipType}
                    onChange={(e) => setNewOwnershipType(e.target.value as any)}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="TENANT">Tenant</option>
                    <option value="OWNER">Owner</option>
                    <option value="PROPERTY_MANAGER">Property Manager</option>
                    <option value="AUTHORIZED_CONTACT">Authorized Contact</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProperty(false);
                      setPropertySearch('');
                      setSelectedNewProperty(null);
                    }}
                    className="flex-1 py-2 px-4 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPropertyLink}
                    disabled={!selectedNewProperty}
                    className="flex-1 py-2 px-4 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    Add & Select
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Issue Details */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
              Step 3: Issue Details
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
              Describe the issue for {selectedCustomerProperty?.property.name}
            </p>

            <div className="space-y-6">
              {/* Complaint Type */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Complaint Type *
                </label>
                <select
                  value={selectedComplaintTypeId}
                  onChange={(e) => setSelectedComplaintTypeId(e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select complaint type...</option>
                  {complaintTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Request Type (optional) */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Request Type
                </label>
                <select
                  value={selectedRequestTypeId}
                  onChange={(e) => setSelectedRequestTypeId(e.target.value)}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select request type (optional)...</option>
                  {requestTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the issue..."
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Detailed description of the issue..."
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 px-4 py-3 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                  Priority
                </label>
                <div className="flex gap-3">
                  {(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                        priority === p
                          ? p === 'LOW'
                            ? 'bg-gray-500 text-white'
                            : p === 'MEDIUM'
                            ? 'bg-yellow-500 text-white'
                            : p === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Submit */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white mb-4">
              Step 4: Review & Submit
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
              Please review the details before submitting
            </p>

            <div className="space-y-4">
              {/* Customer Summary */}
              <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-900">
                <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">Customer</h3>
                <p className="font-medium text-dark-800 dark:text-white">
                  {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                </p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  {selectedCustomer?.phone || selectedCustomer?.email || 'No contact info'}
                </p>
              </div>

              {/* Property Summary */}
              <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-900">
                <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">Property</h3>
                <p className="font-medium text-dark-800 dark:text-white">
                  {selectedCustomerProperty?.property.address || selectedCustomerProperty?.property.name}
                </p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  {formatOwnershipType(selectedCustomerProperty?.ownershipType || '')}
                </p>
              </div>

              {/* Issue Summary */}
              <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-900">
                <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-2">Issue Details</h3>
                <p className="font-medium text-dark-800 dark:text-white">{title}</p>
                {description && (
                  <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">{description}</p>
                )}
                <div className="flex gap-4 mt-2">
                  <span className="text-sm text-dark-500 dark:text-dark-400">
                    Type: <span className="text-dark-700 dark:text-dark-300">
                      {complaintTypes.find(t => t.id === selectedComplaintTypeId)?.name}
                    </span>
                  </span>
                  <span className={`text-sm font-medium ${
                    priority === 'LOW' ? 'text-gray-600' :
                    priority === 'MEDIUM' ? 'text-yellow-600' :
                    priority === 'HIGH' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    Priority: {priority}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex gap-4 justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-xl border border-dark-200 dark:border-dark-600 px-6 py-3 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
        >
          Back
        </button>

        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="rounded-xl bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-green-500 px-6 py-3 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        )}
      </div>

      {/* Add New Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddCustomer(false)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Add New Customer
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                Create a new customer to proceed with the service request
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.firstName}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, firstName: e.target.value })
                    }
                    placeholder="John"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.lastName}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, lastName: e.target.value })
                    }
                    placeholder="Doe"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Phone Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={newCustomerForm.countryCode}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, countryCode: e.target.value })
                    }
                    className="w-28 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="+973">+973</option>
                    <option value="+966">+966</option>
                    <option value="+971">+971</option>
                    <option value="+974">+974</option>
                    <option value="+965">+965</option>
                    <option value="+968">+968</option>
                    <option value="+91">+91</option>
                    <option value="+92">+92</option>
                    <option value="+63">+63</option>
                  </select>
                  <input
                    type="tel"
                    value={newCustomerForm.phoneNumber}
                    onChange={(e) =>
                      setNewCustomerForm({
                        ...newCustomerForm,
                        phoneNumber: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="34556622"
                    className="flex-1 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Field (Optional) */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Email <span className="text-dark-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false);
                    setNewCustomerForm({
                      firstName: '',
                      lastName: '',
                      countryCode: '+973',
                      phoneNumber: '',
                      email: '',
                    });
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={isCreatingCustomer || !newCustomerForm.firstName || !newCustomerForm.lastName || !newCustomerForm.phoneNumber}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isCreatingCustomer ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Property Modal */}
      {showCreateProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Create New Property
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                Enter the property address details
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Location Fields - Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Flat Number <span className="text-dark-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newPropertyForm.flatNumber}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, flatNumber: e.target.value })
                    }
                    placeholder="e.g., 0084"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Building Number *
                  </label>
                  <input
                    type="text"
                    value={newPropertyForm.buildingNumber}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, buildingNumber: e.target.value })
                    }
                    placeholder="e.g., 1844"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Location Fields - Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Road Number *
                  </label>
                  <input
                    type="text"
                    value={newPropertyForm.roadNumber}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, roadNumber: e.target.value })
                    }
                    placeholder="e.g., 1121"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Block Number *
                  </label>
                  <input
                    type="text"
                    value={newPropertyForm.blockNumber}
                    onChange={(e) =>
                      setNewPropertyForm({ ...newPropertyForm, blockNumber: e.target.value })
                    }
                    placeholder="e.g., 0111"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Property Type *
                </label>
                <select
                  value={newPropertyForm.typeId}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, typeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Governorate Filter */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Governorate <span className="text-dark-400">(filter areas)</span>
                </label>
                <select
                  value={selectedGovernorate}
                  onChange={(e) => {
                    setSelectedGovernorate(e.target.value);
                    setNewPropertyForm({ ...newPropertyForm, areaId: '' });
                    setAreaSearch('');
                  }}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">All Governorates</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {gov.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Selection */}
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Area
                </label>
                <select
                  value={newPropertyForm.areaId}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, areaId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select Area</option>
                  {zones
                    .filter(zone => !selectedGovernorate || zone.governorateId === selectedGovernorate)
                    .map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Preview */}
              {(newPropertyForm.buildingNumber || newPropertyForm.flatNumber) && (
                <div className="p-3 bg-dark-50 dark:bg-dark-900 rounded-lg">
                  <p className="text-xs text-dark-500 dark:text-dark-400 mb-1">Address Preview:</p>
                  <p className="text-sm font-medium text-dark-800 dark:text-white">
                    {[
                      newPropertyForm.flatNumber && `Flat ${newPropertyForm.flatNumber}`,
                      newPropertyForm.buildingNumber && `Building ${newPropertyForm.buildingNumber}`,
                      newPropertyForm.roadNumber && `Road ${newPropertyForm.roadNumber}`,
                      newPropertyForm.blockNumber && `Block ${newPropertyForm.blockNumber}`,
                      zones.find(z => z.id === newPropertyForm.areaId)?.name,
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProperty(false);
                    setSelectedGovernorate('');
                    setAreaSearch('');
                    setNewPropertyForm({
                      flatNumber: '',
                      buildingNumber: '',
                      roadNumber: '',
                      blockNumber: '',
                      areaId: '',
                      typeId: '',
                    });
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateProperty}
                  disabled={isCreatingProperty || !newPropertyForm.buildingNumber || !newPropertyForm.roadNumber || !newPropertyForm.blockNumber || !newPropertyForm.typeId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isCreatingProperty ? 'Creating...' : 'Create Property'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
