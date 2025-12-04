'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
}

interface Menu {
  id: string;
  name: string;
  nameAr?: string;
  key: string;
  href: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

interface RoleMenu {
  roleId: string;
  menuId: string;
}

export default function RoleMenusPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [roleMenus, setRoleMenus] = useState<RoleMenu[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRoleMenus(selectedRole);
    }
  }, [selectedRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, menusRes] = await Promise.all([
        apiService.get<{ data: Role[] }>('/roles'),
        apiService.get<{ data: Menu[] }>('/menus/items'),
      ]);
      setRoles(rolesRes.data || []);
      setMenus(menusRes.data || []);
      if (rolesRes.data?.length > 0) {
        setSelectedRole(rolesRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleMenus = async (roleId: string) => {
    try {
      const response = await apiService.get<{ data: { role: any; menuItems: Menu[] } }>(`/menus/roles/${roleId}`);
      const menuItems = response.data?.menuItems || [];
      setRoleMenus(menuItems.map((item: Menu) => ({ roleId, menuId: item.id })));
    } catch (error) {
      console.error('Error fetching role menus:', error);
      setRoleMenus([]);
    }
  };

  const isMenuSelected = (menuId: string) => {
    return roleMenus.some(rm => rm.menuId === menuId);
  };

  const handleMenuToggle = async (menuId: string) => {
    const isSelected = isMenuSelected(menuId);
    setSaving(true);

    try {
      // Build the new menu IDs list
      const currentMenuIds = roleMenus.map(rm => rm.menuId);
      const newMenuIds = isSelected
        ? currentMenuIds.filter(id => id !== menuId)
        : [...currentMenuIds, menuId];

      // Update via PUT endpoint
      await apiService.put(`/menus/roles/${selectedRole}`, { menuItemIds: newMenuIds });

      // Update local state
      if (isSelected) {
        setRoleMenus(prev => prev.filter(rm => rm.menuId !== menuId));
      } else {
        setRoleMenus(prev => [...prev, { roleId: selectedRole, menuId }]);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update menu assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = async () => {
    setSaving(true);
    try {
      const menuItemIds = menus.map(m => m.id);
      await apiService.put(`/menus/roles/${selectedRole}`, { menuItemIds });
      setRoleMenus(menuItemIds.map(menuId => ({ roleId: selectedRole, menuId })));
    } catch (error: any) {
      alert(error.message || 'Failed to update menu assignments');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    setSaving(true);
    try {
      await apiService.put(`/menus/roles/${selectedRole}`, { menuItemIds: [] });
      setRoleMenus([]);
    } catch (error: any) {
      alert(error.message || 'Failed to clear menu assignments');
    } finally {
      setSaving(false);
    }
  };

  // Group menus by parent
  const topLevelMenus = menus.filter(m => !m.parentId);
  const childMenus = menus.filter(m => m.parentId);

  const getChildMenus = (parentId: string) => childMenus.filter(m => m.parentId === parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Role Menu Mapping</h1>
        <p className="text-dark-500 dark:text-dark-400 text-sm">Configure which menus are accessible to each role</p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-dark-500">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role Selection */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <h3 className="font-semibold text-dark-800 dark:text-white mb-4">Select Role</h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                      selectedRole === role.id
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-dark-50 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                    }`}
                  >
                    <div className="font-medium">{role.displayName}</div>
                    <div className="text-sm opacity-75">{role.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Selection */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-dark-800 dark:text-white">
                  Menu Access for {roles.find(r => r.id === selectedRole)?.displayName}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topLevelMenus.map((menu) => {
                  const children = getChildMenus(menu.id);
                  return (
                    <div key={menu.id} className="border border-dark-200 dark:border-dark-600 rounded-xl p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMenuSelected(menu.id)}
                          onChange={() => handleMenuToggle(menu.id)}
                          disabled={saving}
                          className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                        />
                        <div>
                          <div className="font-medium text-dark-800 dark:text-white">{menu.name}</div>
                          {menu.nameAr && <div className="text-sm text-dark-500">{menu.nameAr}</div>}
                          <div className="text-xs text-dark-400">{menu.href}</div>
                        </div>
                      </label>

                      {children.length > 0 && (
                        <div className="mt-3 ml-8 space-y-2 border-l-2 border-dark-200 dark:border-dark-600 pl-4">
                          {children.map((child) => (
                            <label key={child.id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isMenuSelected(child.id)}
                                onChange={() => handleMenuToggle(child.id)}
                                disabled={saving}
                                className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                              />
                              <div>
                                <div className="text-sm text-dark-700 dark:text-dark-300">{child.name}</div>
                                <div className="text-xs text-dark-400">{child.href}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {saving && (
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 text-sm text-center">
                  Saving changes...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
