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
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

interface ComplaintType {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  priority?: string;
  isActive: boolean;
  _count?: { serviceRequests: number };
}

export default function ComplaintTypesPage() {
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingComplaintType, setEditingComplaintType] = useState<ComplaintType | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', description: '', priority: '' });

  useEffect(() => {
    fetchComplaintTypes();
  }, []);

  async function fetchComplaintTypes() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/complaint-types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setComplaintTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch complaint types:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingComplaintType
      ? `http://localhost:4001/api/v1/complaint-types/${editingComplaintType.id}`
      : 'http://localhost:4001/api/v1/complaint-types';

    try {
      const payload = {
        ...formData,
        priority: formData.priority || undefined,
      };

      const response = await fetch(url, {
        method: editingComplaintType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingComplaintType(null);
        setFormData({ name: '', nameAr: '', description: '', priority: '' });
        fetchComplaintTypes();
      }
    } catch (error) {
      console.error('Failed to save complaint type:', error);
    }
  }

  function openEditModal(complaintType: ComplaintType) {
    setEditingComplaintType(complaintType);
    setFormData({
      name: complaintType.name,
      nameAr: complaintType.nameAr || '',
      description: complaintType.description || '',
      priority: complaintType.priority || '',
    });
    setShowModal(true);
  }

  const filteredComplaintTypes = complaintTypes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColors: Record<string, string> = {
    low: 'bg-dark-100 text-dark-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Complaint Types</h1>
          <p className="text-dark-500">Manage customer complaint categories</p>
        </div>
        <Button onClick={() => { setEditingComplaintType(null); setFormData({ name: '', nameAr: '', description: '', priority: '' }); setShowModal(true); }} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Complaint Type
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search complaint types..."
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
        ) : filteredComplaintTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.warning}
            </div>
            <p className="text-dark-500 font-medium">No complaint types found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Complaint Type Name</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Service Requests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaintTypes.map((complaintType) => (
                <tr key={complaintType.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{complaintType.name}</p>
                      {complaintType.nameAr && <p className="text-xs text-dark-400">{complaintType.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    <p className="text-dark-600 text-sm max-w-xs truncate">
                      {complaintType.description || '-'}
                    </p>
                  </td>
                  <td>
                    {complaintType.priority ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[complaintType.priority] || priorityColors.low}`}>
                        {complaintType.priority.charAt(0).toUpperCase() + complaintType.priority.slice(1)}
                      </span>
                    ) : (
                      <span className="text-dark-400">-</span>
                    )}
                  </td>
                  <td>
                    <span className="text-dark-600">{complaintType._count?.serviceRequests || 0}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      complaintType.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${complaintType.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {complaintType.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(complaintType)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
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
              {editingComplaintType ? 'Edit Complaint Type' : 'Add Complaint Type'}
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
                <label className="block text-sm font-medium text-dark-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input-modern"
                >
                  <option value="">No priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder="Brief description of the complaint type..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingComplaintType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
