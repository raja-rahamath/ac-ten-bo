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
  archive: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
};

interface InventoryCategory {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  isActive: boolean;
  _count?: { items: number };
}

export default function InventoryCategoriesPage() {
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', description: '' });

  useEffect(() => {
    fetchInventoryCategories();
  }, []);

  async function fetchInventoryCategories() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/inventory-categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setInventoryCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory categories:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingCategory
      ? `${API_URL}/inventory-categories/${editingCategory.id}`
      : '${API_URL}/inventory-categories';

    try {
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', nameAr: '', description: '' });
        fetchInventoryCategories();
      }
    } catch (error) {
      console.error('Failed to save inventory category:', error);
    }
  }

  function openEditModal(category: InventoryCategory) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr || '',
      description: category.description || '',
    });
    setShowModal(true);
  }

  const filteredCategories = inventoryCategories.filter((c) =>
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
          <h1 className="text-2xl font-bold text-dark-800">Inventory Categories</h1>
          <p className="text-dark-500">Manage inventory item categories</p>
        </div>
        <Button onClick={() => { setEditingCategory(null); setFormData({ name: '', nameAr: '', description: '' }); setShowModal(true); }} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search categories..."
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
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.archive}
            </div>
            <p className="text-dark-500 font-medium">No inventory categories found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{category.name}</p>
                      {category.nameAr && <p className="text-xs text-dark-400">{category.nameAr}</p>}
                    </div>
                  </td>
                  <td>
                    <p className="text-dark-600 text-sm max-w-xs truncate">
                      {category.description || '-'}
                    </p>
                  </td>
                  <td>
                    <span className="text-dark-600">{category._count?.items || 0}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${category.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(category)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
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
              {editingCategory ? 'Edit Inventory Category' : 'Add Inventory Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Category Name (English)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Category Name (Arabic)</label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="input-modern"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern"
                  rows={3}
                  placeholder="Brief description of this category..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
