'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface RoomType {
  id: string;
  name: string;
  nameAr?: string;
  icon?: string;
}

interface AssetType {
  id: string;
  name: string;
  nameAr?: string;
  category: string;
  icon?: string;
}

interface Asset {
  id: string;
  assetNo: string;
  name?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  status: string;
  condition: string;
  room?: { id: string; name: string };
  type?: { id: string; name: string; category: string; icon?: string };
}

interface Room {
  id: string;
  name: string;
  nameAr?: string;
  floor?: string;
  hasAttachedBathroom: boolean;
  areaSqm?: number;
  isActive: boolean;
  type?: RoomType;
  typeId?: string;
  _count?: {
    assets: number;
  };
}

interface Unit {
  id: string;
  unitNo: string;
  flatNumber?: string;
  unitSuffix?: string;
  floor?: number;
  status: string;
  isActive: boolean;
  areaSqm?: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  type?: { id: string; name: string; nameAr?: string };
  building?: {
    id: string;
    name: string;
    buildingNumber: string;
    block?: {
      blockNo: string;
      zone?: { name: string };
    };
    road?: { roadNo: string };
  };
  rooms: Room[];
  assets: { id: string; name: string; type?: { name: string } }[];
  customers: {
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }[];
  _count: {
    serviceRequests: number;
    rooms: number;
    assets: number;
  };
}

// Room icons based on type
const ROOM_ICONS: Record<string, string> = {
  'living room': '🛋️',
  'bedroom': '🛏️',
  'master bedroom': '🛏️',
  'bathroom': '🚿',
  'kitchen': '🍳',
  'dining room': '🍽️',
  'balcony': '🌅',
  'store room': '📦',
  'maid room': '🧹',
  'laundry': '🧺',
  'garage': '🚗',
  'default': '🚪',
};

function getRoomIcon(typeName?: string): string {
  if (!typeName) return ROOM_ICONS.default;
  const key = typeName.toLowerCase();
  return ROOM_ICONS[key] || ROOM_ICONS.default;
}

// Floor names
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

// Asset category icons
const CATEGORY_ICONS: Record<string, string> = {
  'HVAC': '❄️',
  'ELECTRICAL': '⚡',
  'PLUMBING': '🚿',
  'FIRE_SAFETY': '🔥',
  'SECURITY': '🔒',
  'ELEVATOR': '🛗',
  'APPLIANCES': '🏠',
  'FURNITURE': '🛋️',
  'ENTERTAINMENT': '📺',
  'GYM_EQUIPMENT': '🏋️',
  'POOL_EQUIPMENT': '🏊',
  'OTHER': '📦',
};

function getCategoryIcon(category?: string): string {
  if (!category) return CATEGORY_ICONS.OTHER;
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.OTHER;
}

