'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface Unit {
  id: string;
  unitNo: string;
  flatNumber?: string;
  unitSuffix?: string;
  floor?: number;
  status: string;
  type?: { id: string; name: string; nameAr?: string };
  typeId?: string;
  isActive: boolean;
}

interface Building {
  id: string;
  buildingNumber: string;
  name: string;
  nameAr?: string;
  blockNumber: string;
  roadNumber: string;
  totalFloors: number;
  totalUnits: number;
  address?: string;
  addressAr?: string;
  latitude?: number;
  longitude?: number;
  googleMapId?: string;
  landmark?: string;
  isActive: boolean;
  zone?: { id: string; name: string; nameAr?: string };
  type?: { id: string; name: string; nameAr?: string };
  units: Unit[];
  createdAt: string;
  updatedAt: string;
}

interface UnitType {
  id: string;
  name: string;
  nameAr?: string;
}

// Floor display names
const FLOOR_NAMES: Record<number, string> = {
  [-2]: 'Basement 2',
  [-1]: 'Basement 1',
  [0]: 'Ground Floor',
  [1]: 'First Floor',
  [2]: 'Second Floor',
  [3]: 'Third Floor',
  [4]: 'Fourth Floor',
  [5]: 'Fifth Floor',
};

function getFloorName(floor: number): string {
  if (FLOOR_NAMES[floor]) return FLOOR_NAMES[floor];
  return `Floor ${floor}`;
}

// Common non-residential unit presets
const COMMON_PRESETS = [
  { name: 'Car Park', typeName: 'Car Park' },
  { name: 'Watchman Room', typeName: 'Watchman Room' },
  { name: 'Storage', typeName: 'Storage' },
  { name: 'Shop', typeName: 'Shop' },
  { name: 'Office', typeName: 'Office' },
];

