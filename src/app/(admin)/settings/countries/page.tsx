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
  globe: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

interface Country {
  id: string;
  name: string;
  nameAr?: string;
  code: string;
  phoneCode?: string;
  currency?: string;
  isActive: boolean;
  _count?: { zones: number };
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', code: '', phoneCode: '', currency: '' });

  useEffect(() => {
    fetchCountries();
  }, []);

  async function fetchCountries() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/countries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCountries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingCountry
      ? `${API_URL}/countries/${editingCountry.id}`
      : '${API_URL}/countries';

    try {
      const response = await fetch(url, {
        method: editingCountry ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingCountry(null);
        setFormData({ name: '', nameAr: '', code: '', phoneCode: '', currency: '' });
        fetchCountries();
      }
    } catch (error) {
      console.error('Failed to save country:', error);
    }
  }

  function openEditModal(country: Country) {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      nameAr: country.nameAr || '',
      code: country.code,
      phoneCode: country.phoneCode || '',
      currency: country.currency || '',
    });
    setShowModal(true);
  }

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Countries</h1>
          <p className="text-dark-500">Manage countries and regions</p>
        </div>
        <Button onClick={() => { setEditingCountry(null); setFormData({ name: '', nameAr: '', code: '', phoneCode: '', currency: '' }); setShowModal(true); }} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Country
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search countries..."
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
        ) : filteredCountries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.globe}
            </div>
            <p className="text-dark-500 font-medium">No countries found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Country</th>
                <th>Code</th>
                <th>Phone Code</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((country) => (
                <tr key={country.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{country.name}</p>
                      {country.nameAr && <p className="text-xs text-dark-400">{country.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-dark-100 text-dark-700 text-sm font-mono">
                      {country.code}
                    </span>
                  </td>
                  <td>
                    <span className="text-dark-600">{country.phoneCode || '-'}</span>
                  </td>
                  <td>
                    <span className="text-dark-600">{country.currency || '-'}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      country.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${country.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {country.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(country)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
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
              {editingCountry ? 'Edit Country' : 'Add Country'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Country Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input-modern font-mono"
                    placeholder="BH"
                    maxLength={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Phone Code</label>
                  <input
                    type="text"
                    value={formData.phoneCode}
                    onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                    className="input-modern"
                    placeholder="+973"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  className="input-modern font-mono"
                  placeholder="BHD"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingCountry ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
