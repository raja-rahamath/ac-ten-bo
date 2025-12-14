'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

const Icons = {
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  back: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  mapPin: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface Governorate {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  isActive: boolean;
  district?: { name: string };
  _count?: { zones: number };
}

interface District {
  id: string;
  name: string;
}

export default function GovernoratesPage() {
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGovernorate, setEditingGovernorate] = useState<Governorate | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', code: '', description: '', districtId: '' });

  useEffect(() => {
    fetchGovernorates();
    fetchDistricts();
  }, []);

  async function fetchGovernorates() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/governorates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setGovernorates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch governorates:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDistricts() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/districts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingGovernorate
      ? `${API_URL}/governorates/${editingGovernorate.id}`
      : '${API_URL}/governorates';

    try {
      const response = await fetch(url, {
        method: editingGovernorate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingGovernorate(null);
        setFormData({ name: '', nameAr: '', code: '', description: '', districtId: '' });
        fetchGovernorates();
      }
    } catch (error) {
      console.error('Failed to save governorate:', error);
    }
  }

  function openEditModal(governorate: Governorate) {
    setEditingGovernorate(governorate);
    setFormData({
      name: governorate.name,
      nameAr: governorate.nameAr || '',
      code: governorate.code || '',
      description: governorate.description || '',
      districtId: '',
    });
    setShowModal(true);
  }

  const filteredGovernorates = governorates.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.code && g.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Governorates</h1>
          <p className="text-dark-500">Manage governorates and regions</p>
        </div>
        <Button onClick={() => { setEditingGovernorate(null); setFormData({ name: '', nameAr: '', code: '', description: '', districtId: '' }); setShowModal(true); }} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Governorate
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search governorates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern !pl-11"
        />
      </div>

      {/* Table */}
      <div className="card-modern overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          </div>
        ) : filteredGovernorates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.mapPin}
            </div>
            <p className="text-dark-500 font-medium">No governorates found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Governorate Name</th>
                <th>Code</th>
                <th>District</th>
                <th>Zones</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGovernorates.map((governorate) => (
                <tr key={governorate.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{governorate.name}</p>
                      {governorate.nameAr && <p className="text-xs text-dark-400">{governorate.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    {governorate.code ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-dark-100 text-dark-700 text-sm font-mono">
                        {governorate.code}
                      </span>
                    ) : (
                      <span className="text-dark-400">-</span>
                    )}
                  </td>
                  <td>
                    <span className="text-dark-600">{governorate.district?.name || '-'}</span>
                  </td>
                  <td>
                    <span className="text-dark-600">{governorate._count?.zones || 0}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      governorate.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${governorate.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {governorate.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(governorate)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
                      {Icons.edit}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-dark-800 mb-4">
              {editingGovernorate ? 'Edit Governorate' : 'Add Governorate'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Name (Arabic)</label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="input-modern"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Governorate Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="input-modern font-mono"
                  placeholder="G001"
                />
              </div>
              {districts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">District</label>
                  <select
                    value={formData.districtId}
                    onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                    className="input-modern"
                  >
                    <option value="">Select district</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingGovernorate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
