'use client';

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
  division: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
};

interface Division {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  companyId: string;
  company?: { id: string; name: string };
  isActive: boolean;
  _count?: { departments: number };
}

interface Company {
  id: string;
  name: string;
  nameAr?: string;
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', code: '', companyId: '' });

  useEffect(() => {
    fetchCompanies();
    fetchDivisions();
  }, []);

  useEffect(() => {
    fetchDivisions();
  }, [selectedCompanyFilter]);

  async function fetchCompanies() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  }

  async function fetchDivisions() {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = selectedCompanyFilter ? `?companyId=${selectedCompanyFilter}` : '';
      const response = await fetch(`http://localhost:4001/api/v1/divisions${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDivisions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingDivision
      ? `http://localhost:4001/api/v1/divisions/${editingDivision.id}`
      : 'http://localhost:4001/api/v1/divisions';

    try {
      const response = await fetch(url, {
        method: editingDivision ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingDivision(null);
        setFormData({ name: '', nameAr: '', code: '', companyId: '' });
        fetchDivisions();
      }
    } catch (error) {
      console.error('Failed to save division:', error);
    }
  }

  function openEditModal(division: Division) {
    setEditingDivision(division);
    setFormData({
      name: division.name,
      nameAr: division.nameAr || '',
      code: division.code || '',
      companyId: division.companyId,
    });
    setShowModal(true);
  }

  function openAddModal() {
    setEditingDivision(null);
    setFormData({ name: '', nameAr: '', code: '', companyId: '' });
    setShowModal(true);
  }

  const filteredDivisions = divisions.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Divisions</h1>
          <p className="text-dark-500">Manage your organizational divisions</p>
        </div>
        <Button onClick={openAddModal} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Division
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
            {Icons.search}
          </div>
          <input
            type="text"
            placeholder="Search divisions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern !pl-11"
          />
        </div>
        <select
          value={selectedCompanyFilter}
          onChange={(e) => setSelectedCompanyFilter(e.target.value)}
          className="input-modern w-64"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card-modern overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          </div>
        ) : filteredDivisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.division}
            </div>
            <p className="text-dark-500 font-medium">No divisions found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Division</th>
                <th>Code</th>
                <th>Company</th>
                <th>Departments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDivisions.map((division) => (
                <tr key={division.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{division.name}</p>
                      {division.nameAr && <p className="text-xs text-dark-400">{division.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    <span className="text-dark-600">{division.code || '-'}</span>
                  </td>
                  <td>
                    <div>
                      <p className="text-dark-700">{division.company?.name || '-'}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-dark-600">{division._count?.departments || 0}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      division.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${division.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {division.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(division)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
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
              {editingDivision ? 'Edit Division' : 'Add Division'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Company</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="input-modern"
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
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
                <label className="block text-sm font-medium text-dark-700 mb-1">Code (Optional)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-modern"
                  placeholder="e.g., DIV-001"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingDivision ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
