'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
  displayNameAr?: string;
  description?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { group: 'Dashboard', permissions: ['dashboard:read'] },
  { group: 'Customers', permissions: ['customers:read', 'customers:create', 'customers:update', 'customers:delete'] },
  { group: 'Employees', permissions: ['employees:read', 'employees:create', 'employees:update', 'employees:delete'] },
  { group: 'Service Requests', permissions: ['service-requests:read', 'service-requests:create', 'service-requests:update', 'service-requests:delete'] },
  { group: 'Properties', permissions: ['properties:read', 'properties:create', 'properties:update', 'properties:delete'] },
  { group: 'Invoices', permissions: ['invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete'] },
  { group: 'Reports', permissions: ['reports:read'] },
  { group: 'Settings', permissions: ['settings:read', 'settings:update'] },
  { group: 'Users', permissions: ['users:read', 'users:create', 'users:update', 'users:delete'] },
  { group: 'Roles', permissions: ['roles:read', 'roles:create', 'roles:update', 'roles:delete'] },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    displayNameAr: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/roles');
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      displayName: '',
      displayNameAr: '',
      description: '',
      permissions: [],
      isActive: true,
    });
    setError('');
    setShowModal(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      displayNameAr: role.displayNameAr || '',
      description: role.description || '',
      permissions: role.permissions || [],
      isActive: role.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (role: Role) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await apiService.delete(`/roles/${role.id}`);
      fetchRoles();
    } catch (error: any) {
      alert(error.message || 'Failed to delete role');
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleGroupToggle = (permissions: string[]) => {
    const allSelected = permissions.every(p => formData.permissions.includes(p));
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !permissions.includes(p)),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...permissions])],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingRole) {
        await apiService.put(`/roles/${editingRole.id}`, formData);
      } else {
        await apiService.post('/roles', formData);
      }
      setShowModal(false);
      fetchRoles();
    } catch (error: any) {
      setError(error.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Roles</h1>
          <p className="text-dark-500 dark:text-dark-400 text-sm">Manage user roles and permissions</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-dark-500">Loading...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full p-8 text-center text-dark-500">No roles found</div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-dark-800 dark:text-white">{role.displayName}</h3>
                  <p className="text-sm text-dark-500">{role.name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  role.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {role.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-dark-600 dark:text-dark-400 mb-4 line-clamp-2">
                {role.description || 'No description'}
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {(role.permissions || []).slice(0, 3).map((perm) => (
                  <span key={perm} className="px-2 py-0.5 bg-dark-100 dark:bg-dark-700 rounded text-xs text-dark-600 dark:text-dark-400">
                    {perm}
                  </span>
                ))}
                {(role.permissions || []).length > 3 && (
                  <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 rounded text-xs text-primary-600 dark:text-primary-400">
                    +{(role.permissions || []).length - 3} more
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(role)}
                  className="flex-1 px-3 py-2 rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(role)}
                  className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {editingRole ? 'Edit Role' : 'Add Role'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    placeholder="e.g., admin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="input-modern dark:bg-dark-700 dark:border-dark-600"
                    placeholder="e.g., Administrator"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  Display Name (Arabic)
                </label>
                <input
                  type="text"
                  value={formData.displayNameAr}
                  onChange={(e) => setFormData({ ...formData, displayNameAr: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600"
                  placeholder="مدير النظام"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600 min-h-[80px]"
                  placeholder="Role description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-3">Permissions</label>
                <div className="space-y-4 max-h-60 overflow-y-auto border border-dark-200 dark:border-dark-600 rounded-lg p-4">
                  {AVAILABLE_PERMISSIONS.map((group) => (
                    <div key={group.group}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.permissions.every(p => formData.permissions.includes(p))}
                          onChange={() => handleGroupToggle(group.permissions)}
                          className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="font-medium text-dark-800 dark:text-white">{group.group}</span>
                      </label>
                      <div className="ml-6 mt-2 flex flex-wrap gap-2">
                        {group.permissions.map((perm) => (
                          <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm)}
                              onChange={() => handlePermissionToggle(perm)}
                              className="w-3.5 h-3.5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                            />
                            <span className="text-sm text-dark-600 dark:text-dark-400">{perm.split(':')[1]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-dark-600 dark:text-dark-400">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
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
