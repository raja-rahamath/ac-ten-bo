'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { Button } from '@/components/ui';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsEndpoint?: string; // API endpoint to load options from (e.g., '/districts')
  optionLabelKey?: string; // Key for the label in the response (default: 'name')
  optionValueKey?: string; // Key for the value in the response (default: 'id')
  placeholder?: string;
  // Cascading dropdown support
  dependsOn?: string; // Field key this dropdown depends on (e.g., 'countryId')
  filterKey?: string; // Key in the data to filter by (e.g., 'countryId')
  filterFromParent?: string; // For nested relations - path to get parent ID (e.g., 'state.countryId')
  isFilterOnly?: boolean; // If true, this field is only for filtering and not submitted to API
}

interface ReferenceDataPageProps {
  title: string;
  titleAr?: string;
  singularTitle?: string; // e.g., "Zone" for "Zones" - used in button text
  endpoint: string;
  columns: Column[];
  fields: Field[];
  searchPlaceholder?: string;
}

export default function ReferenceDataPage({
  title,
  titleAr,
  singularTitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder = 'Search...',
}: ReferenceDataPageProps) {
  // Derive singular title from plural if not provided (e.g., "Zones" -> "Zone")
  const itemName = singularTitle || (title.endsWith('ies') ? title.slice(0, -3) + 'y' : title.endsWith('s') ? title.slice(0, -1) : title);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Store all loaded data for filtering
  const [dynamicOptionsData, setDynamicOptionsData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchItems();
    fetchDynamicOptions();
  }, []);

  const fetchDynamicOptions = async () => {
    const fieldsWithEndpoints = fields.filter(f => f.optionsEndpoint);
    for (const field of fieldsWithEndpoints) {
      try {
        // Add isActive=true filter to only fetch active items for dropdowns
        const endpoint = field.optionsEndpoint!.includes('?')
          ? `${field.optionsEndpoint}&isActive=true`
          : `${field.optionsEndpoint}?isActive=true`;
        const response = await apiService.get(endpoint);
        const data = response.data || [];
        setDynamicOptionsData(prev => ({ ...prev, [field.key]: data }));
      } catch (error) {
        console.error(`Error fetching options for ${field.key}:`, error);
      }
    }
  };

  // Get filtered options for a field based on its dependencies
  const getFilteredOptions = useCallback((field: Field): { value: string; label: string }[] => {
    const data = dynamicOptionsData[field.key] || [];
    const labelKey = field.optionLabelKey || 'name';
    const valueKey = field.optionValueKey || 'id';

    // If this field depends on another field, filter the options
    if (field.dependsOn && field.filterKey) {
      const parentValue = formData[field.dependsOn];
      if (!parentValue) {
        return []; // No parent selected, show empty
      }

      const filtered = data.filter((item: any) => {
        // Direct filter key (e.g., countryId)
        if (item[field.filterKey!] === parentValue) {
          return true;
        }
        // Nested filter key (e.g., state.countryId for filtering districts by country)
        if (field.filterFromParent) {
          const keys = field.filterFromParent.split('.');
          let value = item;
          for (const k of keys) {
            value = value?.[k];
          }
          return value === parentValue;
        }
        return false;
      });

      return filtered.map((item: any) => ({
        value: item[valueKey],
        label: item[labelKey],
      }));
    }

    // No dependency, return all options
    return data.map((item: any) => ({
      value: item[valueKey],
      label: item[labelKey],
    }));
  }, [dynamicOptionsData, formData]);

  // Handle field change with cascade clearing
  const handleFieldChange = (fieldKey: string, value: any) => {
    const newFormData = { ...formData, [fieldKey]: value };

    // Find all fields that depend on this field and clear them
    fields.forEach(field => {
      if (field.dependsOn === fieldKey) {
        newFormData[field.key] = '';
        // Also clear any fields that depend on this child field (recursive cascade)
        fields.forEach(grandChild => {
          if (grandChild.dependsOn === field.key) {
            newFormData[grandChild.key] = '';
          }
        });
      }
    });

    setFormData(newFormData);
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(endpoint);
      setItems(response.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.key] = field.type === 'checkbox' ? false : '';
    });
    setFormData(initialData);
    setError('');
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    const editData: Record<string, any> = {};
    fields.forEach(field => {
      // For filter-only fields, try to get the value from nested relations
      if (field.isFilterOnly && field.filterFromParent) {
        const keys = field.filterFromParent.split('.');
        let value = item;
        for (const k of keys) {
          value = value?.[k];
        }
        editData[field.key] = value || '';
      } else {
        editData[field.key] = item[field.key] ?? (field.type === 'checkbox' ? false : '');
      }
    });
    setFormData(editData);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiService.delete(`${endpoint}/${item.id}`);
      fetchItems();
    } catch (error: any) {
      alert(error.message || 'Failed to delete item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Filter out filter-only fields from submission
      const submitData: Record<string, any> = {};
      fields.forEach(field => {
        if (!field.isFilterOnly) {
          submitData[field.key] = formData[field.key];
        }
      });

      if (editingItem) {
        await apiService.put(`${endpoint}/${editingItem.id}`, submitData);
      } else {
        await apiService.post(endpoint, submitData);
      }
      setShowModal(false);
      fetchItems();
    } catch (error: any) {
      setError(error.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return columns.some(col => {
      const value = item[col.key];
      return value && String(value).toLowerCase().includes(searchLower);
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">{title}</h1>
          {titleAr && <p className="text-dark-500 dark:text-dark-400 text-sm">{titleAr}</p>}
        </div>
        <Button onClick={handleAdd}>
          + New {itemName}
        </Button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern !pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-dark-500">Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-dark-500">
            {search ? 'No items match your search' : 'No items found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-50 dark:bg-dark-700/50">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                {filteredItems.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-dark-50 dark:hover:bg-dark-700/30 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">
                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 text-dark-500 hover:text-primary-500 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-500 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {editingItem ? 'Edit' : 'Add'} {itemName}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {fields.map(field => {
                // For dependent fields, check if parent is selected
                const isDisabled = field.dependsOn && !formData[field.dependsOn];
                const options = field.type === 'select'
                  ? (field.optionsEndpoint ? getFilteredOptions(field) : field.options || [])
                  : [];

                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      {field.label} {field.required && !field.isFilterOnly && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className={`input-modern dark:bg-dark-700 dark:border-dark-600 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        required={field.required && !field.isFilterOnly}
                        disabled={isDisabled}
                      >
                        <option value="">
                          {isDisabled ? `Select ${fields.find(f => f.key === field.dependsOn)?.label || 'parent'} first...` : 'Select...'}
                        </option>
                        {options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="input-modern dark:bg-dark-700 dark:border-dark-600 min-h-[80px]"
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData[field.key] || false}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-sm text-dark-600 dark:text-dark-400">{field.placeholder || 'Enable'}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="input-modern dark:bg-dark-700 dark:border-dark-600"
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
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
