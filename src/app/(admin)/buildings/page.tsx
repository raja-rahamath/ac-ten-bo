'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiService } from '@/lib/api';

interface Building {
  id: string;
  code: string;
  name: string;
  nameAr?: string;
  property?: {
    id: string;
    name: string;
  };
  buildingType?: {
    id: string;
    name: string;
  };
  floors?: number;
  address?: string;
  isActive: boolean;
  _count?: {
    units: number;
  };
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [buildingTypes, setBuildingTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameAr: '',
    propertyId: '',
    buildingTypeId: '',
    floors: 1,
    address: '',
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
      const [buildingsRes, propertiesRes, typesRes] = await Promise.all([
        apiService.get('/buildings'),
        apiService.get('/properties'),
        apiService.get('/building-types'),
      ]);
      setBuildings(buildingsRes.data || []);
      setProperties(propertiesRes.data || []);
      setBuildingTypes(typesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBuilding(null);
    setFormData({
      code: '',
      name: '',
      nameAr: '',
      propertyId: '',
      buildingTypeId: '',
      floors: 1,
      address: '',
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setFormData({
      code: building.code,
      name: building.name,
      nameAr: building.nameAr || '',
      propertyId: building.property?.id || '',
      buildingTypeId: building.buildingType?.id || '',
      floors: building.floors || 1,
      address: building.address || '',
      isActive: building.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (building: Building) => {
    if (!confirm('Are you sure you want to delete this building?')) return;
    try {
      await apiService.delete(`/buildings/${building.id}`);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete building');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingBuilding) {
        await apiService.put(`/buildings/${editingBuilding.id}`, formData);
      } else {
        await apiService.post('/buildings', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      setError(error.message || 'Failed to save building');
    } finally {
      setSaving(false);
    }
  };

  const filteredBuildings = buildings.filter(b => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(searchLower) ||
      b.code.toLowerCase().includes(searchLower) ||
      b.property?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Buildings</h1>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Manage buildings within properties</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          + New Building
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search buildings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern pl-10"
          />
        </div>
      </div>

      {/* Buildings Grid */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings.map((building) => (
            <div key={building.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-800 dark:text-white">{building.name}</h3>
                    <p className="text-sm text-dark-500">{building.code}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  building.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {building.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                  </svg>
                  <span>{building.property?.name || 'No Property'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                  </svg>
                  <span>{building.floors || 1} Floors</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                  </svg>
                  <span>{building._count?.units || 0} Units</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/units?buildingId=${building.id}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm text-center hover:bg-primary-100 dark:hover:bg-primary-900/30"
                >
                  View Units
                </Link>
                <button
                  onClick={() => handleEdit(building)}
                  className="px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(building)}
                  className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {editingBuilding ? 'Edit Building' : 'Add Building'}
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

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600"
                >
                  <option value="">Select Property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Building Type</label>
                  <select
                    value={formData.buildingTypeId}
                    onChange={(e) => setFormData({ ...formData, buildingTypeId: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  >
                    <option value="">Select Type...</option>
                    {buildingTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Floors</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.floors}
                    onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) || 1 })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600 min-h-[60px]"
                />
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
