'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Building {
  id: string;
  buildingNumber: string;
  name: string;
  nameAr?: string;
  blockNumber: string;
  roadNumber: string;
  zoneId?: string;
  zone?: { name: string; nameAr?: string };
  type?: { name: string; nameAr?: string };
  totalUnits: number;
  isActive: boolean;
  createdAt: string;
  _count?: { units: number };
}

// Flattened property (building/unit) from the API
interface Property {
  id: string;
  type: 'building' | 'unit';
  unitNo: string | null;
  flatNumber: string | null;
  buildingId: string;
  buildingNumber: string;
  roadNumber: string;
  blockNumber: string;
  buildingName: string | null;
  zoneName: string | null;
  unitType: string;
  unitTypeAr?: string;
  address: string;
}

interface Zone {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  governorate?: { name: string; nameAr?: string };
  _count?: { blocks: number; employees: number };
}

interface BuildingType {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

interface UnitType {
  id: string;
  name: string;
  nameAr?: string;
  isActive: boolean;
}

type Tab = 'buildings' | 'zones' | 'settings';

export default function PropertiesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('buildings');
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Multi-field search filters
  const [filters, setFilters] = useState({
    unit: '',
    building: '',
    road: '',
    block: '',
  });
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showBulkUnits, setShowBulkUnits] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Building form state - ordered by importance: building number, road, block, then optional fields
  const [buildingForm, setBuildingForm] = useState({
    buildingNumber: '', // Primary identifier - required
    roadNumber: '', // Required
    blockNumber: '', // Required
    name: '', // Optional - not all buildings have names
    nameAr: '',
    zoneId: '',
    typeId: '',
    totalFloors: 1,
    address: '',
    addressAr: '',
    latitude: '',
    longitude: '',
    googleMapId: '',
    landmark: '',
  });

  // Bulk units form state
  const [bulkUnitsForm, setBulkUnitsForm] = useState({
    fromFlat: 1,
    toFlat: 10,
    suffixes: '',
    unitTypeId: '',
  });

  useEffect(() => {
    if (activeTab === 'buildings') {
      fetchProperties();
    } else if (activeTab === 'zones') {
      fetchZones();
    } else if (activeTab === 'settings') {
      fetchBuildingTypes();
      fetchUnitTypes();
    }
  }, [activeTab, page]);

  useEffect(() => {
    // Pre-fetch zones and types for forms
    const loadFormData = async () => {
      await Promise.all([
        fetchZones(),
        fetchBuildingTypes(),
        fetchUnitTypes(),
      ]);
    };
    loadFormData();
  }, []);

  async function fetchProperties() {
    setIsLoading(true);
    try {
      // Build query params from filters - use the new /buildings/properties endpoint
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (filters.unit) params.append('unit', filters.unit);
      if (filters.building) params.append('building', filters.building);
      if (filters.road) params.append('road', filters.road);
      if (filters.block) params.append('block', filters.block);

      const data = await api.get<{ success: boolean; data: Property[]; pagination?: { total: number; totalPages: number } }>(
        `/buildings/properties?${params.toString()}`
      );

      if (data.success) {
        setProperties(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Keep for building operations (add building, bulk units)
  async function fetchBuildings() {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '20');
      if (filters.building) params.append('buildingNumber', filters.building);
      if (filters.road) params.append('roadNumber', filters.road);
      if (filters.block) params.append('blockNumber', filters.block);

      const data = await api.get<{ success: boolean; data: Building[]; pagination?: { total: number } }>(
        `/buildings?${params.toString()}`
      );

      if (data.success) {
        setBuildings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
    }
  }

  // Format address like reference: "Building X, Road Y, AREA / Block Z"
  function formatAddress(building: Building): string {
    const parts = [];
    parts.push(`Building ${building.buildingNumber}`);
    parts.push(`Road ${building.roadNumber}`);
    if (building.zone?.name) {
      parts.push(`${building.zone.name} / Block ${building.blockNumber}`);
    } else {
      parts.push(`Block ${building.blockNumber}`);
    }
    return parts.join(', ');
  }

  // Handle search with filters
  function handleSearch() {
    setPage(1);
    fetchProperties();
  }

  // Clear all filters
  function clearFilters() {
    setFilters({ unit: '', building: '', road: '', block: '' });
    setPage(1);
    // Trigger refetch with cleared filters
    setTimeout(() => fetchProperties(), 0);
  }

  async function fetchZones() {
    try {
      const data = await api.get<{ success: boolean; data: Zone[]; error?: { message: string }; message?: string }>(
        `/zones?limit=100`
      );
      if (data.success) {
        setZones(data.data);
        console.log('Zones loaded:', data.data.length);
      } else {
        console.error('Failed to fetch zones:', data.error?.message || data.message);
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    }
  }

  async function fetchBuildingTypes() {
    try {
      const data = await api.get<{ success: boolean; data: BuildingType[]; error?: { message: string }; message?: string }>(
        `/building-types?limit=100`
      );
      if (data.success) {
        setBuildingTypes(data.data);
        console.log('Building types loaded:', data.data.length);
      } else {
        console.error('Failed to fetch building types:', data.error?.message || data.message);
      }
    } catch (error) {
      console.error('Failed to fetch building types:', error);
    }
  }

  async function fetchUnitTypes() {
    try {
      const data = await api.get<{ success: boolean; data: UnitType[]; error?: { message: string }; message?: string }>(
        `/unit-types?limit=100`
      );
      if (data.success) {
        setUnitTypes(data.data);
        console.log('Unit types loaded:', data.data.length);
      } else {
        console.error('Failed to fetch unit types:', data.error?.message || data.message);
      }
    } catch (error) {
      console.error('Failed to fetch unit types:', error);
    }
  }

  async function handleCreateBuilding(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await api.post<{ success: boolean; message?: string }>(
        '/buildings',
        {
          ...buildingForm,
          totalFloors: Number(buildingForm.totalFloors),
          latitude: buildingForm.latitude ? Number(buildingForm.latitude) : undefined,
          longitude: buildingForm.longitude ? Number(buildingForm.longitude) : undefined,
        }
      );
      if (data.success) {
        setShowAddBuilding(false);
        setBuildingForm({
          buildingNumber: '',
          roadNumber: '',
          blockNumber: '',
          name: '',
          nameAr: '',
          zoneId: '',
          typeId: '',
          totalFloors: 1,
          address: '',
          addressAr: '',
          latitude: '',
          longitude: '',
          googleMapId: '',
          landmark: '',
        });
        fetchBuildings();
      } else {
        alert(data.message || 'Failed to create building');
      }
    } catch (error: unknown) {
      console.error('Failed to create building:', error);
      alert(error instanceof Error ? error.message : 'Failed to create building');
    }
  }

  async function handleBulkCreateUnits(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBuilding) return;

    try {
      const suffixes = bulkUnitsForm.suffixes
        ? bulkUnitsForm.suffixes.split(',').map((s) => s.trim())
        : undefined;

      const data = await api.post<{ success: boolean; data?: { created: number }; message?: string }>(
        `/buildings/${selectedBuilding.id}/units/bulk`,
        {
          fromFlat: Number(bulkUnitsForm.fromFlat),
          toFlat: Number(bulkUnitsForm.toFlat),
          suffixes,
          typeId: bulkUnitsForm.unitTypeId || undefined,
        }
      );
      if (data.success) {
        setShowBulkUnits(false);
        setBulkUnitsForm({
          fromFlat: 1,
          toFlat: 10,
          suffixes: '',
          unitTypeId: '',
        });
        setSelectedBuilding(null);
        fetchBuildings();
        alert(`Successfully created ${data.data?.created} units!`);
      } else {
        alert(data.message || 'Failed to create units');
      }
    } catch (error: unknown) {
      console.error('Failed to create units:', error);
      alert(error instanceof Error ? error.message : 'Failed to create units');
    }
  }

  const tabs = [
    { id: 'buildings' as Tab, label: 'Buildings', icon: BuildingIcon },
    { id: 'zones' as Tab, label: 'Zones & Areas', icon: MapIcon },
    { id: 'settings' as Tab, label: 'Types & Settings', icon: SettingsIcon },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Properties</h1>
        {activeTab === 'buildings' && (
          <button
            onClick={() => {
              // Ensure data is loaded when opening the modal
              fetchZones();
              fetchBuildingTypes();
              setShowAddBuilding(true);
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <PlusIcon />
            Add Building
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-dark-200 dark:border-dark-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-white'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buildings Tab */}
      {activeTab === 'buildings' && (
        <div>
          {/* 4-Field Search Filters */}
          <div className="mb-6 rounded-xl bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <SearchIcon />
              <span className="text-sm font-medium text-dark-600 dark:text-dark-300">Property Search</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Unit/Flat</label>
                <input
                  type="text"
                  placeholder="e.g., 109"
                  value={filters.unit}
                  onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-700 px-3 py-2 text-sm text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Building</label>
                <input
                  type="text"
                  placeholder="e.g., 1458"
                  value={filters.building}
                  onChange={(e) => setFilters({ ...filters, building: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-700 px-3 py-2 text-sm text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Road</label>
                <input
                  type="text"
                  placeholder="e.g., 3435"
                  value={filters.road}
                  onChange={(e) => setFilters({ ...filters, road: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-700 px-3 py-2 text-sm text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-500 dark:text-dark-400 mb-1">Block</label>
                <input
                  type="text"
                  placeholder="e.g., 334"
                  value={filters.block}
                  onChange={(e) => setFilters({ ...filters, block: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-700 px-3 py-2 text-sm text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSearch}
                className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Search
              </button>
              {(filters.unit || filters.building || filters.road || filters.block) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Properties Table - Flat list of units */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
            {isLoading ? (
              <div className="py-12 text-center text-dark-500">Loading...</div>
            ) : properties.length === 0 ? (
              <div className="py-12 text-center text-dark-500">
                No properties found. Add buildings and units to get started.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900 text-left text-sm text-dark-500 dark:text-dark-400">
                        <th className="px-6 py-4 font-medium">Address</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => (
                        <tr
                          key={property.id}
                          className="border-b border-dark-100 dark:border-dark-700 last:border-0 hover:bg-dark-50 dark:hover:bg-dark-700/50"
                        >
                          <td className="px-6 py-4">
                            <span className="text-dark-800 dark:text-white">
                              {property.type === 'unit' && property.flatNumber && `Flat ${property.flatNumber}, `}
                              Building {property.buildingNumber}, Road {property.roadNumber}, Block {property.blockNumber}
                              {property.zoneName && `, ${property.zoneName}`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              property.unitType === 'Compound Entrance'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                : property.unitType === 'Flat'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {property.unitType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/properties/buildings/${property.buildingId}`}
                                className="text-sm text-primary-500 hover:underline"
                              >
                                View Building
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-dark-100 dark:border-dark-700 px-6 py-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg px-4 py-2 text-sm hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-50 text-dark-700 dark:text-dark-300"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-dark-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg px-4 py-2 text-sm hover:bg-dark-100 dark:hover:bg-dark-700 disabled:opacity-50 text-dark-700 dark:text-dark-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
              Geographic Hierarchy
            </h2>
            <div className="flex gap-2">
              <Link
                href="/properties/zones/new"
                className="px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                + Add Zone
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-xl border border-dark-200 dark:border-dark-600 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-dark-800 dark:text-white">
                      {zone.name}
                    </h3>
                    {zone.nameAr && (
                      <p className="text-sm text-dark-500 dark:text-dark-400" dir="rtl">
                        {zone.nameAr}
                      </p>
                    )}
                    {zone.code && (
                      <p className="text-xs text-dark-400 mt-1">Code: {zone.code}</p>
                    )}
                  </div>
                  <Link
                    href={`/properties/zones/${zone.id}`}
                    className="text-sm text-primary-500 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-dark-500 dark:text-dark-400">
                  <span>{zone._count?.blocks || 0} blocks</span>
                  <span>{zone._count?.employees || 0} employees</span>
                </div>
              </div>
            ))}
          </div>

          {zones.length === 0 && (
            <div className="text-center py-12 text-dark-500">
              No zones configured. Add zones to organize your properties by area.
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Building Types */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
                Building Types
              </h2>
              <Link
                href="/properties/building-types/new"
                className="text-sm text-primary-500 hover:underline"
              >
                + Add Type
              </Link>
            </div>
            <div className="space-y-2">
              {buildingTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-700"
                >
                  <div>
                    <span className="text-dark-800 dark:text-white">{type.name}</span>
                    {type.nameAr && (
                      <span className="text-dark-500 dark:text-dark-400 ml-2">
                        ({type.nameAr})
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      type.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {type.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {buildingTypes.length === 0 && (
                <p className="text-dark-500 text-sm">No building types configured.</p>
              )}
            </div>
          </div>

          {/* Unit Types */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
                Unit Types
              </h2>
              <Link
                href="/properties/unit-types/new"
                className="text-sm text-primary-500 hover:underline"
              >
                + Add Type
              </Link>
            </div>
            <div className="space-y-2">
              {unitTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-50 dark:bg-dark-700"
                >
                  <div>
                    <span className="text-dark-800 dark:text-white">{type.name}</span>
                    {type.nameAr && (
                      <span className="text-dark-500 dark:text-dark-400 ml-2">
                        ({type.nameAr})
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      type.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {type.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
              {unitTypes.length === 0 && (
                <p className="text-dark-500 text-sm">No unit types configured.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      {showAddBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Add New Building
              </h3>
            </div>

            <form onSubmit={handleCreateBuilding} className="p-6 space-y-4">
              {/* Primary Location Fields - Required */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Building No *
                  </label>
                  <input
                    type="text"
                    value={buildingForm.buildingNumber}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, buildingNumber: e.target.value })
                    }
                    placeholder="e.g., 123"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Road No *
                  </label>
                  <input
                    type="text"
                    value={buildingForm.roadNumber}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, roadNumber: e.target.value })
                    }
                    placeholder="e.g., 4567"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Block No *
                  </label>
                  <input
                    type="text"
                    value={buildingForm.blockNumber}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, blockNumber: e.target.value })
                    }
                    placeholder="e.g., 345"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    value={buildingForm.totalFloors}
                    onChange={(e) =>
                      setBuildingForm({
                        ...buildingForm,
                        totalFloors: Number(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Building Name - Optional */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Building Name <span className="text-dark-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={buildingForm.name}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, name: e.target.value })
                    }
                    placeholder="e.g., Al Manar Tower"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Building Name (Arabic) <span className="text-dark-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={buildingForm.nameAr}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, nameAr: e.target.value })
                    }
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Area
                  </label>
                  <select
                    value={buildingForm.zoneId}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, zoneId: e.target.value })
                    }
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select Area</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Building Type
                  </label>
                  <select
                    value={buildingForm.typeId}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, typeId: e.target.value })
                    }
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    {buildingTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={buildingForm.address}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={buildingForm.latitude}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, latitude: e.target.value })
                    }
                    placeholder="e.g., 26.2285"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={buildingForm.longitude}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, longitude: e.target.value })
                    }
                    placeholder="e.g., 50.5860"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Google Map ID
                  </label>
                  <input
                    type="text"
                    value={buildingForm.googleMapId}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, googleMapId: e.target.value })
                    }
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={buildingForm.landmark}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, landmark: e.target.value })
                  }
                  placeholder="Near famous landmark..."
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBuilding(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
                >
                  Create Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Units Modal */}
      {showBulkUnits && selectedBuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Bulk Create Units
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                Creating units for: <span className="font-medium">{selectedBuilding.name}</span>
              </p>
            </div>

            <form onSubmit={handleBulkCreateUnits} className="p-6 space-y-4">
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 text-sm text-primary-700 dark:text-primary-300">
                <p className="font-medium mb-2">Quick Entry Example:</p>
                <p>
                  Flat 1 to 100 with suffixes A, B will create:
                  <br />
                  1A, 1B, 2A, 2B, ... 100A, 100B (200 units)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    From Flat Number *
                  </label>
                  <input
                    type="number"
                    value={bulkUnitsForm.fromFlat}
                    onChange={(e) =>
                      setBulkUnitsForm({
                        ...bulkUnitsForm,
                        fromFlat: Number(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    To Flat Number *
                  </label>
                  <input
                    type="number"
                    value={bulkUnitsForm.toFlat}
                    onChange={(e) =>
                      setBulkUnitsForm({
                        ...bulkUnitsForm,
                        toFlat: Number(e.target.value),
                      })
                    }
                    min={bulkUnitsForm.fromFlat}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Suffixes (optional)
                </label>
                <input
                  type="text"
                  value={bulkUnitsForm.suffixes}
                  onChange={(e) =>
                    setBulkUnitsForm({ ...bulkUnitsForm, suffixes: e.target.value })
                  }
                  placeholder="e.g., A, B, C (comma separated)"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
                <p className="text-xs text-dark-500 mt-1">
                  Leave empty for simple numbering (1, 2, 3...)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Unit Type
                </label>
                <select
                  value={bulkUnitsForm.unitTypeId}
                  onChange={(e) =>
                    setBulkUnitsForm({ ...bulkUnitsForm, unitTypeId: e.target.value })
                  }
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select Type</option>
                  {unitTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-dark-50 dark:bg-dark-700 rounded-xl p-4 text-center">
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  This will create approximately
                </p>
                <p className="text-2xl font-bold text-primary-500 mt-1">
                  {(bulkUnitsForm.toFlat - bulkUnitsForm.fromFlat + 1) *
                    (bulkUnitsForm.suffixes
                      ? bulkUnitsForm.suffixes.split(',').filter((s) => s.trim()).length
                      : 1)}{' '}
                  units
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUnits(false);
                    setSelectedBuilding(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600"
                >
                  Create Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function UnitIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}
