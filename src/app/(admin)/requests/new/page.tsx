'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button, AsyncSelect, AsyncSelectOption } from '@/components/ui';

interface ComplaintType {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  roomType?: { name: string };
}

interface Asset {
  id: string;
  name: string;
  assetTag?: string;
  assetType?: { name: string };
}

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);

  // Selected values
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [propertyId, setPropertyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [assetId, setAssetId] = useState('');

  // Initial options for pre-populated fields
  const [initialCustomer, setInitialCustomer] = useState<AsyncSelectOption | undefined>();
  const [initialProperty, setInitialProperty] = useState<AsyncSelectOption | undefined>();

  // Dependent data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Modal states
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [creatingProperty, setCreatingProperty] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+973', // Default to Bahrain
    phone: '',
    email: '',
  });

  // Common GCC country codes
  const countryCodes = [
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  ];

  // New property form
  const [newProperty, setNewProperty] = useState({
    buildingNumber: '',
    roadNumber: '',
    blockNumber: '',
    governorateId: '',
    zoneId: '',
    flatNumber: '', // optional
  });

  // Governorates and Zones for property creation
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([]);
  const [zones, setZones] = useState<{ id: string; name: string; governorateId?: string }[]>([]);
  const [filteredZones, setFilteredZones] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchDropdownData();

    const urlCustomerId = searchParams.get('customerId');
    if (urlCustomerId) {
      fetchCustomerById(urlCustomerId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (propertyId) {
      fetchRooms(propertyId);
    } else {
      setRooms([]);
      setRoomId('');
    }
    setAssets([]);
    setAssetId('');
  }, [propertyId]);

  useEffect(() => {
    if (propertyId) {
      fetchAssets(propertyId, roomId);
    } else {
      setAssets([]);
      setAssetId('');
    }
  }, [propertyId, roomId]);

  // Filter zones when governorate changes
  useEffect(() => {
    if (newProperty.governorateId) {
      const filtered = zones.filter(z => z.governorateId === newProperty.governorateId);
      setFilteredZones(filtered);
      // Reset zone if it doesn't belong to selected governorate
      if (newProperty.zoneId && !filtered.find(z => z.id === newProperty.zoneId)) {
        setNewProperty(prev => ({ ...prev, zoneId: '' }));
      }
    } else {
      setFilteredZones(zones);
    }
  }, [newProperty.governorateId, zones]);

  async function fetchCustomerById(id: string) {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:4001/api/v1/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const c = data.data;
        setInitialCustomer({
          value: c.id,
          label: `${c.firstName} ${c.lastName}`,
          sublabel: c.email || c.phone,
        });
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    }
  }

  async function fetchDropdownData() {
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [typesRes, zonesRes, governoratesRes] = await Promise.all([
        fetch('http://localhost:4001/api/v1/complaint-types', { headers }).catch(() => null),
        fetch('http://localhost:4001/api/v1/zones', { headers }).catch(() => null),
        fetch('http://localhost:4001/api/v1/governorates', { headers }).catch(() => null),
      ]);

      if (typesRes) {
        const typesData = await typesRes.json();
        if (typesData.success && typesData.data) {
          setComplaintTypes(typesData.data);
        }
      }

      if (zonesRes) {
        const zonesData = await zonesRes.json();
        if (zonesData.success) {
          setZones(zonesData.data);
          setFilteredZones(zonesData.data);
        }
      }

      if (governoratesRes) {
        const governoratesData = await governoratesRes.json();
        if (governoratesData.success) {
          setGovernorates(governoratesData.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  }

  async function fetchRooms(unitId: string) {
    setLoadingRooms(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:4001/api/v1/rooms?unitId=${unitId}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  }

  async function fetchAssets(unitId: string, selectedRoomId?: string) {
    setLoadingAssets(true);
    const token = localStorage.getItem('accessToken');
    try {
      let url = `http://localhost:4001/api/v1/assets?unitId=${unitId}&limit=100`;
      if (selectedRoomId) {
        url += `&roomId=${selectedRoomId}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  }

  const searchCustomers = useCallback(async (query: string): Promise<AsyncSelectOption[]> => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(
        `http://localhost:4001/api/v1/customers?search=${encodeURIComponent(query)}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.data) {
        return data.data.map((c: { id: string; firstName: string; lastName: string; email?: string; phone?: string }) => ({
          value: c.id,
          label: `${c.firstName} ${c.lastName}`,
          sublabel: c.email || c.phone,
        }));
      }
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
    return [];
  }, []);

  const searchProperties = useCallback(async (query: string): Promise<AsyncSelectOption[]> => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(
        `http://localhost:4001/api/v1/buildings/properties?building=${encodeURIComponent(query)}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success && data.data) {
        return data.data.map((p: {
          id: string;
          flatNumber?: string;
          buildingNumber: string;
          roadNumber: string;
          blockNumber: string;
          zoneName?: string;
          unitType: string;
        }) => ({
          value: p.id,
          label: p.flatNumber
            ? `Flat ${p.flatNumber}, Building ${p.buildingNumber}`
            : `Building ${p.buildingNumber}`,
          sublabel: `Road ${p.roadNumber}, Block ${p.blockNumber}${p.zoneName ? `, ${p.zoneName}` : ''} - ${p.unitType}`,
        }));
      }
    } catch (error) {
      console.error('Failed to search properties:', error);
    }
    return [];
  }, []);

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setCreatingCustomer(true);

    try {
      const token = localStorage.getItem('accessToken');
      // Combine country code and phone number
      const fullPhone = `${newCustomer.countryCode} ${newCustomer.phone}`;
      const res = await fetch('http://localhost:4001/api/v1/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: newCustomer.firstName,
          lastName: newCustomer.lastName,
          phone: fullPhone,
          email: newCustomer.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create customer');
      }

      // Set the new customer as selected
      const c = data.data;
      setCustomerId(c.id);
      setInitialCustomer({
        value: c.id,
        label: `${c.firstName} ${c.lastName}`,
        sublabel: c.email || c.phone,
      });

      toast.success('Customer created successfully!');
      setShowNewCustomerModal(false);
      setNewCustomer({ firstName: '', lastName: '', countryCode: '+973', phone: '', email: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function handleCreateProperty(e: React.FormEvent) {
    e.preventDefault();
    setCreatingProperty(true);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // First create the building
      const buildingRes = await fetch('http://localhost:4001/api/v1/buildings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          buildingNumber: newProperty.buildingNumber,
          roadNumber: newProperty.roadNumber,
          blockNumber: newProperty.blockNumber,
          zoneId: newProperty.zoneId,
          totalFloors: 1,
        }),
      });

      const buildingData = await buildingRes.json();

      if (!buildingRes.ok) {
        throw new Error(buildingData.error?.message || 'Failed to create building');
      }

      const building = buildingData.data;
      let selectedId = building.id;
      let label = `Building ${building.buildingNumber}`;

      // If flat number provided, create a unit
      if (newProperty.flatNumber) {
        const unitRes = await fetch('http://localhost:4001/api/v1/units', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            buildingId: building.id,
            flatNumber: newProperty.flatNumber,
            floor: 0,
          }),
        });

        const unitData = await unitRes.json();
        if (unitRes.ok && unitData.data) {
          selectedId = unitData.data.id;
          label = `Flat ${newProperty.flatNumber}, Building ${building.buildingNumber}`;
        }
      }

      // Set the new property as selected
      const zoneName = zones.find(z => z.id === newProperty.zoneId)?.name || '';
      setPropertyId(selectedId);
      setInitialProperty({
        value: selectedId,
        label,
        sublabel: `Road ${building.roadNumber}, Block ${building.blockNumber}${zoneName ? `, ${zoneName}` : ''}`,
      });

      toast.success('Property created successfully!');
      setShowNewPropertyModal(false);
      setNewProperty({ buildingNumber: '', roadNumber: '', blockNumber: '', governorateId: '', zoneId: '', flatNumber: '' });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setCreatingProperty(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    if (!customerId) {
      setError('Please select a customer');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.get('title') || 'Service Request',
          description: formData.get('description'),
          customerId: customerId,
          complaintTypeId: formData.get('complaintTypeId'),
          priority: formData.get('priority'),
          propertyId: propertyId || undefined,
          roomId: roomId || undefined,
          assetId: assetId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create request');
      }

      toast.success('Service request created!');
      router.push(`/requests/${data.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-dark-500 hover:text-dark-700 dark:text-dark-400 dark:hover:text-white">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">New Service Request</h1>
      </div>

      <div className="rounded-xl bg-white dark:bg-dark-800 p-8 shadow-sm border border-dark-100 dark:border-dark-700">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <div>
            <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
              Customer *
            </label>
            <AsyncSelect
              placeholder="Search by name, phone, or email..."
              onSearch={searchCustomers}
              onChange={(value) => setCustomerId(value)}
              initialOption={initialCustomer}
              required
              minSearchLength={2}
              onCreateNew={() => setShowNewCustomerModal(true)}
              createNewLabel="+ Add New Customer"
            />
          </div>

          {/* Property */}
          <div>
            <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
              Property
            </label>
            <AsyncSelect
              placeholder="Search by building number..."
              onSearch={searchProperties}
              onChange={(value) => setPropertyId(value)}
              initialOption={initialProperty}
              minSearchLength={1}
              onCreateNew={() => setShowNewPropertyModal(true)}
              createNewLabel="+ Add New Property"
            />
          </div>

          {/* Room */}
          {propertyId && (
            <div>
              <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                Room
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={loadingRooms}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">
                  {loadingRooms ? 'Loading rooms...' : rooms.length === 0 ? 'No rooms found' : 'Select a room (optional)'}
                </option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.roomType ? `(${room.roomType.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Asset */}
          {propertyId && (
            <div>
              <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
                Asset
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                disabled={loadingAssets}
                className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
              >
                <option value="">
                  {loadingAssets ? 'Loading assets...' : assets.length === 0 ? 'No assets found' : 'Select an asset (optional)'}
                </option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} {asset.assetTag ? `[${asset.assetTag}]` : ''} {asset.assetType ? `- ${asset.assetType.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Service Type */}
          <div>
            <label htmlFor="complaintTypeId" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
              Service Type *
            </label>
            <select
              id="complaintTypeId"
              name="complaintTypeId"
              required
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select a service type</option>
              {complaintTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Description */}
          <div>
            <label htmlFor="description" className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
              Issue Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Please describe the issue in detail..."
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="mb-2 block font-medium text-dark-700 dark:text-dark-300">
              Urgency *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'LOW', label: 'Low', desc: 'Can wait a few days', color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' },
                { value: 'MEDIUM', label: 'Medium', desc: '24-48 hours', color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' },
                { value: 'HIGH', label: 'High', desc: 'Same day', color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' },
                { value: 'URGENT', label: 'Urgent', desc: 'Emergency', color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${option.color}`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    defaultChecked={option.value === 'MEDIUM'}
                    className="w-4 h-4 text-primary-500"
                  />
                  <div>
                    <div className="font-medium text-dark-800 dark:text-white">{option.label}</div>
                    <div className="text-xs text-dark-500 dark:text-dark-400">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <input type="hidden" name="title" value="Service Request" />

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </form>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">Add New Customer</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">Quick add a new customer</p>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.firstName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                    required
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.lastName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                    required
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Phone *
                </label>
                <div className="flex gap-2">
                  <select
                    value={newCustomer.countryCode}
                    onChange={(e) => setNewCustomer({ ...newCustomer, countryCode: e.target.value })}
                    className="w-28 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-2 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none text-sm"
                  >
                    {countryCodes.map((cc) => (
                      <option key={cc.code} value={cc.code}>
                        {cc.flag} {cc.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                    placeholder="XXXX XXXX"
                    className="flex-1 rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCustomer}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {creatingCustomer ? 'Creating...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Property Modal */}
      {showNewPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">Add New Property</h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">Quick add a building or unit</p>
            </div>

            <form onSubmit={handleCreateProperty} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Building Number *
                  </label>
                  <input
                    type="text"
                    value={newProperty.buildingNumber}
                    onChange={(e) => setNewProperty({ ...newProperty, buildingNumber: e.target.value })}
                    required
                    placeholder="e.g., 1458"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Unit/Flat Number
                  </label>
                  <input
                    type="text"
                    value={newProperty.flatNumber}
                    onChange={(e) => setNewProperty({ ...newProperty, flatNumber: e.target.value })}
                    placeholder="e.g., 101 (optional)"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Road Number *
                  </label>
                  <input
                    type="text"
                    value={newProperty.roadNumber}
                    onChange={(e) => setNewProperty({ ...newProperty, roadNumber: e.target.value })}
                    required
                    placeholder="e.g., 3435"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Block Number *
                  </label>
                  <input
                    type="text"
                    value={newProperty.blockNumber}
                    onChange={(e) => setNewProperty({ ...newProperty, blockNumber: e.target.value })}
                    required
                    placeholder="e.g., 334"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Governorate *
                  </label>
                  <select
                    value={newProperty.governorateId}
                    onChange={(e) => setNewProperty({ ...newProperty, governorateId: e.target.value, zoneId: '' })}
                    required
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select Governorate</option>
                    {governorates.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Zone/Area *
                  </label>
                  <select
                    value={newProperty.zoneId}
                    onChange={(e) => setNewProperty({ ...newProperty, zoneId: e.target.value })}
                    required
                    disabled={!newProperty.governorateId}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">{newProperty.governorateId ? 'Select Zone/Area' : 'Select Governorate first'}</option>
                    {filteredZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPropertyModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProperty}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {creatingProperty ? 'Creating...' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
