'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';
import { Button, ConfirmModal, DualListPicker, DualListItem } from '@/components/ui';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'dualListPicker';
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsEndpoint?: string; // API endpoint to load options from (e.g., '/districts')
  optionLabelKey?: string; // Key for the label in the response (default: 'name')
  optionValueKey?: string; // Key for the value in the response (default: 'id')
  optionSublabelKey?: string; // Key for sublabel in DualListPicker (e.g., 'governorate.name')
  placeholder?: string;
  step?: string; // For number inputs (e.g., '0.001' for decimal precision)
  // Cascading dropdown support
  dependsOn?: string; // Field key this dropdown depends on (e.g., 'countryId')
  filterKey?: string; // Key in the data to filter by (e.g., 'countryId')
  filterFromParent?: string; // For nested relations - path to get parent ID (e.g., 'state.countryId')
  isFilterOnly?: boolean; // If true, this field is only for filtering and not submitted to API
  // Multiselect support
  getValuesFromItem?: (item: any) => string[]; // Function to extract selected values from item for edit mode
  // DualListPicker support
  exclusiveAssignment?: boolean; // If true, items can only be assigned to one record (excludes items assigned to other records)
  assignedToKey?: string; // Key in the data that contains the assigned record IDs (e.g., 'zoneIds')
  availableTitle?: string; // Title for available items column
  selectedTitle?: string; // Title for selected items column
}

interface TableFilter {
  key: string; // Key to filter by (e.g., 'governorateId')
  label: string; // Display label (e.g., 'Governorate')
  endpoint: string; // API endpoint to fetch options (e.g., '/governorates')
  optionLabelKey?: string; // Key for the label in the response (default: 'name')
  optionValueKey?: string; // Key for the value in the response (default: 'id')
  filterPath?: string; // Path to the value in the item (e.g., 'governorate.id' for nested objects)
}

interface ReferenceDataPageProps {
  title: string;
  titleAr?: string;
  singularTitle?: string; // e.g., "Zone" for "Zones" - used in button text
  endpoint: string;
  columns: Column[];
  fields: Field[];
  searchPlaceholder?: string;
  hideDelete?: boolean; // If true, hides the delete button in the table
  filters?: TableFilter[]; // Optional table filters
  showToggleActive?: boolean; // If true, shows toggle active/inactive button instead of delete
}

