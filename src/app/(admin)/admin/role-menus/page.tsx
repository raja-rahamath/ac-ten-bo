'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface Role {
  id: string;
  name: string;
  displayName: string;
  dashboardWidgets?: string[];
}

// Available dashboard widgets
const DASHBOARD_WIDGETS = [
  { key: 'total_requests', label: 'Total Requests', group: 'Service Requests' },
  { key: 'new_requests', label: 'New Requests', group: 'Service Requests' },
  { key: 'in_progress_requests', label: 'In Progress Requests', group: 'Service Requests' },
  { key: 'completed_requests', label: 'Completed Requests', group: 'Service Requests' },
  { key: 'recent_requests', label: 'Recent Requests Table', group: 'Service Requests' },
  { key: 'customers', label: 'Total Customers', group: 'CRM' },
  { key: 'employees', label: 'Total Employees', group: 'HR' },
  { key: 'pending_invoices', label: 'Pending Invoices', group: 'Financial' },
  { key: 'revenue', label: 'Revenue', group: 'Financial' },
];

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

// Define menu groups for tree structure display
const MENU_GROUPS = [
  {
    group: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    keys: ['dashboard']
  },
  {
    group: 'CRM',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    keys: ['customers', 'employees']
  },
  {
    group: 'Operations',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    keys: ['service-requests', 'requests', 'work-orders', 'schedules', 'leaves']
  },
  {
    group: 'Properties',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    keys: ['properties', 'buildings', 'units', 'rooms', 'assets']
  },
  {
    group: 'Financial',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    keys: ['invoices', 'estimates', 'quotes', 'receipts', 'amc', 'collections']
  },
  {
    group: 'Inventory',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    keys: ['inventory', 'inventory-items']
  },
  {
    group: 'Reference Data',
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    keys: ['zones', 'areas', 'reference-data', 'action-templates', 'currencies', 'countries', 'states', 'blocks', 'roads', 'sections']
  },
  {
    group: 'Reports',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    keys: ['reports']
  },
  {
    group: 'Settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    keys: ['settings', 'company', 'users', 'roles', 'role-menus', 'menu-items']
  },
];

// Group widgets by category
const WIDGET_GROUPS = [
  { group: 'Service Requests', widgets: DASHBOARD_WIDGETS.filter(w => w.group === 'Service Requests') },
  { group: 'CRM', widgets: DASHBOARD_WIDGETS.filter(w => w.group === 'CRM') },
  { group: 'HR', widgets: DASHBOARD_WIDGETS.filter(w => w.group === 'HR') },
  { group: 'Financial', widgets: DASHBOARD_WIDGETS.filter(w => w.group === 'Financial') },
];

