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
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  key: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
  _count?: { users: number };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  async function fetchRoles() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPermissions() {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/roles/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAllPermissions(data.data);
        setGroupedPermissions(data.grouped || {});
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const url = editingRole
      ? `http://localhost:4001/api/v1/roles/${editingRole.id}`
      : 'http://localhost:4001/api/v1/roles';

    try {
      const response = await fetch(url, {
        method: editingRole ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', displayName: '', description: '' });
        fetchRoles();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save role');
      }
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  }

  async function handleUpdatePermissions(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;

    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`http://localhost:4001/api/v1/roles/${editingRole.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      if (response.ok) {
        setShowPermissionsModal(false);
        setEditingRole(null);
        setSelectedPermissions([]);
        fetchRoles();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Are you sure you want to delete the role "${role.displayName}"?`)) return;

    const token = localStorage.getItem('accessToken');
    try {
      const response = await fetch(`http://localhost:4001/api/v1/roles/${role.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchRoles();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  }

  function openEditModal(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
    });
    setShowModal(true);
  }

  function openPermissionsModal(role: Role) {
    setEditingRole(role);
    setSelectedPermissions(role.permissions.map(p => p.id));
    setShowPermissionsModal(true);
  }

  function openAddModal() {
    setEditingRole(null);
    setFormData({ name: '', displayName: '', description: '' });
    setShowModal(true);
  }

  function togglePermission(permissionId: string) {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  }

  function toggleResourcePermissions(resource: string) {
    const resourcePerms = groupedPermissions[resource] || [];
    const resourcePermIds = resourcePerms.map(p => p.id);
    const allSelected = resourcePermIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !resourcePermIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...resourcePermIds])]);
    }
  }

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          {Icons.back}
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-dark-800">Roles</h1>
          <p className="text-dark-500">Manage roles and their permissions</p>
        </div>
        <Button onClick={openAddModal} className="btn-modern btn-primary gap-2">
          {Icons.plus}
          Add Role
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-dark-400">
            {Icons.search}
          </div>
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern !pl-11"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-modern overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-dark-100 flex items-center justify-center text-dark-400 mb-4">
              {Icons.shield}
            </div>
            <p className="text-dark-500 font-medium">No roles found</p>
          </div>
        ) : (
          <table className="table-modern">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Users</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div>
                      <p className="font-medium text-dark-800">{role.displayName}</p>
                      <p className="text-xs text-dark-400">{role.name}</p>
                    </div>
                  </td>
                  <td>
                    <span className="text-dark-500 text-sm">{role.description || '-'}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => openPermissionsModal(role)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
                    >
                      {Icons.key}
                      {role.permissions?.length || 0} permissions
                    </button>
                  </td>
                  <td>
                    <span className="text-dark-600">{role._count?.users || 0} users</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      role.isSystem ? 'bg-amber-100 text-amber-700' : 'bg-dark-100 text-dark-600'
                    }`}>
                      {role.isSystem ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(role)}
                        className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
                        disabled={role.isSystem}
                        title={role.isSystem ? 'Cannot edit system role' : 'Edit role'}
                      >
                        {Icons.edit}
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDelete(role)}
                          className="p-2 rounded-lg hover:bg-red-100 text-dark-500 hover:text-red-600 transition-colors"
                          title="Delete role"
                        >
                          {Icons.trash}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-dark-800 mb-4">
              {editingRole ? 'Edit Role' : 'Add Role'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Name (System)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="input-modern"
                  required
                  placeholder="e.g., supervisor"
                  disabled={!!editingRole}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="input-modern"
                  required
                  placeholder="e.g., Supervisor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-modern min-h-[80px]"
                  placeholder="Describe what this role can do..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingRole ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <h2 className="text-xl font-bold text-dark-800 mb-4">
              Manage Permissions - {editingRole.displayName}
            </h2>
            <form onSubmit={handleUpdatePermissions} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {Object.entries(groupedPermissions).length === 0 ? (
                  <p className="text-dark-500 text-center py-8">No permissions available</p>
                ) : (
                  Object.entries(groupedPermissions).map(([resource, perms]) => {
                    const allSelected = perms.every(p => selectedPermissions.includes(p.id));
                    const someSelected = perms.some(p => selectedPermissions.includes(p.id));

                    return (
                      <div key={resource} className="border border-dark-200 rounded-xl overflow-hidden">
                        <div
                          className="flex items-center gap-3 p-4 bg-dark-50 cursor-pointer hover:bg-dark-100 transition-colors"
                          onClick={() => toggleResourcePermissions(resource)}
                        >
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => toggleResourcePermissions(resource)}
                            className="h-4 w-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="font-medium text-dark-800 capitalize">{resource.replace(/-/g, ' ')}</span>
                          <span className="text-xs text-dark-400 ml-auto">
                            {perms.filter(p => selectedPermissions.includes(p.id)).length}/{perms.length} selected
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 text-sm text-dark-600 cursor-pointer hover:text-dark-800"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="h-4 w-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                              />
                              <span className="capitalize">{perm.action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-dark-200 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowPermissionsModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  Save Permissions
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
