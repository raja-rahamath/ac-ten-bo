'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface Asset {
  id: string;
  code: string;
  name: string;
  serialNumber?: string;
  assetType?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
    building?: {
      name: string;
    };
  };
  room?: {
    id: string;
    name: string;
  };
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: string;
  isActive: boolean;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    serialNumber: '',
    assetTypeId: '',
    unitId: '',
    roomId: '',
    brand: '',
    model: '',
    purchaseDate: '',
    warrantyExpiry: '',
    status: 'ACTIVE',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, typesRes, unitsRes, roomsRes] = await Promise.all([
        apiService.get('/assets'),
        apiService.get('/asset-types'),
        apiService.get('/units'),
        apiService.get('/rooms'),
      ]);
      setAssets(assetsRes.data || []);
      setAssetTypes(typesRes.data || []);
      setUnits(unitsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingAsset(null);
    setFormData({
      code: '',
      name: '',
      serialNumber: '',
      assetTypeId: '',
      unitId: '',
      roomId: '',
      brand: '',
      model: '',
      purchaseDate: '',
      warrantyExpiry: '',
      status: 'ACTIVE',
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      code: asset.code,
      name: asset.name,
      serialNumber: asset.serialNumber || '',
      assetTypeId: asset.assetType?.id || '',
      unitId: asset.unit?.id || '',
      roomId: asset.room?.id || '',
      brand: asset.brand || '',
      model: asset.model || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      status: asset.status || 'ACTIVE',
      isActive: asset.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    try {
      await apiService.delete(`/assets/${asset.id}`);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete asset');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        purchaseDate: formData.purchaseDate || undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
      };
      if (editingAsset) {
        await apiService.put(`/assets/${editingAsset.id}`, payload);
      } else {
        await apiService.post('/assets', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (filterType && a.assetType?.id !== filterType) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(searchLower) ||
      a.code.toLowerCase().includes(searchLower) ||
      a.serialNumber?.toLowerCase().includes(searchLower)
    );
  });

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    MAINTENANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    REPAIR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    RETIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Assets</h1>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Manage equipment and assets</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          + New Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: assets.length, color: 'primary' },
          { label: 'Active', value: assets.filter(a => a.status === 'ACTIVE').length, color: 'green' },
          { label: 'Under Maintenance', value: assets.filter(a => a.status === 'MAINTENANCE').length, color: 'yellow' },
          { label: 'Retired', value: assets.filter(a => a.status === 'RETIRED').length, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="card p-4">
            <div className="text-sm text-dark-500 dark:text-dark-400">{stat.label}</div>
            <div className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-modern max-w-[200px]"
          >
            <option value="">All Types</option>
            {assetTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-modern max-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="REPAIR">Repair</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Brand/Model</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Warranty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-dark-50 dark:hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-dark-800 dark:text-white">{asset.name}</div>
                      <div className="text-sm text-dark-500">{asset.code}</div>
                      {asset.serialNumber && <div className="text-xs text-dark-400">S/N: {asset.serialNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {asset.assetType?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {asset.unit ? (
                        <>
                          <div>{asset.unit.name}</div>
                          <div className="text-xs text-dark-500">{asset.unit.building?.name}</div>
                          {asset.room && <div className="text-xs text-dark-400">Room: {asset.room.name}</div>}
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {asset.brand || asset.model ? (
                        <>
                          <div>{asset.brand}</div>
                          <div className="text-xs text-dark-500">{asset.model}</div>
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                      {asset.warrantyExpiry ? (
                        <span className={new Date(asset.warrantyExpiry) < new Date() ? 'text-red-500' : ''}>
                          {new Date(asset.warrantyExpiry).toLocaleDateString()}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status] || statusColors.ACTIVE}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(asset)} className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 text-dark-500 hover:text-primary-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(asset)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-500 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {editingAsset ? 'Edit Asset' : 'Add Asset'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Asset Type</label>
                  <select
                    value={formData.assetTypeId}
                    onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  >
                    <option value="">Select Type...</option>
                    {assetTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Unit</label>
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value, roomId: '' })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  >
                    <option value="">Select Unit...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} - {u.building?.name || 'No Building'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Room</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    disabled={!formData.unitId}
                  >
                    <option value="">Select Room...</option>
                    {rooms.filter(r => r.unitId === formData.unitId).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="REPAIR">Repair</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-dark-600 dark:text-dark-400">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