export default function ReferenceDataPage({
  title,
  titleAr,
  singularTitle,
  endpoint,
  columns,
  fields,
  searchPlaceholder = 'Search...',
  hideDelete = false,
  filters = [],
  showToggleActive = false,
}: ReferenceDataPageProps) {
  // Derive singular title from plural if not provided (e.g., "Zones" -> "Zone")
  const itemName = singularTitle || (title.endsWith('ies') ? title.slice(0, -3) + 'y' : title.endsWith('s') ? title.slice(0, -1) : title);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Store all loaded data for filtering
  const [dynamicOptionsData, setDynamicOptionsData] = useState<Record<string, any[]>>({});
  // Table filter state
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [filterOptionsData, setFilterOptionsData] = useState<Record<string, any[]>>({});
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirm',
    onConfirm: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchDynamicOptions();
  }, []);

  useEffect(() => {
    if (filters.length > 0) {
      fetchFilterOptions();
    }
  }, [filters.length]);

  const fetchFilterOptions = async () => {
    for (const filter of filters) {
      try {
        const endpoint = filter.endpoint.includes('?')
          ? `${filter.endpoint}&isActive=true`
          : `${filter.endpoint}?isActive=true`;
        const response = await apiService.get(endpoint);
        const data = response.data || [];
        setFilterOptionsData(prev => ({ ...prev, [filter.key]: data }));
      } catch (error) {
        console.error(`Error fetching filter options for ${filter.key}:`, error);
      }
    }
  };

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
      // Fetch all items by setting a high limit (reference data is typically small)
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await apiService.get(`${endpoint}${separator}limit=1000`);
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
      if (field.type === 'checkbox') {
        initialData[field.key] = false;
      } else if (field.type === 'multiselect' || field.type === 'dualListPicker') {
        initialData[field.key] = [];
      } else {
        initialData[field.key] = '';
      }
    });
    setFormData(initialData);
    setError('');
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('handleEdit called with item:', item);
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
      } else if (field.type === 'multiselect' || field.type === 'dualListPicker') {
        // Use custom function to extract values if provided
        if (field.getValuesFromItem) {
          editData[field.key] = field.getValuesFromItem(item);
          console.log(`Extracted ${field.key} values:`, editData[field.key], 'from item.areas:', item.areas);
        } else {
          editData[field.key] = item[field.key] ?? [];
        }
      } else if (field.type === 'checkbox') {
        editData[field.key] = item[field.key] ?? false;
      } else {
        editData[field.key] = item[field.key] ?? '';
      }
    });
    setFormData(editData);
    setError('');
    setShowModal(true);
  };

  const handleDelete = (item: any) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${itemName}`,
      message: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await apiService.delete(`${endpoint}/${item.id}`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchItems();
        } catch (error: any) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          alert(error.message || 'Failed to delete item');
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  const handleToggleActive = (item: any) => {
    const newStatus = !item.isActive;
    const action = newStatus ? 'activate' : 'make inactive';
    const actionTitle = newStatus ? 'Activate' : 'Make Inactive';

    setConfirmModal({
      isOpen: true,
      title: `${actionTitle} ${itemName}`,
      message: `Are you sure you want to ${action} this ${itemName.toLowerCase()}?`,
      variant: newStatus ? 'info' : 'warning',
      confirmText: actionTitle,
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          await apiService.put(`${endpoint}/${item.id}`, { isActive: newStatus });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchItems();
        } catch (error: any) {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          alert(error.message || `Failed to ${action} item`);
        } finally {
          setConfirmLoading(false);
        }
      },
    });
  };

  // State for error modal
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

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
      // Handle different error formats - API might return error.message or error.error or error itself
      let errorMessage = 'Failed to save item';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error?.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      // Check if this is a conflict/duplicate error (409 Conflict)
      const isConflictError =
        errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('unique constraint') ||
        errorMessage.includes('409');

      if (isConflictError) {
        // Close the form modal first
        setShowModal(false);
        // Show styled error modal for conflict errors
        setErrorModal({
          isOpen: true,
          title: 'Already Exists',
          message: `${itemName} with this name or code already exists. Please use a different name or code.`,
        });
      } else {
        // For other errors, show inline in the form
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    // Apply dropdown filters
    for (const filter of filters) {
      const filterValue = filterValues[filter.key];
      if (filterValue) {
        // Get item value based on filterPath or direct key
        let itemValue: any;
        if (filter.filterPath) {
          const keys = filter.filterPath.split('.');
          itemValue = item;
          for (const k of keys) {
            itemValue = itemValue?.[k];
          }
        } else {
          itemValue = item[filter.key];
        }
        if (itemValue !== filterValue) {
          return false;
        }
      }
    }

    // Apply text search
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
        </div>
        <Button onClick={handleAdd}>
          + New {itemName}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className={`flex flex-col sm:flex-row gap-4 ${filters.length > 0 ? '' : ''}`}>
          {/* Search Input */}
          <div className="relative flex-1">
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

          {/* Filter Dropdowns */}
          {filters.map(filter => {
            const options = filterOptionsData[filter.key] || [];
            const labelKey = filter.optionLabelKey || 'name';
            const valueKey = filter.optionValueKey || 'id';

            return (
              <div key={filter.key} className="sm:w-64">
                <select
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => setFilterValues(prev => ({ ...prev, [filter.key]: e.target.value }))}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600"
                >
                  <option value="">All {filter.label}s</option>
                  {options.map((opt: any) => (
                    <option key={opt[valueKey]} value={opt[valueKey]}>
                      {opt[labelKey]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
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
                          onClick={() => setViewingItem(item)}
                          className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 text-dark-500 hover:text-blue-500 transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-600 text-dark-500 hover:text-primary-500 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {showToggleActive && (
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.isActive
                                ? 'hover:bg-orange-50 dark:hover:bg-orange-900/20 text-dark-500 hover:text-orange-500'
                                : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-dark-500 hover:text-green-500'
                            }`}
                            title={item.isActive ? 'Inactive' : 'Activate'}
                          >
                            {item.isActive ? (
                              // Eye-slash icon for deactivate
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              // Eye icon for activate
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        )}
                        {!hideDelete && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-500 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
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
          <div className={`relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto ${
            fields.some(f => f.type === 'dualListPicker') ? 'max-w-3xl' : 'max-w-md'
          }`}>
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
                const isDisabled = !!(field.dependsOn && !formData[field.dependsOn]);
                const options = (field.type === 'select' || field.type === 'multiselect')
                  ? (field.optionsEndpoint ? getFilteredOptions(field) : field.options || [])
                  : [];

                // Get DualListPicker items
                const getDualListItems = (): DualListItem[] => {
                  if (field.type !== 'dualListPicker') return [];
                  const data = dynamicOptionsData[field.key] || [];
                  const labelKey = field.optionLabelKey || 'name';
                  const valueKey = field.optionValueKey || 'id';
                  const sublabelKey = field.optionSublabelKey;
                  const assignedToKey = field.assignedToKey || 'zoneIds';
                  const currentId = editingItem?.id;

                  return data
                    .filter((item: any) => {
                      // If exclusive assignment, filter out items assigned to OTHER records
                      if (field.exclusiveAssignment) {
                        const assignedIds = item[assignedToKey] || [];
                        // Include if not assigned to anyone, or assigned to current record
                        return assignedIds.length === 0 || (currentId && assignedIds.includes(currentId));
                      }
                      return true;
                    })
                    .map((item: any) => {
                      // Get sublabel from nested path (e.g., 'governorate.name')
                      let sublabel: string | undefined;
                      if (sublabelKey) {
                        const keys = sublabelKey.split('.');
                        let value = item;
                        for (const k of keys) {
                          value = value?.[k];
                        }
                        sublabel = value as string;
                      }
                      return {
                        value: item[valueKey],
                        label: item[labelKey],
                        sublabel,
                      };
                    });
                };

                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                      {field.label} {field.required && !field.isFilterOnly && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'dualListPicker' ? (
                      <DualListPicker
                        availableItems={getDualListItems()}
                        selectedValues={formData[field.key] || []}
                        onChange={(values) => handleFieldChange(field.key, values)}
                        availableTitle={field.availableTitle || 'Available'}
                        selectedTitle={field.selectedTitle || 'Selected'}
                        height="250px"
                      />
                    ) : field.type === 'multiselect' ? (
                      <div className="border border-dark-200 dark:border-dark-600 rounded-xl p-3 max-h-48 overflow-y-auto bg-white dark:bg-dark-700">
                        {options.length === 0 ? (
                          <p className="text-sm text-dark-400">No options available</p>
                        ) : (
                          <div className="space-y-2">
                            {options.map(opt => {
                              const isChecked = (formData[field.key] || []).includes(opt.value);
                              return (
                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-600 p-1.5 rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentValues = formData[field.key] || [];
                                      if (e.target.checked) {
                                        handleFieldChange(field.key, [...currentValues, opt.value]);
                                      } else {
                                        handleFieldChange(field.key, currentValues.filter((v: string) => v !== opt.value));
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-dark-700 dark:text-dark-300">{opt.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : field.type === 'select' ? (
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
                        value={formData[field.key] ?? ''}
                        onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? (e.target.value === '' ? null : parseFloat(e.target.value)) : e.target.value)}
                        className="input-modern dark:bg-dark-700 dark:border-dark-600"
                        placeholder={field.placeholder}
                        required={field.required}
                        step={field.step}
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        isLoading={confirmLoading}
      />

      {/* Error Modal for duplicate/conflict errors */}
      <ConfirmModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        variant="warning"
        confirmText="OK"
        cancelText=""
      />

      {/* View Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingItem(null)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {itemName} Details
              </h3>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Display all columns data */}
              {columns.map(col => (
                <div key={col.key} className="flex flex-col">
                  <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-1">
                    {col.label}
                  </span>
                  <span className="text-sm text-dark-800 dark:text-dark-200">
                    {col.render ? col.render(viewingItem[col.key], viewingItem) : (viewingItem[col.key] || '-')}
                  </span>
                </div>
              ))}

              {/* Audit Information Section */}
              <div className="border-t border-dark-200 dark:border-dark-600 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-dark-700 dark:text-dark-300 mb-3">Audit Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-1">
                      Created Date
                    </span>
                    <span className="text-sm text-dark-800 dark:text-dark-200">
                      {viewingItem.createdAt ? new Date(viewingItem.createdAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-1">
                      Created By
                    </span>
                    <span className="text-sm text-dark-800 dark:text-dark-200">
                      {viewingItem.createdByName || viewingItem.createdBy?.name || viewingItem.createdById || '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-1">
                      Last Modified
                    </span>
                    <span className="text-sm text-dark-800 dark:text-dark-200">
                      {viewingItem.updatedAt ? new Date(viewingItem.updatedAt).toLocaleString() : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-1">
                      Modified By
                    </span>
                    <span className="text-sm text-dark-800 dark:text-dark-200">
                      {viewingItem.updatedByName || viewingItem.updatedBy?.name || viewingItem.updatedById || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingItem(null)}
                className="px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
