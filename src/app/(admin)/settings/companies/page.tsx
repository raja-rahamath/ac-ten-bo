'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

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
  company: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  starOutline: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

interface Company {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  address?: string;
  plusCode?: string;
  isActive: boolean;
  isPrimary: boolean;
  _count?: { employees: number; divisions: number };
}

export default function CompaniesPage() {
  const { refreshCompanyInfo } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', logo: '', email: '', phone: '', fax: '', website: '', address: '', plusCode: '' });

  useEffect(() => {
    fetchCompanies();
  }, []);

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
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingCompany
      ? `http://localhost:4001/api/v1/companies/${editingCompany.id}`
      : 'http://localhost:4001/api/v1/companies';

    try {
      const response = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingCompany(null);
        setFormData({ name: '', nameAr: '', logo: '', email: '', phone: '', fax: '', website: '', address: '', plusCode: '' });
        fetchCompanies();
        // Refresh company info in header if company was updated
        refreshCompanyInfo();
      }
    } catch (error) {
      console.error('Failed to save company:', error);
    }
  }

  function openEditModal(company: Company) {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      nameAr: company.nameAr || '',
      logo: company.logo || '',
      email: company.email || '',
      phone: company.phone || '',
      fax: company.fax || '',
      website: company.website || '',
      address: company.address || '',
      plusCode: company.plusCode || '',
    });
    setShowModal(true);
  }

  async function setAsPrimary(companyId: string) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:4001/api/v1/companies/${companyId}/set-primary`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchCompanies();
        // Refresh company info in header
        refreshCompanyInfo();
      }
    } catch (error) {
      console.error('Failed to set company as primary:', error);
    }
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Companies</h1>
          <p className="text-dark-500">Manage your company information</p>
        </div>
        <Button onClick={() => { setEditingCompany(null); setFormData({ name: '', nameAr: '', logo: '', email: '', phone: '', fax: '', website: '', address: '', plusCode: '' }); setShowModal(true); }} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search companies..."
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
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.company}
            </div>
            <p className="text-dark-500 font-medium">No companies found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{company.name}</p>
                      {company.nameAr && <p className="text-xs text-dark-400">{company.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-dark-700">{company.email || '-'}</p>
                      <p className="text-xs text-dark-400">{company.phone || '-'}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-dark-600">{company._count?.employees || 0}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      company.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${company.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setAsPrimary(company.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          company.isPrimary
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-dark-300 hover:bg-dark-100 hover:text-amber-500'
                        }`}
                        title={company.isPrimary ? 'Primary Company' : 'Set as Primary'}
                      >
                        {company.isPrimary ? Icons.star : Icons.starOutline}
                      </button>
                      <button onClick={() => openEditModal(company)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
                        {Icons.edit}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-dark-800 mb-4">
              {editingCompany ? 'Edit Company' : 'Add Company'}
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
                <label className="block text-sm font-medium text-dark-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="input-modern"
                  placeholder="https://example.com/logo.png"
                />
                {formData.logo && (
                  <div className="mt-2 p-2 bg-dark-50 rounded-lg">
                    <img
                      src={formData.logo}
                      alt="Logo preview"
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Fax</label>
                <input
                  type="tel"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input-modern"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-modern min-h-[80px]"
                  rows={3}
                  placeholder="Enter company address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Google Maps Plus Code</label>
                <input
                  type="text"
                  value={formData.plusCode}
                  onChange={(e) => setFormData({ ...formData, plusCode: e.target.value })}
                  className="input-modern"
                  placeholder="e.g., 8F2M+4V Manama, Bahrain"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingCompany ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
