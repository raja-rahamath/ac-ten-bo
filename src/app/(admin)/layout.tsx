'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AIChatWidget from '@/components/AIChatWidget';
import { useTheme, colorThemes } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

// Modern SVG Icons
const Icons = {
  sun: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  key: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  palette: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  requests: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  customers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  employees: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  invoices: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  email: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  properties: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  amc: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v6a1 1 0 001 1h6" />
    </svg>
  ),
  quotes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 2v5a1 1 0 001 1h5" />
    </svg>
  ),
  receipts: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoading, isAuthenticated, logout, menuItems } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isColorThemeOpen, setIsColorThemeOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['operations', 'sales', 'hr']);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const colorThemeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
      if (colorThemeRef.current && !colorThemeRef.current.contains(event.target as Node)) {
        setIsColorThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  function handleLogout() {
    logout();
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-50 dark:bg-dark-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-500 dark:text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render admin layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:4001/api/v1/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      setPasswordSuccess(t('password-changed'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.message);
    }
  }

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New service request', message: 'Customer John requested cleaning service', time: '5 min ago', unread: true },
    { id: 2, title: 'Invoice paid', message: 'Invoice #INV-001 has been paid', time: '1 hour ago', unread: true },
    { id: 3, title: 'Employee update', message: 'New employee Sarah joined the team', time: '2 hours ago', unread: false },
  ];

  // Icon mapping for dynamic menu items
  const iconMap: Record<string, React.ReactNode> = {
    dashboard: Icons.dashboard,
    requests: Icons.requests,
    customers: Icons.customers,
    properties: Icons.properties,
    employees: Icons.employees,
    invoices: Icons.invoices,
    email: Icons.email,
    'email-templates': Icons.email,
    reports: Icons.reports,
    settings: Icons.settings,
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    leaves: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    amc: Icons.amc,
    quotes: Icons.quotes,
    receipts: Icons.receipts,
    collections: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  };

  // Grouped navigation structure
  const navGroups = [
    { href: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
    {
      id: 'operations',
      label: 'Operations',
      labelAr: 'العمليات',
      icon: Icons.requests,
      children: [
        { href: '/requests', label: 'Service Requests', icon: Icons.requests },
        { href: '/amc', label: 'AMC Contracts', icon: Icons.amc },
      ],
    },
    { href: '/customers', label: 'Customers', icon: Icons.customers },
    { href: '/properties', label: 'Properties', icon: Icons.properties },
    {
      id: 'sales',
      label: 'Sales & Billing',
      labelAr: 'المبيعات والفواتير',
      icon: Icons.invoices,
      children: [
        { href: '/quotes', label: 'Quotes', icon: Icons.quotes },
        { href: '/invoices', label: 'Invoices', icon: Icons.invoices },
        { href: '/collections', label: 'Collections', icon: iconMap.collections },
        { href: '/receipts', label: 'Receipts', icon: Icons.receipts },
      ],
    },
    {
      id: 'hr',
      label: 'HR',
      labelAr: 'الموارد البشرية',
      icon: Icons.employees,
      children: [
        { href: '/employees', label: 'Employees', icon: Icons.employees },
        { href: '/leaves', label: 'Leave Management', icon: iconMap.calendar },
      ],
    },
    { href: '/reports', label: 'Reports', icon: Icons.reports },
    { href: '/settings', label: 'Settings', icon: Icons.settings },
  ];

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Flatten for legacy compatibility - only used if API returns flat menu items
  const defaultNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { href: '/requests', label: 'Service Requests', icon: Icons.requests },
    { href: '/customers', label: 'Customers', icon: Icons.customers },
    { href: '/properties', label: 'Properties', icon: Icons.properties },
    { href: '/amc', label: 'AMC Contracts', icon: Icons.amc },
    { href: '/employees', label: 'Employees', icon: Icons.employees },
    { href: '/leaves', label: 'Leave Management', icon: iconMap.calendar },
    { href: '/invoices', label: 'Invoices', icon: Icons.invoices },
    { href: '/quotes', label: 'Quotes', icon: Icons.quotes },
    { href: '/receipts', label: 'Receipts', icon: Icons.receipts },
    { href: '/reports', label: 'Reports', icon: Icons.reports },
    { href: '/settings', label: 'Settings', icon: Icons.settings },
  ];

  // Use menu items from AuthContext if available, otherwise fall back to default
  const navItems = menuItems.length > 0
    ? menuItems.map((menu) => ({
        href: menu.href,
        label: language === 'ar' && menu.nameAr ? menu.nameAr : menu.name,
        icon: iconMap[menu.icon || menu.key] || Icons.dashboard,
      }))
    : defaultNavItems;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex min-h-screen bg-dark-50 dark:bg-dark-900">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen bg-dark-900 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
          ${isMobileSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:z-40
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-dark-700">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AgentCare</h1>
                  <p className="text-[10px] text-dark-400 -mt-0.5">Back Office</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            )}
            {/* Desktop toggle / Mobile close */}
            <button
              onClick={() => {
                // On mobile, close the sidebar
                if (window.innerWidth < 768) {
                  setIsMobileSidebarOpen(false);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
            >
              {isSidebarOpen ? Icons.close : Icons.menu}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <ul className="space-y-1">
              {navGroups.map((item: any) => (
                <li key={item.href || item.id}>
                  {item.children ? (
                    // Group with children
                    <div>
                      <button
                        onClick={() => toggleGroup(item.id)}
                        className={`sidebar-link w-full ${
                          item.children.some((c: any) => isActive(c.href)) ? 'text-primary-400' : ''
                        }`}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <span>{item.icon}</span>
                        {isSidebarOpen && (
                          <>
                            <span className="font-medium flex-1 text-left">
                              {language === 'ar' && item.labelAr ? item.labelAr : item.label}
                            </span>
                            <svg
                              className={`w-4 h-4 transition-transform ${
                                expandedGroups.includes(item.id) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                      {/* Children */}
                      {isSidebarOpen && expandedGroups.includes(item.id) && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-dark-700 pl-3">
                          {item.children.map((child: any) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`sidebar-link text-sm ${isActive(child.href) ? 'active' : ''}`}
                                onClick={() => setIsMobileSidebarOpen(false)}
                              >
                                <span className={`w-4 h-4 ${isActive(child.href) ? 'text-primary-400' : ''}`}>
                                  {child.icon}
                                </span>
                                <span className="font-medium">{child.label}</span>
                                {isActive(child.href) && (
                                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    // Simple link
                    <Link
                      href={item.href}
                      className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                      title={!isSidebarOpen ? item.label : undefined}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <span className={isActive(item.href) ? 'text-primary-400' : ''}>
                        {item.icon}
                      </span>
                      {isSidebarOpen && (
                        <span className="font-medium">{item.label}</span>
                      )}
                      {isActive(item.href) && isSidebarOpen && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout only in sidebar */}
          <div className="border-t border-dark-700 p-4">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-dark-300 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
                !isSidebarOpen ? 'justify-center' : ''
              }`}
              title={!isSidebarOpen ? 'Sign out' : undefined}
            >
              {Icons.logout}
              {isSidebarOpen && <span className="font-medium">Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ml-0 ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md border-b border-dark-100 dark:border-dark-700 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-dark-800 dark:text-white capitalize">
              {t(pathname.split('/')[1]) || t('dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Date */}
            <div className="text-sm text-dark-500 dark:text-dark-400 hidden md:block">
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-white transition-colors"
              title={theme === 'light' ? t('dark-mode') : t('light-mode')}
            >
              {theme === 'light' ? Icons.moon : Icons.sun}
            </button>

            {/* Color Theme Picker */}
            <div ref={colorThemeRef} className="relative">
              <button
                onClick={() => setIsColorThemeOpen(!isColorThemeOpen)}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-white transition-colors"
                title="Theme Color"
              >
                {Icons.palette}
              </button>
              {isColorThemeOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-100 dark:border-dark-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-dark-100 dark:border-dark-700">
                    <h3 className="font-semibold text-dark-800 dark:text-white text-sm">Theme Color</h3>
                  </div>
                  <div className="p-2 grid grid-cols-3 gap-2">
                    {colorThemes.map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => { setColorTheme(ct.id as any); setIsColorThemeOpen(false); }}
                        className={`w-10 h-10 rounded-lg transition-all ${colorTheme === ct.id ? 'ring-2 ring-offset-2 ring-dark-400 dark:ring-offset-dark-800' : 'hover:scale-110'}`}
                        style={{ backgroundColor: ct.color }}
                        title={ct.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div ref={languageRef} className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                {Icons.globe}
                <span className="text-xs font-medium uppercase">{language}</span>
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-100 dark:border-dark-700 py-1 z-50">
                  <button
                    onClick={() => { setLanguage('en'); setIsLanguageOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-50 dark:hover:bg-dark-700 ${language === 'en' ? 'text-primary-500 font-medium' : 'text-dark-700 dark:text-dark-300'}`}
                  >
                    {t('english')}
                  </button>
                  <button
                    onClick={() => { setLanguage('ar'); setIsLanguageOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-dark-50 dark:hover:bg-dark-700 ${language === 'ar' ? 'text-primary-500 font-medium' : 'text-dark-700 dark:text-dark-300'}`}
                  >
                    {t('arabic')}
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-white transition-colors relative"
              >
                {Icons.bell}
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-100 dark:border-dark-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-dark-100 dark:border-dark-700">
                    <h3 className="font-semibold text-dark-800 dark:text-white">{t('notifications')}</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700 cursor-pointer ${notif.unread ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}
                      >
                        <p className="font-medium text-sm text-dark-800 dark:text-white">{notif.title}</p>
                        <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-dark-100 dark:border-dark-700">
                    <Link href="/settings" className="text-sm text-primary-500 hover:text-primary-600">
                      {t('notification-settings')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            {user && (
              <div ref={profileRef} className="relative pl-4 border-l border-dark-200 dark:border-dark-700">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-xl px-2 py-1 transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="font-medium text-dark-800 dark:text-white text-sm">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400 capitalize">
                      {user.role?.displayName || user.role?.name || 'Admin'}
                    </p>
                  </div>
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  {Icons.chevronDown}
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-dark-800 shadow-lg border border-dark-100 dark:border-dark-700 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-dark-100 dark:border-dark-700">
                      <div className="flex items-center gap-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-dark-800 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-dark-500 dark:text-dark-400">{user.email}</p>
                          <p className="text-xs text-primary-500 capitalize">{user.role?.displayName || user.role?.name || 'Admin'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        {Icons.user}
                        <span>{t('my-profile')}</span>
                      </Link>
                      <button
                        onClick={() => { setShowChangePassword(true); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                      >
                        {Icons.key}
                        <span>{t('change-password')}</span>
                      </button>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        {Icons.settings}
                        <span>{t('settings')}</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-dark-100 dark:border-dark-700 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {Icons.logout}
                        <span>{t('sign-out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget context={{ currentPage: pathname }} />

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowChangePassword(false)}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-dark-800 dark:text-white">
                {t('change-password')}
              </h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500"
              >
                {Icons.close}
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  {t('current-password')}
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  {t('new-password')}
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                  {t('confirm-password')}
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-modern dark:bg-dark-700 dark:border-dark-600 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
