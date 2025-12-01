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
  briefcase: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

interface JobTitle {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  level?: number;
  isActive: boolean;
  _count?: { employees: number };
}

export default function JobTitlesPage() {
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', description: '', level: '' });

  useEffect(() => {
    fetchJobTitles();
  }, []);

  async function fetchJobTitles() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/job-titles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setJobTitles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job titles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingJobTitle
      ? `http://localhost:4001/api/v1/job-titles/${editingJobTitle.id}`
      : 'http://localhost:4001/api/v1/job-titles';

    try {
      const payload = {
        ...formData,
        level: formData.level ? parseInt(formData.level) : undefined,
      };

      const response = await fetch(url, {
        method: editingJobTitle ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingJobTitle(null);
        setFormData({ name: '', nameAr: '', description: '', level: '' });
        fetchJobTitles();
      }
    } catch (error) {
      console.error('Failed to save job title:', error);
    }
  }

  function openEditModal(jobTitle: JobTitle) {
    setEditingJobTitle(jobTitle);
    setFormData({
      name: jobTitle.name,
      nameAr: jobTitle.nameAr || '',
      description: jobTitle.description || '',
      level: jobTitle.level?.toString() || '',
    });
    setShowModal(true);
  }

  const filteredJobTitles = jobTitles.filter((j) =>
    j.name.toLowerCase().includes(search.toLowerCase())
  );

  const levelColors: Record<number, string> = {
    1: 'bg-purple-100 text-purple-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-emerald-100 text-emerald-700',
    4: 'bg-amber-100 text-amber-700',
    5: 'bg-dark-100 text-dark-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Job Titles</h1>
          <p className="text-dark-500">Manage employee positions and roles</p>
        </div>
        <Button onClick={() => { setEditingJobTitle(null); setFormData({ name: '', nameAr: '', description: '', level: '' }); setShowModal(true); }} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Job Title
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search job titles..."
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
        ) : filteredJobTitles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.briefcase}
            </div>
            <p className="text-dark-500 font-medium">No job titles found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Description</th>
                <th>Level</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobTitles.map((jobTitle) => (
                <tr key={jobTitle.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{jobTitle.name}</p>
                      {jobTitle.nameAr && <p className="text-xs text-dark-400">{jobTitle.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    <p className="text-dark-600 text-sm max-w-xs truncate">
                      {jobTitle.description || '-'}
                    </p>
                  </td>
                  <td>
                    {jobTitle.level ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${levelColors[jobTitle.level] || levelColors[5]}`}>
                        Level {jobTitle.level}
                      </span>
                    ) : (
                      <span className="text-dark-400">-</span>
                    )}
                  </td>
                  <td>
                    <span className="text-dark-600">{jobTitle._count?.employees || 0}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      jobTitle.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${jobTitle.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {jobTitle.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(jobTitle)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
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
              {editingJobTitle ? 'Edit Job Title' : 'Add Job Title'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="input-modern"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="input-modern"
                >
                  <option value="">No level</option>
                  <option value="1">Level 1 - Executive</option>
                  <option value="2">Level 2 - Senior Management</option>
                  <option value="3">Level 3 - Management</option>
                  <option value="4">Level 4 - Supervisor</option>
                  <option value="5">Level 5 - Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder="Brief description of responsibilities..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingJobTitle ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