export default function RoleMenusPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [roleMenus, setRoleMenus] = useState<RoleMenu[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWidgets, setSavingWidgets] = useState(false);

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
        apiService.get<{ data: Menu[] }>('/menus/items?includeInactive=true'),
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
      // Fetch menus for role
      const response = await apiService.get<{ data: { role: any; menuItems: Menu[] } }>(`/menus/roles/${roleId}`);
      const menuItems = response.data?.menuItems || [];
      setRoleMenus(menuItems.map((item: Menu) => ({ roleId, menuId: item.id })));

      // Fetch role details to get dashboard widgets
      const roleResponse = await apiService.get<{ data: Role }>(`/roles/${roleId}`);
      const roleData = roleResponse.data;
      setDashboardWidgets(roleData?.dashboardWidgets || []);
    } catch (error) {
      console.error('Error fetching role menus:', error);
      setRoleMenus([]);
      setDashboardWidgets([]);
    }
  };

  const isMenuSelected = (menuId: string) => {
    return roleMenus.some(rm => rm.menuId === menuId);
  };

  const handleMenuToggle = async (menuId: string) => {
    const isSelected = isMenuSelected(menuId);
    setSaving(true);

    try {
      const currentMenuIds = roleMenus.map(rm => rm.menuId);
      const newMenuIds = isSelected
        ? currentMenuIds.filter(id => id !== menuId)
        : [...currentMenuIds, menuId];

      await apiService.put(`/menus/roles/${selectedRole}`, { menuItemIds: newMenuIds });

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

  const handleGroupToggle = async (groupKeys: string[]) => {
    const groupMenus = menus.filter(m =>
      groupKeys.some(key => m.key.toLowerCase().includes(key.toLowerCase()) || m.href.toLowerCase().includes(key.toLowerCase()))
    );
    const groupMenuIds = groupMenus.map(m => m.id);
    const allSelected = groupMenuIds.every(id => isMenuSelected(id));

    setSaving(true);
    try {
      const currentMenuIds = roleMenus.map(rm => rm.menuId);
      let newMenuIds: string[];

      if (allSelected) {
        newMenuIds = currentMenuIds.filter(id => !groupMenuIds.includes(id));
      } else {
        newMenuIds = [...new Set([...currentMenuIds, ...groupMenuIds])];
      }

      await apiService.put(`/menus/roles/${selectedRole}`, { menuItemIds: newMenuIds });
      setRoleMenus(newMenuIds.map(menuId => ({ roleId: selectedRole, menuId })));
    } catch (error: any) {
      alert(error.message || 'Failed to update menu assignments');
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

  // Dashboard widget toggle
  const isWidgetSelected = (widgetKey: string) => {
    return dashboardWidgets.includes(widgetKey);
  };

  const handleWidgetToggle = async (widgetKey: string) => {
    const isSelected = isWidgetSelected(widgetKey);
    setSavingWidgets(true);

    try {
      const newWidgets = isSelected
        ? dashboardWidgets.filter(w => w !== widgetKey)
        : [...dashboardWidgets, widgetKey];

      await apiService.put(`/roles/${selectedRole}`, { dashboardWidgets: newWidgets });
      setDashboardWidgets(newWidgets);
    } catch (error: any) {
      alert(error.message || 'Failed to update dashboard widget');
    } finally {
      setSavingWidgets(false);
    }
  };

  const handleWidgetGroupToggle = async (widgetKeys: string[]) => {
    const allSelected = widgetKeys.every(key => isWidgetSelected(key));
    setSavingWidgets(true);

    try {
      let newWidgets: string[];
      if (allSelected) {
        newWidgets = dashboardWidgets.filter(w => !widgetKeys.includes(w));
      } else {
        newWidgets = [...new Set([...dashboardWidgets, ...widgetKeys])];
      }

      await apiService.put(`/roles/${selectedRole}`, { dashboardWidgets: newWidgets });
      setDashboardWidgets(newWidgets);
    } catch (error: any) {
      alert(error.message || 'Failed to update dashboard widgets');
    } finally {
      setSavingWidgets(false);
    }
  };

  const handleSelectAllWidgets = async () => {
    setSavingWidgets(true);
    try {
      const allWidgetKeys = DASHBOARD_WIDGETS.map(w => w.key);
      await apiService.put(`/roles/${selectedRole}`, { dashboardWidgets: allWidgetKeys });
      setDashboardWidgets(allWidgetKeys);
    } catch (error: any) {
      alert(error.message || 'Failed to select all widgets');
    } finally {
      setSavingWidgets(false);
    }
  };

  const handleClearAllWidgets = async () => {
    setSavingWidgets(true);
    try {
      await apiService.put(`/roles/${selectedRole}`, { dashboardWidgets: [] });
      setDashboardWidgets([]);
    } catch (error: any) {
      alert(error.message || 'Failed to clear widgets');
    } finally {
      setSavingWidgets(false);
    }
  };

  // Check if all widgets in a group are selected
  const isWidgetGroupFullySelected = (widgets: typeof DASHBOARD_WIDGETS) => {
    return widgets.length > 0 && widgets.every(w => isWidgetSelected(w.key));
  };

  // Check if some widgets in a group are selected
  const isWidgetGroupPartiallySelected = (widgets: typeof DASHBOARD_WIDGETS) => {
    const selectedCount = widgets.filter(w => isWidgetSelected(w.key)).length;
    return selectedCount > 0 && selectedCount < widgets.length;
  };

  // Get menus for a specific group
  const getGroupMenus = (groupKeys: string[]) => {
    return menus.filter(m =>
      groupKeys.some(key =>
        m.key.toLowerCase().includes(key.toLowerCase()) ||
        m.href.toLowerCase().includes(`/${key.toLowerCase()}`)
      )
    ).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // Check if all menus in a group are selected
  const isGroupFullySelected = (groupKeys: string[]) => {
    const groupMenus = getGroupMenus(groupKeys);
    return groupMenus.length > 0 && groupMenus.every(m => isMenuSelected(m.id));
  };

  // Check if some menus in a group are selected
  const isGroupPartiallySelected = (groupKeys: string[]) => {
    const groupMenus = getGroupMenus(groupKeys);
    const selectedCount = groupMenus.filter(m => isMenuSelected(m.id)).length;
    return selectedCount > 0 && selectedCount < groupMenus.length;
  };

  // Count selected menus for a role
  const selectedCount = roleMenus.length;
  const totalCount = menus.length;

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

          {/* Menu Selection - Tree Structure */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-dark-800 dark:text-white">
                    Menu Access for {roles.find(r => r.id === selectedRole)?.displayName}
                  </h3>
                  <p className="text-sm text-dark-500 mt-1">
                    {selectedCount} of {totalCount} menus enabled
                  </p>
                </div>
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

              {/* Tree Structure */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto border border-dark-200 dark:border-dark-600 rounded-lg p-4">
                {MENU_GROUPS.map((group) => {
                  const groupMenus = getGroupMenus(group.keys);
                  if (groupMenus.length === 0) return null;

                  const isFullySelected = isGroupFullySelected(group.keys);
                  const isPartiallySelected = isGroupPartiallySelected(group.keys);

                  return (
                    <div key={group.group}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isFullySelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isPartiallySelected;
                            }}
                            onChange={() => handleGroupToggle(group.keys)}
                            disabled={saving}
                            className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={group.icon} />
                            </svg>
                          </div>
                          <span className="font-medium text-dark-800 dark:text-white">{group.group}</span>
                          <span className="text-xs text-dark-400 bg-dark-100 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                            {groupMenus.filter(m => isMenuSelected(m.id)).length}/{groupMenus.length}
                          </span>
                        </div>
                      </label>

                      <div className="ml-8 mt-3 flex flex-wrap gap-2">
                        {groupMenus.map((menu) => (
                          <label
                            key={menu.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                              isMenuSelected(menu.id)
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                                : 'bg-white dark:bg-dark-700 border-dark-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isMenuSelected(menu.id)}
                              onChange={() => handleMenuToggle(menu.id)}
                              disabled={saving}
                              className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm ${isMenuSelected(menu.id) ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-dark-600 dark:text-dark-400'}`}>
                                {menu.name}
                              </span>
                              {menu.nameAr && (
                                <span className="text-xs text-dark-400">{menu.nameAr}</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Ungrouped menus */}
                {(() => {
                  const allGroupedKeys = MENU_GROUPS.flatMap(g => g.keys);
                  const ungroupedMenus = menus.filter(m =>
                    !allGroupedKeys.some(key =>
                      m.key.toLowerCase().includes(key.toLowerCase()) ||
                      m.href.toLowerCase().includes(`/${key.toLowerCase()}`)
                    )
                  );

                  if (ungroupedMenus.length === 0) return null;

                  return (
                    <div>
                      <label className="flex items-center gap-3">
                        <div className="w-5 h-5"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center text-dark-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                          </div>
                          <span className="font-medium text-dark-800 dark:text-white">Other</span>
                          <span className="text-xs text-dark-400 bg-dark-100 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                            {ungroupedMenus.filter(m => isMenuSelected(m.id)).length}/{ungroupedMenus.length}
                          </span>
                        </div>
                      </label>

                      <div className="ml-8 mt-3 flex flex-wrap gap-2">
                        {ungroupedMenus.map((menu) => (
                          <label
                            key={menu.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                              isMenuSelected(menu.id)
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                                : 'bg-white dark:bg-dark-700 border-dark-200 dark:border-dark-600 hover:border-primary-300 dark:hover:border-primary-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isMenuSelected(menu.id)}
                              onChange={() => handleMenuToggle(menu.id)}
                              disabled={saving}
                              className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm ${isMenuSelected(menu.id) ? 'text-primary-700 dark:text-primary-300 font-medium' : 'text-dark-600 dark:text-dark-400'}`}>
                                {menu.name}
                              </span>
                              {menu.nameAr && (
                                <span className="text-xs text-dark-400">{menu.nameAr}</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {saving && (
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 text-sm text-center">
                  Saving changes...
                </div>
              )}
            </div>

            {/* Dashboard Widgets Section */}
            <div className="card p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-dark-800 dark:text-white">
                    Dashboard Widgets for {roles.find(r => r.id === selectedRole)?.displayName}
                  </h3>
                  <p className="text-sm text-dark-500 mt-1">
                    {dashboardWidgets.length} of {DASHBOARD_WIDGETS.length} widgets enabled
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllWidgets}
                    disabled={savingWidgets}
                    className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAllWidgets}
                    disabled={savingWidgets}
                    className="px-3 py-1.5 text-sm rounded-lg border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 disabled:opacity-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Widget Groups */}
              <div className="space-y-4 border border-dark-200 dark:border-dark-600 rounded-lg p-4">
                {WIDGET_GROUPS.map((group) => {
                  if (group.widgets.length === 0) return null;

                  const widgetKeys = group.widgets.map(w => w.key);
                  const isFullySelected = isWidgetGroupFullySelected(group.widgets);
                  const isPartiallySelected = isWidgetGroupPartiallySelected(group.widgets);

                  return (
                    <div key={group.group}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isFullySelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isPartiallySelected;
                            }}
                            onChange={() => handleWidgetGroupToggle(widgetKeys)}
                            disabled={savingWidgets}
                            className="w-5 h-5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                          </div>
                          <span className="font-medium text-dark-800 dark:text-white">{group.group}</span>
                          <span className="text-xs text-dark-400 bg-dark-100 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                            {group.widgets.filter(w => isWidgetSelected(w.key)).length}/{group.widgets.length}
                          </span>
                        </div>
                      </label>

                      <div className="ml-8 mt-3 flex flex-wrap gap-2">
                        {group.widgets.map((widget) => (
                          <label
                            key={widget.key}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                              isWidgetSelected(widget.key)
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                                : 'bg-white dark:bg-dark-700 border-dark-200 dark:border-dark-600 hover:border-amber-300 dark:hover:border-amber-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isWidgetSelected(widget.key)}
                              onChange={() => handleWidgetToggle(widget.key)}
                              disabled={savingWidgets}
                              className="w-4 h-4 rounded border-dark-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className={`text-sm ${isWidgetSelected(widget.key) ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-dark-600 dark:text-dark-400'}`}>
                              {widget.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {savingWidgets && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400 text-sm text-center">
                  Saving widget changes...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
