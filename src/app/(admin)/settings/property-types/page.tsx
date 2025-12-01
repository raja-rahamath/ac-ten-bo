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
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  addChild: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  file: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

interface PropertyType {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  level: number;
  parentId?: string;
  isActive: boolean;
  parent?: { id: string; name: string };
  children?: PropertyType[];
  _count?: { properties: number; children: number };
}

export default function PropertyTypesPage() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [allPropertyTypes, setAllPropertyTypes] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<PropertyType | null>(null);
  const [formData, setFormData] = useState({ name: '', nameAr: '', description: '', parentId: '' });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPropertyTypes();
  }, []);

  async function fetchPropertyTypes() {
    try {
      const token = localStorage.getItem('accessToken');
      const [treeRes, allRes] = await Promise.all([
        fetch('http://localhost:4001/api/v1/property-types?rootOnly=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:4001/api/v1/property-types', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const treeData = await treeRes.json();
      const allData = await allRes.json();

      if (treeData.success) {
        setPropertyTypes(treeData.data);
        const ids = new Set<string>();
        function collectIds(items: PropertyType[]) {
          items.forEach(item => {
            if (item.children && item.children.length > 0) {
              ids.add(item.id);
              collectIds(item.children);
            }
          });
        }
        collectIds(treeData.data);
        setExpandedIds(ids);
      }
      if (allData.success) {
        setAllPropertyTypes(allData.data);
      }
    } catch (error) {
      console.error('Failed to fetch property types:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingType
      ? `http://localhost:4001/api/v1/property-types/${editingType.id}`
      : 'http://localhost:4001/api/v1/property-types';

    try {
      const payload = {
        name: formData.name,
        nameAr: formData.nameAr || undefined,
        description: formData.description || undefined,
        parentId: formData.parentId || null,
      };

      const response = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingType(null);
        setFormData({ name: '', nameAr: '', description: '', parentId: '' });
        fetchPropertyTypes();
      }
    } catch (error) {
      console.error('Failed to save property type:', error);
    }
  }

  function openAddModal(parentId?: string) {
    setEditingType(null);
    setFormData({ name: '', nameAr: '', description: '', parentId: parentId || '' });
    setShowModal(true);
  }

  function openEditModal(type: PropertyType) {
    setEditingType(type);
    setFormData({
      name: type.name,
      nameAr: type.nameAr || '',
      description: type.description || '',
      parentId: type.parentId || '',
    });
    setShowModal(true);
  }

  function toggleExpand(id: string) {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  }

  const levelColors: Record<number, string> = {
    1: 'bg-primary-100 text-primary-700 border-primary-200',
    2: 'bg-purple-100 text-purple-700 border-purple-200',
    3: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    4: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  function renderTreeItem(item: PropertyType, depth: number = 0) {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 p-3 rounded-xl hover:bg-dark-50 transition-colors group`}
          style={{ marginLeft: depth * 24 }}
        >
          <button
            onClick={() => hasChildren && toggleExpand(item.id)}
            className={`p-1 rounded-lg transition-colors ${hasChildren ? 'hover:bg-dark-100 text-dark-500' : 'text-transparent'}`}
            disabled={!hasChildren}
          >
            {hasChildren ? (isExpanded ? Icons.chevronDown : Icons.chevronRight) : <span className="w-4 h-4" />}
          </button>

          <div className={`p-2 rounded-lg ${hasChildren ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
            {hasChildren ? Icons.folder : Icons.file}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-dark-800">{item.name}</span>
              {item.nameAr && <span className="text-sm text-dark-400">({item.nameAr})</span>}
              <span className={`px-2 py-0.5 text-xs rounded-full ${levelColors[item.level] || levelColors[4]}`}>
                L{item.level}
              </span>
              {!item.isActive && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-dark-100 text-dark-500">Inactive</span>
              )}
            </div>
            {item.description && (
              <p className="text-sm text-dark-500 truncate">{item.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-dark-500">
            {(item._count?.children || 0) > 0 && (
              <span>{item._count?.children} sub-types</span>
            )}
            <span>{item._count?.properties || 0} properties</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openAddModal(item.id)}
              className="p-2 rounded-lg hover:bg-emerald-100 text-dark-400 hover:text-emerald-600 transition-colors"
              title="Add sub-type"
            >
              {Icons.addChild}
            </button>
            <button
              onClick={() => openEditModal(item)}
              className="p-2 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors"
              title="Edit"
            >
              {Icons.edit}
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-dark-100 ml-6">
            {item.children!.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const filteredTypes = search
    ? propertyTypes.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.children?.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
      )
    : propertyTypes;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Property Types</h1>
          <p className="text-dark-500">Manage hierarchical property structure</p>
        </div>
        <Button onClick={() => openAddModal()} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Root Type
        </Button>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
          {Icons.search}
        </div>
        <input
          type="text"
          placeholder="Search property types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern !pl-11"
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-dark-500">Levels:</span>
        <span className={`px-2 py-1 rounded-full ${levelColors[1]}`}>L1 Main</span>
        <span className={`px-2 py-1 rounded-full ${levelColors[2]}`}>L2 Sub</span>
        <span className={`px-2 py-1 rounded-full ${levelColors[3]}`}>L3 Unit</span>
        <span className={`px-2 py-1 rounded-full ${levelColors[4]}`}>L4+ Detail</span>
      </div>

      <div className="card-modern p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.home}
            </div>
            <p className="text-dark-500 font-medium">No property types found</p>
            <p className="text-dark-400 text-sm mt-1">Create your first property type structure</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTypes.map(type => renderTreeItem(type))}
          </div>
        )}
      </div>

      <div className="card-modern p-4 bg-blue-50 border-blue-100">
        <h3 className="font-medium text-blue-800 mb-2">Example Hierarchy</h3>
        <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
          <p><strong>Compound</strong> → Block → Flat</p>
          <p><strong>Compound</strong> → Villa</p>
          <p><strong>Building</strong> → Shop + Flat</p>
          <p><strong>Independent House</strong></p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-dark-800 mb-4">
              {editingType ? 'Edit Property Type' : 'Add Property Type'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Name (English) *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-modern"
                  placeholder="e.g., Compound, Villa, Flat"
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
                <label className="block text-sm font-medium text-dark-700 mb-1">Parent Type</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input-modern"
                >
                  <option value="">None (Root Level)</option>
                  {allPropertyTypes
                    .filter(t => t.id !== editingType?.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {'—'.repeat((t.level || 1) - 1)} {t.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingType ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
