'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuItem, Role } from '@/types';

interface RoleWithMenus {
  id: string;
  name: string;
  displayName: string;
  isSystem: boolean;
  menuItems: MenuItem[];
}

export default function RoleMenusPage() {
  const { refreshMenuItems } = useAuth();
  const [roles, setRoles] = useState<RoleWithMenus[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleWithMenus | null>(null);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch all roles with their menu assignments
      const rolesRes = await fetch('http://localhost:4001/api/v1/menus/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch all menu items
      const menusRes = await fetch('http://localhost:4001/api/v1/menus/items?includeInactive=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (rolesRes.ok && menusRes.ok) {
        const rolesData = await rolesRes.json();
        const menusData = await menusRes.json();

        if (rolesData.success) setRoles(rolesData.data);
        if (menusData.success) setMenuItems(menusData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: RoleWithMenus) => {
    setSelectedRole(role);
    setSelectedMenus(role.menuItems.map((m) => m.id));
    setMessage(null);
  };

  const handleMenuToggle = (menuId: string) => {
    setSelectedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:4001/api/v1/menus/roles/${selectedRole.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ menuItemIds: selectedMenus }),
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'Menu permissions updated successfully' });
        // Refresh the roles data
        await fetchData();
        // Refresh the user's menu items in case their role was updated
        await refreshMenuItems();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to update permissions' });
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Role Menu Permissions</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">
          Configure which menu items each role can access in the back office
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-dark-100 dark:border-dark-700">
          <div className="p-4 border-b border-dark-100 dark:border-dark-700">
            <h2 className="font-semibold text-dark-800 dark:text-white">Roles</h2>
          </div>
          <div className="p-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedRole?.id === role.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-dark-50 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-300'
                }`}
              >
                <div className="font-medium">{role.displayName}</div>
                <div className="text-xs text-dark-500 dark:text-dark-400">
                  {role.menuItems.length} menu{role.menuItems.length !== 1 ? 's' : ''} assigned
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-dark-100 dark:border-dark-700">
          {selectedRole ? (
            <>
              <div className="p-4 border-b border-dark-100 dark:border-dark-700 flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-dark-800 dark:text-white">
                    Menu Access for {selectedRole.displayName}
                  </h2>
                  <p className="text-sm text-dark-500 dark:text-dark-400">
                    Select which menus this role can access
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menuItems.map((menu) => (
                    <label
                      key={menu.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMenus.includes(menu.id)
                          ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-dark-200 dark:border-dark-700 hover:border-dark-300 dark:hover:border-dark-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMenus.includes(menu.id)}
                        onChange={() => handleMenuToggle(menu.id)}
                        className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div>
                        <div className="font-medium text-dark-800 dark:text-white">
                          {menu.name}
                        </div>
                        <div className="text-xs text-dark-500 dark:text-dark-400">
                          {menu.href}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-dark-500 dark:text-dark-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-dark-300 dark:text-dark-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              <p>Select a role from the list to configure its menu access</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Role-Based Access Control</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>
            <strong>Admin:</strong> Has access to all menus and can configure permissions for other roles
          </li>
          <li>
            <strong>Manager:</strong> Full operational access except system settings
          </li>
          <li>
            <strong>Technician:</strong> Limited to Service Requests (filtered by assigned zones)
          </li>
          <li>
            <strong>Receptionist:</strong> Customer-facing operations only
          </li>
        </ul>
      </div>
    </div>
  );
}