const CONDITION_COLORS: Record<string, string> = {
  'EXCELLENT': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'GOOD': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'FAIR': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'POOR': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'CRITICAL': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'INACTIVE': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'MAINTENANCE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'REPLACED': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'DISPOSED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

type TabType = 'overview' | 'rooms' | 'assets';

export default function UnitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Room modal states
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showBulkAddRoom, setShowBulkAddRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Room form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    nameAr: '',
    typeId: '',
    floor: '',
    hasAttachedBathroom: false,
    areaSqm: '',
  });

  // Asset modal states
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showEditAsset, setShowEditAsset] = useState(false);
  const [showDeleteAssetConfirm, setShowDeleteAssetConfirm] = useState(false);

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    typeId: '',
    roomId: '',
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    status: 'ACTIVE',
    condition: 'GOOD',
  });

  // Unit status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchUnit();
    fetchRoomTypes();
  }, [params.id]);

  useEffect(() => {
    if (activeTab === 'assets') {
      fetchAssetTypes();
      fetchAssets();
    }
  }, [activeTab, params.id]);

  async function fetchUnit() {
    try {
      const data = await api.get<{ success: boolean; data: Unit }>(
        `/units/${params.id}`
      );
      if (data.success) {
        setUnit(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch unit:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRoomTypes() {
    try {
      const data = await api.get<{ success: boolean; data: RoomType[] }>(
        '/room-types?limit=100'
      );
      if (data.success) {
        setRoomTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch room types:', error);
    }
  }

  async function fetchAssetTypes() {
    try {
      const data = await api.get<{ success: boolean; data: AssetType[] }>(
        '/asset-types?limit=100'
      );
      if (data.success) {
        setAssetTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch asset types:', error);
    }
  }

  async function fetchAssets() {
    try {
      const data = await api.get<{ success: boolean; data: Asset[] }>(
        `/assets?unitId=${params.id}&limit=100`
      );
      if (data.success) {
        setAssets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  }

  function openAddRoomModal() {
    setRoomForm({
      name: '',
      nameAr: '',
      typeId: '',
      floor: '',
      hasAttachedBathroom: false,
      areaSqm: '',
    });
    setShowAddRoom(true);
  }

  function openEditRoomModal(room: Room) {
    setSelectedRoom(room);
    setRoomForm({
      name: room.name,
      nameAr: room.nameAr || '',
      typeId: room.typeId || '',
      floor: room.floor || '',
      hasAttachedBathroom: room.hasAttachedBathroom,
      areaSqm: room.areaSqm?.toString() || '',
    });
    setShowEditRoom(true);
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!unit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const roomData: {
        unitId: string;
        name: string;
        nameAr?: string;
        typeId?: string;
        floor?: string;
        hasAttachedBathroom: boolean;
        areaSqm?: number;
      } = {
        unitId: unit.id,
        name: roomForm.name,
        hasAttachedBathroom: roomForm.hasAttachedBathroom,
      };

      if (roomForm.nameAr) roomData.nameAr = roomForm.nameAr;
      if (roomForm.typeId) roomData.typeId = roomForm.typeId;
      if (roomForm.floor) roomData.floor = roomForm.floor;
      if (roomForm.areaSqm) roomData.areaSqm = parseFloat(roomForm.areaSqm);

      await api.post('/rooms', roomData);
      await fetchUnit();
      setShowAddRoom(false);
    } catch (error: unknown) {
      console.error('Failed to create room:', error);
      alert(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const roomData: {
        name?: string;
        nameAr?: string;
        typeId?: string;
        floor?: string;
        hasAttachedBathroom?: boolean;
        areaSqm?: number;
      } = {};

      if (roomForm.name !== selectedRoom.name) roomData.name = roomForm.name;
      if (roomForm.nameAr !== (selectedRoom.nameAr || '')) roomData.nameAr = roomForm.nameAr;
      if (roomForm.typeId !== (selectedRoom.typeId || '')) roomData.typeId = roomForm.typeId || undefined;
      if (roomForm.floor !== (selectedRoom.floor || '')) roomData.floor = roomForm.floor;
      if (roomForm.hasAttachedBathroom !== selectedRoom.hasAttachedBathroom) roomData.hasAttachedBathroom = roomForm.hasAttachedBathroom;
      if (roomForm.areaSqm !== (selectedRoom.areaSqm?.toString() || '')) roomData.areaSqm = roomForm.areaSqm ? parseFloat(roomForm.areaSqm) : undefined;

      await api.put(`/rooms/${selectedRoom.id}`, roomData);
      await fetchUnit();
      setShowEditRoom(false);
      setSelectedRoom(null);
    } catch (error: unknown) {
      console.error('Failed to update room:', error);
      alert(error instanceof Error ? error.message : 'Failed to update room');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRoom() {
    if (!selectedRoom || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/rooms/${selectedRoom.id}`);
      await fetchUnit();
      setShowDeleteConfirm(false);
      setSelectedRoom(null);
    } catch (error: unknown) {
      console.error('Failed to delete room:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete room');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleQuickAddRoom(typeId: string, typeName: string) {
    const type = roomTypes.find(t => t.id === typeId);
    setRoomForm({
      name: typeName,
      nameAr: '',
      typeId: typeId,
      floor: '',
      hasAttachedBathroom: typeName.toLowerCase().includes('master') || typeName.toLowerCase().includes('bedroom'),
      areaSqm: '',
    });
    setShowAddRoom(true);
  }

  // Asset handlers
  function openAddAssetModal() {
    setAssetForm({
      typeId: '',
      roomId: '',
      name: '',
      brand: '',
      model: '',
      serialNumber: '',
      status: 'ACTIVE',
      condition: 'GOOD',
    });
    setShowAddAsset(true);
  }

  function openEditAssetModal(asset: Asset) {
    setSelectedAsset(asset);
    setAssetForm({
      typeId: asset.type?.id || '',
      roomId: asset.room?.id || '',
      name: asset.name || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      status: asset.status,
      condition: asset.condition,
    });
    setShowEditAsset(true);
  }

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!unit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const assetData: {
        unitId: string;
        typeId: string;
        roomId?: string;
        name?: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
        status: string;
        condition: string;
      } = {
        unitId: unit.id,
        typeId: assetForm.typeId,
        status: assetForm.status,
        condition: assetForm.condition,
      };

      if (assetForm.roomId) assetData.roomId = assetForm.roomId;
      if (assetForm.name) assetData.name = assetForm.name;
      if (assetForm.brand) assetData.brand = assetForm.brand;
      if (assetForm.model) assetData.model = assetForm.model;
      if (assetForm.serialNumber) assetData.serialNumber = assetForm.serialNumber;

      await api.post('/assets', assetData);
      await fetchAssets();
      await fetchUnit();
      setShowAddAsset(false);
    } catch (error: unknown) {
      console.error('Failed to create asset:', error);
      alert(error instanceof Error ? error.message : 'Failed to create asset');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAsset || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const assetData: {
        typeId?: string;
        roomId?: string | null;
        name?: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
        status?: string;
        condition?: string;
      } = {};

      if (assetForm.typeId !== (selectedAsset.type?.id || '')) assetData.typeId = assetForm.typeId;
      if (assetForm.roomId !== (selectedAsset.room?.id || '')) assetData.roomId = assetForm.roomId || null;
      if (assetForm.name !== (selectedAsset.name || '')) assetData.name = assetForm.name;
      if (assetForm.brand !== (selectedAsset.brand || '')) assetData.brand = assetForm.brand;
      if (assetForm.model !== (selectedAsset.model || '')) assetData.model = assetForm.model;
      if (assetForm.serialNumber !== (selectedAsset.serialNumber || '')) assetData.serialNumber = assetForm.serialNumber;
      if (assetForm.status !== selectedAsset.status) assetData.status = assetForm.status;
      if (assetForm.condition !== selectedAsset.condition) assetData.condition = assetForm.condition;

      await api.put(`/assets/${selectedAsset.id}`, assetData);
      await fetchAssets();
      await fetchUnit();
      setShowEditAsset(false);
      setSelectedAsset(null);
    } catch (error: unknown) {
      console.error('Failed to update asset:', error);
      alert(error instanceof Error ? error.message : 'Failed to update asset');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAsset() {
    if (!selectedAsset || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.delete(`/assets/${selectedAsset.id}`);
      await fetchAssets();
      await fetchUnit();
      setShowDeleteAssetConfirm(false);
      setSelectedAsset(null);
    } catch (error: unknown) {
      console.error('Failed to delete asset:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete asset');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleQuickAddAsset(typeId: string, typeName: string, category: string) {
    setAssetForm({
      typeId: typeId,
      roomId: '',
      name: '',
      brand: '',
      model: '',
      serialNumber: '',
      status: 'ACTIVE',
      condition: 'GOOD',
    });
    setShowAddAsset(true);
  }

  // Get unique categories from asset types
  function getAssetTypesByCategory() {
    const categories: Record<string, AssetType[]> = {};
    assetTypes.forEach(type => {
      if (!categories[type.category]) {
        categories[type.category] = [];
      }
      categories[type.category].push(type);
    });
    return categories;
  }

  // Unit status update handler
  async function handleStatusChange(newStatus: string) {
    if (!unit || isUpdatingStatus || newStatus === unit.status) {
      setShowStatusDropdown(false);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await api.put(`/units/${unit.id}`, { status: newStatus });
      setUnit({ ...unit, status: newStatus });
      setShowStatusDropdown(false);
    } catch (error: unknown) {
      console.error('Failed to update status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const UNIT_STATUSES = [
    { value: 'VACANT', label: 'Vacant', icon: '🟢' },
    { value: 'OCCUPIED', label: 'Occupied', icon: '🔵' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: '🟡' },
    { value: 'RESERVED', label: 'Reserved', icon: '🟣' },
  ];

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      VACANT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      OCCUPIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      RESERVED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-dark-500">Loading...</div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-dark-500 mb-4">Unit not found</div>
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dark-800 dark:text-white">
              {unit.unitNo}
            </h1>
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isUpdatingStatus}
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status)} cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary-500 flex items-center gap-1 transition-all disabled:opacity-50`}
              >
                {isUpdatingStatus ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {unit.status}
              </button>
              {showStatusDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-dark-200 dark:border-dark-600 z-20 min-w-[140px]">
                    {UNIT_STATUSES.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-dark-100 dark:hover:bg-dark-700 ${
                          unit.status === status.value
                            ? 'text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20'
                            : 'text-dark-700 dark:text-dark-300'
                        }`}
                      >
                        <span>{status.icon}</span>
                        {status.label}
                        {unit.status === status.value && (
                          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-dark-500 dark:text-dark-400">
            {unit.building?.name || `Building ${unit.building?.buildingNumber}`}
            {unit.floor !== undefined && ` • ${getFloorName(unit.floor)}`}
            {unit.type && ` • ${unit.type.name}`}
          </p>
        </div>
        {unit.building && (
          <Link
            href={`/properties/buildings/${unit.building.id}`}
            className="px-4 py-2 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 text-sm"
          >
            View Building
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-200 dark:border-dark-700 mb-6">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'rooms', label: 'Rooms', count: unit._count.rooms },
            { id: 'assets', label: 'Assets', count: unit._count.assets },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Location Info */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Location</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-500 dark:text-dark-400">Building</span>
                <span className="font-medium text-dark-800 dark:text-white">
                  {unit.building?.name || unit.building?.buildingNumber}
                </span>
              </div>
              {unit.building?.block?.zone && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Zone</span>
                  <span className="font-medium text-dark-800 dark:text-white">
                    {unit.building.block.zone.name}
                  </span>
                </div>
              )}
              {unit.building?.block && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Block</span>
                  <span className="font-medium text-dark-800 dark:text-white">
                    {unit.building.block.blockNo}
                  </span>
                </div>
              )}
              {unit.building?.road && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Road</span>
                  <span className="font-medium text-dark-800 dark:text-white">
                    {unit.building.road.roadNo}
                  </span>
                </div>
              )}
              {unit.floor !== undefined && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Floor</span>
                  <span className="font-medium text-dark-800 dark:text-white">
                    {getFloorName(unit.floor)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Unit Details */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Details</h3>
            <div className="space-y-3">
              {unit.type && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Type</span>
                  <span className="font-medium text-dark-800 dark:text-white">{unit.type.name}</span>
                </div>
              )}
              {unit.areaSqm && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Area</span>
                  <span className="font-medium text-dark-800 dark:text-white">{unit.areaSqm} sqm</span>
                </div>
              )}
              {unit.numberOfBedrooms !== undefined && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Bedrooms</span>
                  <span className="font-medium text-dark-800 dark:text-white">{unit.numberOfBedrooms}</span>
                </div>
              )}
              {unit.numberOfBathrooms !== undefined && (
                <div className="flex justify-between">
                  <span className="text-dark-500 dark:text-dark-400">Bathrooms</span>
                  <span className="font-medium text-dark-800 dark:text-white">{unit.numberOfBathrooms}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
                <div className="text-2xl font-bold text-dark-800 dark:text-white">{unit._count.rooms}</div>
                <div className="text-xs text-dark-500">Rooms</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
                <div className="text-2xl font-bold text-dark-800 dark:text-white">{unit._count.assets}</div>
                <div className="text-xs text-dark-500">Assets</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
                <div className="text-2xl font-bold text-dark-800 dark:text-white">{unit._count.serviceRequests}</div>
                <div className="text-xs text-dark-500">Service Requests</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
                <div className="text-2xl font-bold text-dark-800 dark:text-white">{unit.customers?.length || 0}</div>
                <div className="text-xs text-dark-500">Customers</div>
              </div>
            </div>
          </div>

          {/* Current Customers */}
          {unit.customers && unit.customers.length > 0 && (
            <div className="md:col-span-3 rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
              <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-4">Current Customers</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unit.customers.map(({ customer }) => (
                  <div key={customer.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-50 dark:bg-dark-700">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-dark-800 dark:text-white">
                        {customer.firstName} {customer.lastName}
                      </div>
                      <div className="text-sm text-dark-500">{customer.phone}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Quick Add Buttons */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400">Quick Add Room</h3>
              <button
                onClick={openAddRoomModal}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Custom Room
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {roomTypes.slice(0, 10).map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleQuickAddRoom(type.id, type.name)}
                  className="px-3 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-2"
                >
                  <span>{getRoomIcon(type.name)}</span>
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms List */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
                Rooms ({unit.rooms.length})
              </h2>
            </div>

            {unit.rooms.length > 0 ? (
              <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unit.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="border border-dark-200 dark:border-dark-600 rounded-xl p-4 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRoom(room);
                      openEditRoomModal(room);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRoomIcon(room.type?.name)}</span>
                        <div>
                          <h4 className="font-medium text-dark-800 dark:text-white">{room.name}</h4>
                          {room.type && (
                            <p className="text-sm text-dark-500">{room.type.name}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoom(room);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-dark-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-1 text-sm">
                      {room.floor && (
                        <div className="flex justify-between text-dark-500">
                          <span>Floor</span>
                          <span className="text-dark-700 dark:text-dark-300">{room.floor}</span>
                        </div>
                      )}
                      {room.areaSqm && (
                        <div className="flex justify-between text-dark-500">
                          <span>Area</span>
                          <span className="text-dark-700 dark:text-dark-300">{room.areaSqm} sqm</span>
                        </div>
                      )}
                      {room.hasAttachedBathroom && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mt-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Attached Bathroom</span>
                        </div>
                      )}
                    </div>
                    {room._count && room._count.assets > 0 && (
                      <div className="mt-3 pt-3 border-t border-dark-100 dark:border-dark-700 text-sm text-dark-500">
                        {room._count.assets} asset{room._count.assets > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">🏠</div>
                <p className="text-dark-500 dark:text-dark-400 mb-4">
                  No rooms added yet. Start by adding rooms to this unit.
                </p>
                <button
                  onClick={openAddRoomModal}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Add First Room
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="space-y-6">
          {/* Quick Add by Category */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-dark-500 dark:text-dark-400">Quick Add Asset</h3>
              <button
                onClick={openAddAssetModal}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Custom Asset
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(getAssetTypesByCategory()).slice(0, 6).map(([category, types]) => (
                <div key={category} className="relative group">
                  <button
                    className="px-3 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors flex items-center gap-2"
                  >
                    <span>{getCategoryIcon(category)}</span>
                    {category.replace(/_/g, ' ')}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-dark-200 dark:border-dark-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[200px]">
                    {types.slice(0, 5).map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleQuickAddAsset(type.id, type.name, category)}
                        className="w-full px-4 py-2 text-left text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700"
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assets List */}
          <div className="rounded-xl bg-white dark:bg-dark-800 shadow-sm border border-dark-100 dark:border-dark-700">
            <div className="px-6 py-4 border-b border-dark-100 dark:border-dark-700">
              <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
                Assets ({assets.length})
              </h2>
            </div>

            {assets.length > 0 ? (
              <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="border border-dark-200 dark:border-dark-600 rounded-xl p-4 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => openEditAssetModal(asset)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(asset.type?.category)}</span>
                        <div>
                          <h4 className="font-medium text-dark-800 dark:text-white">
                            {asset.name || asset.type?.name || 'Unnamed Asset'}
                          </h4>
                          <p className="text-xs text-dark-500">{asset.assetNo}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAsset(asset);
                          setShowDeleteAssetConfirm(true);
                        }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-dark-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[asset.status] || 'bg-gray-100 text-gray-800'}`}>
                        {asset.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[asset.condition] || 'bg-gray-100 text-gray-800'}`}>
                        {asset.condition}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {asset.type && (
                        <div className="flex justify-between text-dark-500">
                          <span>Type</span>
                          <span className="text-dark-700 dark:text-dark-300">{asset.type.name}</span>
                        </div>
                      )}
                      {asset.brand && (
                        <div className="flex justify-between text-dark-500">
                          <span>Brand</span>
                          <span className="text-dark-700 dark:text-dark-300">{asset.brand}</span>
                        </div>
                      )}
                      {asset.model && (
                        <div className="flex justify-between text-dark-500">
                          <span>Model</span>
                          <span className="text-dark-700 dark:text-dark-300">{asset.model}</span>
                        </div>
                      )}
                      {asset.room && (
                        <div className="flex justify-between text-dark-500">
                          <span>Location</span>
                          <span className="text-dark-700 dark:text-dark-300">{asset.room.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-dark-500 dark:text-dark-400 mb-4">
                  No assets registered for this unit yet.
                </p>
                <button
                  onClick={openAddAssetModal}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Add First Asset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddRoom(false)}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700 z-10">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Add Room
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                {unit.unitNo}
              </p>
            </div>

            <form onSubmit={handleAddRoom} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="e.g., Living Room, Master Bedroom"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Room Type
                </label>
                <select
                  value={roomForm.typeId}
                  onChange={(e) => setRoomForm({ ...roomForm, typeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select type (optional)</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Floor (within unit)
                  </label>
                  <input
                    type="text"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    placeholder="e.g., Ground, First"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Area (sqm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={roomForm.areaSqm}
                    onChange={(e) => setRoomForm({ ...roomForm, areaSqm: e.target.value })}
                    placeholder="e.g., 25"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-50 dark:bg-dark-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roomForm.hasAttachedBathroom}
                  onChange={(e) => setRoomForm({ ...roomForm, hasAttachedBathroom: e.target.checked })}
                  className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                    Has Attached Bathroom
                  </span>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    Check if this room has an en-suite bathroom
                  </p>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !roomForm.name}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoom && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditRoom(false);
              setSelectedRoom(null);
            }}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700 z-10">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Edit Room
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                {selectedRoom.name}
              </p>
            </div>

            <form onSubmit={handleUpdateRoom} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="e.g., Living Room, Master Bedroom"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Room Type
                </label>
                <select
                  value={roomForm.typeId}
                  onChange={(e) => setRoomForm({ ...roomForm, typeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Select type (optional)</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Floor (within unit)
                  </label>
                  <input
                    type="text"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    placeholder="e.g., Ground, First"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Area (sqm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={roomForm.areaSqm}
                    onChange={(e) => setRoomForm({ ...roomForm, areaSqm: e.target.value })}
                    placeholder="e.g., 25"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-dark-50 dark:bg-dark-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roomForm.hasAttachedBathroom}
                  onChange={(e) => setRoomForm({ ...roomForm, hasAttachedBathroom: e.target.checked })}
                  className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                    Has Attached Bathroom
                  </span>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    Check if this room has an en-suite bathroom
                  </p>
                </div>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRoom(false);
                    setSelectedRoom(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !roomForm.name}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      {showDeleteConfirm && selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setSelectedRoom(null);
            }}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-2">
              Delete Room?
            </h3>
            <p className="text-dark-500 dark:text-dark-400 mb-6">
              Are you sure you want to delete <strong>{selectedRoom.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedRoom(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddAsset(false)}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700 z-10">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Add Asset
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                {unit.unitNo}
              </p>
            </div>

            <form onSubmit={handleAddAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Asset Type *
                </label>
                <select
                  value={assetForm.typeId}
                  onChange={(e) => setAssetForm({ ...assetForm, typeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Select asset type</option>
                  {Object.entries(getAssetTypesByCategory()).map(([category, types]) => (
                    <optgroup key={category} label={`${getCategoryIcon(category)} ${category.replace(/_/g, ' ')}`}>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Location (Room)
                </label>
                <select
                  value={assetForm.roomId}
                  onChange={(e) => setAssetForm({ ...assetForm, roomId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Unit-level (no specific room)</option>
                  {unit.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Custom Name
                </label>
                <input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g., Samsung Split AC"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                    placeholder="e.g., Samsung"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={assetForm.model}
                    onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                    placeholder="e.g., AR24TRHQ"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  placeholder="e.g., SN123456789"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Status
                  </label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="REPLACED">Replaced</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAsset(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !assetForm.typeId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditAsset && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowEditAsset(false);
              setSelectedAsset(null);
            }}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-800 px-6 py-4 border-b border-dark-100 dark:border-dark-700 z-10">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                Edit Asset
              </h3>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                {selectedAsset.assetNo}
              </p>
            </div>

            <form onSubmit={handleUpdateAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Asset Type *
                </label>
                <select
                  value={assetForm.typeId}
                  onChange={(e) => setAssetForm({ ...assetForm, typeId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  required
                >
                  <option value="">Select asset type</option>
                  {Object.entries(getAssetTypesByCategory()).map(([category, types]) => (
                    <optgroup key={category} label={`${getCategoryIcon(category)} ${category.replace(/_/g, ' ')}`}>
                      {types.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Location (Room)
                </label>
                <select
                  value={assetForm.roomId}
                  onChange={(e) => setAssetForm({ ...assetForm, roomId: e.target.value })}
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Unit-level (no specific room)</option>
                  {unit.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Custom Name
                </label>
                <input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  placeholder="e.g., Samsung Split AC"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={assetForm.brand}
                    onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                    placeholder="e.g., Samsung"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={assetForm.model}
                    onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                    placeholder="e.g., AR24TRHQ"
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                  placeholder="e.g., SN123456789"
                  className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Status
                  </label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="REPLACED">Replaced</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={assetForm.condition}
                    onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                    className="w-full rounded-xl border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-4 py-2.5 text-dark-800 dark:text-white focus:border-primary-500 focus:outline-none"
                  >
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAsset(false);
                    setSelectedAsset(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !assetForm.typeId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Asset Confirmation Modal */}
      {showDeleteAssetConfirm && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteAssetConfirm(false);
              setSelectedAsset(null);
            }}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-dark-800 dark:text-white mb-2">
              Delete Asset?
            </h3>
            <p className="text-dark-500 dark:text-dark-400 mb-6">
              Are you sure you want to delete <strong>{selectedAsset.name || selectedAsset.type?.name || selectedAsset.assetNo}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAssetConfirm(false);
                  setSelectedAsset(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAsset}
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