export default function BuildingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);

  // Modal states
  const [showAddFloorUnits, setShowAddFloorUnits] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [showAddSingleUnit, setShowAddSingleUnit] = useState(false);

  // Add units form state
  const [addMode, setAddMode] = useState<'quick' | 'single'>('quick');
  const [quickAddForm, setQuickAddForm] = useState({
    fromFlat: '1',
    toFlat: '4',
    prefix: '', // e.g., "1" for 11, 12, 13 on floor 1
    unitTypeId: '',
    useFloorPrefix: true, // Auto-prefix with floor number
  });
  const [singleUnitForm, setSingleUnitForm] = useState({
    unitNo: '',
    flatNumber: '',
    unitTypeId: '',
  });

  // For editing/deleting
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBuilding();
    fetchUnitTypes();
  }, [params.id]);

  async function fetchBuilding() {
    try {
      const data = await api.get<{ success: boolean; data: Building }>(
        `/buildings/${params.id}`
      );
      if (data.success) {
        setBuilding(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch building:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUnitTypes() {
    try {
      const data = await api.get<{ success: boolean; data: UnitType[] }>(
        '/unit-types?limit=100'
      );
      if (data.success) {
        setUnitTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch unit types:', error);
    }
  }

  // Group units by floor
  const unitsByFloor = useMemo(() => {
    if (!building?.units) return new Map<number, Unit[]>();

    const grouped = new Map<number, Unit[]>();
    building.units.forEach((unit) => {
      const floor = unit.floor ?? 0;
      if (!grouped.has(floor)) {
        grouped.set(floor, []);
      }
      grouped.get(floor)!.push(unit);
    });

    // Sort units within each floor
    grouped.forEach((units) => {
      units.sort((a, b) => {
        // Sort by flatNumber first, then by unitNo
        const aNum = parseInt(a.flatNumber || a.unitNo) || 0;
        const bNum = parseInt(b.flatNumber || b.unitNo) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return (a.unitSuffix || '').localeCompare(b.unitSuffix || '');
      });
    });

    return grouped;
  }, [building?.units]);

  // Get all floor numbers (including empty ones up to totalFloors)
  const allFloors = useMemo(() => {
    const floors = new Set<number>();

    // Add existing floors from units
    unitsByFloor.forEach((_, floor) => floors.add(floor));

    // Add floors up to totalFloors (totalFloors=2 means GF(0) and FF(1))
    if (building?.totalFloors) {
      for (let i = 0; i < building.totalFloors; i++) {
        floors.add(i);
      }
    }

    // Sort descending (top floor first)
    return Array.from(floors).sort((a, b) => b - a);
  }, [unitsByFloor, building?.totalFloors]);

  function openAddUnitsModal(floor: number) {
    setSelectedFloor(floor);
    setAddMode('quick');

    // Smart defaults based on floor
    const floorPrefix = floor > 0 ? String(floor) : '';
    setQuickAddForm({
      fromFlat: '1',
      toFlat: '4',
      prefix: floorPrefix,
      unitTypeId: unitTypes.find((t) => t.name.toLowerCase() === 'flat')?.id || '',
      useFloorPrefix: floor > 0,
    });
    setSingleUnitForm({ unitNo: '', flatNumber: '', unitTypeId: '' });
    setShowAddFloorUnits(true);
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!building || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fromFlat = parseInt(quickAddForm.fromFlat);
      const toFlat = parseInt(quickAddForm.toFlat);
      const prefix = quickAddForm.useFloorPrefix && selectedFloor > 0
        ? String(selectedFloor)
        : quickAddForm.prefix;

      // Use the bulk create API endpoint
      const bulkData: {
        fromFlat: number;
        toFlat: number;
        floor?: number;
        typeId?: string;
        prefix?: string;
      } = {
        fromFlat,
        toFlat,
        floor: selectedFloor,
      };

      if (quickAddForm.unitTypeId) {
        bulkData.typeId = quickAddForm.unitTypeId;
      }

      // Add prefix if using custom or floor prefix
      if (prefix) {
        bulkData.prefix = prefix;
      }

      const result = await api.post<{ success: boolean; data: { created: number } }>(
        `/buildings/${building.id}/units/bulk`,
        bulkData
      );

      if (result.success && result.data.created > 0) {
        toast.success(`Successfully created ${result.data.created} units!`);
        fetchBuilding();
        setShowAddFloorUnits(false);
      } else {
        toast.error('No units were created. They may already exist.');
      }
    } catch (error: unknown) {
      console.error('Failed to create units:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create units');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddSingleUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!building || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use the units API endpoint with buildingId in body
      const unitData: {
        buildingId: string;
        flatNumber?: string;
        floor?: number;
        typeId?: string;
      } = {
        buildingId: building.id,
        floor: selectedFloor,
      };

      // Use flatNumber if provided, otherwise use unitNo for Flat-type units
      const flatType = unitTypes.find((t) => t.name.toLowerCase() === 'flat');
      const isFlat = singleUnitForm.unitTypeId === flatType?.id;

      if (singleUnitForm.flatNumber) {
        unitData.flatNumber = singleUnitForm.flatNumber;
      } else if (singleUnitForm.unitNo && isFlat) {
        // For Flat type, use unitNo as flatNumber if flatNumber not specified
        unitData.flatNumber = singleUnitForm.unitNo;
      }

      if (singleUnitForm.unitTypeId) {
        unitData.typeId = singleUnitForm.unitTypeId;
      }

      await api.post('/units', unitData);

      toast.success('Unit created successfully!');
      fetchBuilding();
      setShowAddFloorUnits(false);
    } catch (error: unknown) {
      console.error('Failed to create unit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create unit');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePresetClick(preset: { name: string; typeName: string }) {
    const type = unitTypes.find(
      (t) => t.name.toLowerCase() === preset.typeName.toLowerCase()
    );
    setSingleUnitForm({
      unitNo: preset.name,
      flatNumber: '',
      unitTypeId: type?.id || '',
    });
    setAddMode('single');
  }

  async function handleDeleteUnit() {
    if (!selectedUnit || !building || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Use the units API endpoint directly
      await api.delete(`/units/${selectedUnit.id}`);
      toast.success('Unit deleted successfully!');
      fetchBuilding();
      setShowDeleteConfirm(false);
      setSelectedUnit(null);
    } catch (error: unknown) {
      console.error('Failed to delete unit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete unit');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      VACANT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      OCCUPIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      RESERVED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  function getUnitIcon(unit: Unit) {
    const typeName = unit.type?.name?.toLowerCase() || '';
    if (typeName.includes('car') || typeName.includes('park')) return '🚗';
    if (typeName.includes('watch') || typeName.includes('security')) return '👮';
    if (typeName.includes('storage')) return '📦';
    if (typeName.includes('shop')) return '🏪';
    if (typeName.includes('office')) return '💼';
    return '🏠';
  }

  // Preview calculation for quick add
  const quickAddPreview = useMemo(() => {
    const from = parseInt(quickAddForm.fromFlat) || 1;
    const to = parseInt(quickAddForm.toFlat) || 1;
    const prefix = quickAddForm.useFloorPrefix && selectedFloor > 0
      ? String(selectedFloor)
      : quickAddForm.prefix;

    const count = Math.max(0, to - from + 1);
    const examples = [];
    for (let i = from; i <= Math.min(from + 2, to); i++) {
      examples.push(prefix ? `${prefix}${i}` : String(i));
    }
    if (to > from + 3) examples.push('...');
    if (to > from + 2) examples.push(prefix ? `${prefix}${to}` : String(to));

    return { count, examples: examples.join(', ') };
  }, [quickAddForm, selectedFloor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-dark-500">Loading...</div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-dark-500 mb-4">Building not found</div>
        <Link href="/properties" className="text-primary-500 hover:underline">
          Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">
            {building.name || `Building ${building.buildingNumber}`}
          </h1>
          <p className="text-dark-500 dark:text-dark-400">
            Building #{building.buildingNumber} • Block {building.blockNumber}, Road {building.roadNumber}
          </p>
        </div>
      </div>

      {/* Building Info Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Location Card */}
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Location</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-500 dark:text-dark-400">Block</span>
              <span className="font-medium text-dark-800 dark:text-white">{building.blockNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-500 dark:text-dark-400">Road</span>
              <span className="font-medium text-dark-800 dark:text-white">{building.roadNumber}</span>
            </div>
            {building.zone && (
              <div className="flex justify-between">
                <span className="text-dark-500 dark:text-dark-400">Zone</span>
                <span className="font-medium text-dark-800 dark:text-white">{building.zone.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
              <div className="text-2xl font-bold text-dark-800 dark:text-white">{building.totalFloors || 1}</div>
              <div className="text-xs text-dark-500">Floors</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
              <div className="text-2xl font-bold text-dark-800 dark:text-white">{building.units?.length || 0}</div>
              <div className="text-xs text-dark-500">Units</div>
            </div>
          </div>
        </div>

        {/* Unit Status Summary */}
        <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
          <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Unit Status</h3>
          <div className="space-y-2">
            {['VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'].map((status) => {
              const count = building.units?.filter((u) => u.status === status).length || 0;
              if (count === 0 && status !== 'VACANT') return null;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                    <span className="text-sm text-dark-600 dark:text-dark-400 capitalize">
                      {status.toLowerCase()}
                    </span>
                  </div>
                  <span className="font-medium text-dark-800 dark:text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floor-by-Floor View */}
      <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
        <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
            Floor Layout
          </h2>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
            Click on any floor to add units. Click on a unit to view or edit.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {allFloors.map((floor) => {
            const units = unitsByFloor.get(floor) || [];
            return (
              <div
                key={floor}
                className="border border-dark-200 dark:border-dark-600 rounded-xl overflow-hidden"
              >
                {/* Floor Header */}
                <div className="bg-dark-50 dark:bg-dark-700 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-dark-800 dark:text-white">
                      {getFloorName(floor)}
                    </span>
                    <span className="text-sm text-dark-500 dark:text-dark-400">
                      ({units.length} {units.length === 1 ? 'unit' : 'units'})
                    </span>
                  </div>
                  <button
                    onClick={() => openAddUnitsModal(floor)}
                    className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>

                {/* Units on this floor */}
                <div className="p-4">
                  {units.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {units.map((unit) => (
                        <Link
                          key={unit.id}
                          href={`/properties/units/${unit.id}`}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${getStatusColor(unit.status)}`}
                          title={`${unit.unitNo} - ${unit.status}${unit.type ? ` (${unit.type.name})` : ''}`}
                        >
                          <span className="mr-1">{getUnitIcon(unit)}</span>
                          {unit.unitNo}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-dark-400 dark:text-dark-500">
                      <span className="text-sm">No units on this floor.</span>
                      <button
                        onClick={() => openAddUnitsModal(floor)}
                        className="ml-2 text-primary-500 hover:underline text-sm"
                      >
                        Add units
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add new floor button if beyond current floors */}
          {allFloors.length === 0 && (
            <div className="text-center py-8">
              <p className="text-dark-500 dark:text-dark-400 mb-4">
                No floors configured yet. Start by adding units to a floor.
              </p>
              <button
                onClick={() => openAddUnitsModal(0)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Add Units to Ground Floor
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-4 border-t border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900/50">
          <div className="flex flex-wrap gap-6">
            {[
              { status: 'VACANT', label: 'Vacant', color: 'bg-green-100' },
              { status: 'OCCUPIED', label: 'Occupied', color: 'bg-blue-100' },
              { status: 'MAINTENANCE', label: 'Maintenance', color: 'bg-yellow-100' },
              { status: 'RESERVED', label: 'Reserved', color: 'bg-purple-100' },
            ].map(({ status, label, color }) => (
              <div key={status} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-dark-600 dark:text-dark-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Units Modal */}
      {showAddFloorUnits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddFloorUnits(false)}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700 z-10">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Add Units to {getFloorName(selectedFloor)}
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                {building.name || `Building ${building.buildingNumber}`}
              </p>
            </div>

            <div className="p-6">
              {/* Mode Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setAddMode('quick')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    addMode === 'quick'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-600'
                  }`}
                >
                  ⚡ Quick Add Flats
                </button>
                <button
                  onClick={() => setAddMode('single')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    addMode === 'single'
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-600'
                  }`}
                >
                  📝 Single Unit
                </button>
              </div>

              {addMode === 'quick' ? (
                <form onSubmit={handleQuickAdd} className="space-y-4">
                  {/* Quick Add Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                        From Flat
                      </label>
                      <input
                        type="number"
                        value={quickAddForm.fromFlat}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, fromFlat: e.target.value })}
                        min="1"
                        className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                        To Flat
                      </label>
                      <input
                        type="number"
                        value={quickAddForm.toFlat}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, toFlat: e.target.value })}
                        min={quickAddForm.fromFlat}
                        className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {selectedFloor > 0 && (
                    <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-50 dark:bg-dark-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quickAddForm.useFloorPrefix}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, useFloorPrefix: e.target.checked })}
                        className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                          Use floor prefix
                        </span>
                        <p className="text-xs text-dark-500 dark:text-dark-400">
                          E.g., Floor 1 → Flat 11, 12, 13...
                        </p>
                      </div>
                    </label>
                  )}

                  {!quickAddForm.useFloorPrefix && (
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                        Custom Prefix (optional)
                      </label>
                      <input
                        type="text"
                        value={quickAddForm.prefix}
                        onChange={(e) => setQuickAddForm({ ...quickAddForm, prefix: e.target.value })}
                        placeholder="e.g., A, 10, etc."
                        className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      Unit Type
                    </label>
                    <select
                      value={quickAddForm.unitTypeId}
                      onChange={(e) => setQuickAddForm({ ...quickAddForm, unitTypeId: e.target.value })}
                      className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Select type (optional)</option>
                      {unitTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 p-4">
                    <div className="text-center">
                      <span className="text-sm text-primary-700 dark:text-primary-300">
                        Will create
                      </span>
                      <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 my-1">
                        {quickAddPreview.count} flats
                      </div>
                      <div className="text-sm text-primary-600 dark:text-primary-400">
                        {quickAddPreview.examples}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddFloorUnits(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Flats'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddSingleUnit} className="space-y-4">
                  {/* Common Presets */}
                  <div>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                      Quick Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handlePresetClick(preset)}
                          className="px-3 py-1.5 rounded-lg text-sm bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dark-200 dark:border-dark-600 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                        Unit Name / Number *
                      </label>
                      <input
                        type="text"
                        value={singleUnitForm.unitNo}
                        onChange={(e) => setSingleUnitForm({ ...singleUnitForm, unitNo: e.target.value })}
                        placeholder="e.g., Car Park, Flat 1, Shop A"
                        className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                        Flat Number (optional)
                      </label>
                      <input
                        type="text"
                        value={singleUnitForm.flatNumber}
                        onChange={(e) => setSingleUnitForm({ ...singleUnitForm, flatNumber: e.target.value })}
                        placeholder="e.g., 1, 11, 21A"
                        className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                      />
                      <p className="text-xs text-dark-500 mt-1">
                        Leave empty for non-residential units like Car Park, Storage
                      </p>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                        Unit Type
                      </label>
                      <select
                        value={singleUnitForm.unitTypeId}
                        onChange={(e) => setSingleUnitForm({ ...singleUnitForm, unitTypeId: e.target.value })}
                        className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="">Select type (optional)</option>
                        {unitTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddFloorUnits(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !singleUnitForm.unitNo}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Unit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setSelectedUnit(null);
            }}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-2">
              Delete Unit?
            </h3>
            <p className="text-dark-500 dark:text-dark-400 mb-6">
              Are you sure you want to delete <strong>{selectedUnit.unitNo}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUnit(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUnit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
