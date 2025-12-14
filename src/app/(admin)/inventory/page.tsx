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
  package: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

interface Category {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  itemNo: string;
  name: string;
  nameAr?: string;
  categoryId: string;
  description?: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  isActive: boolean;
  category: Category;
}

const defaultFormData = {
  name: '',
  nameAr: '',
  categoryId: '',
  description: '',
  unit: 'piece',
  unitPrice: 0,
  currentStock: 0,
  minStock: 0,
  maxStock: '',
};

const units = ['piece', 'pcs', 'kg', 'ltr', 'm', 'sqm', 'sqft', 'set', 'box', 'roll', 'bag', 'pair'];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [showLowStock, filterCategory]);

  async function fetchItems() {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      let url = '${API_URL}/inventory-items?limit=100';
      if (showLowStock) url += '&lowStock=true';
      if (filterCategory) url += `&categoryId=${filterCategory}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('${API_URL}/inventory-categories?isActive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      alert('Please fill in required fields');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('accessToken');
    const url = editingItem
      ? `${API_URL}/inventory-items/${editingItem.id}`
      : '${API_URL}/inventory-items';

    try {
      const payload = {
        ...formData,
        unitPrice: parseFloat(String(formData.unitPrice)) || 0,
        currentStock: parseInt(String(formData.currentStock)) || 0,
        minStock: parseInt(String(formData.minStock)) || 0,
        maxStock: formData.maxStock ? parseInt(String(formData.maxStock)) : null,
      };

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingItem(null);
        setFormData(defaultFormData);
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Failed to save item');
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item');
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(item: InventoryItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nameAr: item.nameAr || '',
      categoryId: item.categoryId,
      description: item.description || '',
      unit: item.unit,
      unitPrice: item.unitPrice,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock ? String(item.maxStock) : '',
    });
    setShowModal(true);
  }

  function openNewModal() {
    setEditingItem(null);
    setFormData(defaultFormData);
    setShowModal(true);
  }

  const filteredItems = items.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.itemNo.toLowerCase().includes(searchLower) ||
      (item.nameAr && item.nameAr.includes(search)) ||
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  });

  const lowStockCount = items.filter((i) => i.currentStock <= i.minStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-800">Inventory Items</h1>
          <p className="text-dark-500">Manage your inventory stock and pricing</p>
        </div>
        <Button onClick={openNewModal} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
            {Icons.search}
          </div>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern !pl-11"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input-modern w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showLowStock
              ? 'bg-amber-100 border-amber-300 text-amber-700'
              : 'bg-white border-dark-200 text-dark-600 hover:bg-dark-50'
          }`}
        >
          {Icons.warning}
          Low Stock ({lowStockCount})
        </button>
      </div>

      {/* Table */}
      <div className="card-modern overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.package}
            </div>
            <p className="text-dark-500 font-medium">No inventory items found</p>
            <p className="text-dark-400 text-sm mt-1">Add your first item to get started</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Item No</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th className="text-right">Unit Price</th>
                <th className="text-center">Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isLowStock = item.currentStock <= item.minStock;
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="font-mono text-sm text-dark-600">{item.itemNo}</span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-dark-800">{item.name}</p>
                        {item.nameAr && <p className="text-xs text-dark-400" dir="rtl">{item.nameAr}</p>}
                      </div>
                    </td>
                    <td>
                      <span className="text-dark-600">{item.category?.name || '-'}</span>
                    </td>
                    <td>
                      <span className="text-dark-600">{item.unit}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-medium text-dark-800">
                        {item.unitPrice.toFixed(3)} BHD
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-medium ${isLowStock ? 'text-amber-600' : 'text-dark-800'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-dark-400">
                          min: {item.minStock}
                        </span>
                      </div>
                    </td>
                    <td>
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          Low Stock
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-dark-100 text-dark-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-dark-400'}`}></span>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => openEditModal(item)} className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
                        {Icons.edit}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-dark-800 mb-4">
              {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-modern"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-1">Name (Arabic)</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="input-modern"
                    dir="rtl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-modern"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-modern"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-modern"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Unit Price (BHD)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="input-modern"
                    min="0"
                    step="0.001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="input-modern"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="input-modern"
                    min="0"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-dark-700 mb-1">Max Stock Level (optional)</label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                    className="input-modern"
                    min="0"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 btn-primary">
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
