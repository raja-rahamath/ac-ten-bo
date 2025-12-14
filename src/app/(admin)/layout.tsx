'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

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
  const { user, isLoading, isAuthenticated, logout, menuItems, companyInfo } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isColorThemeOpen, setIsColorThemeOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasCheckedAutoExpand, setHasCheckedAutoExpand] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const colorThemeRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

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

  // Auto-expand all menu groups if content fits without scrolling
  useEffect(() => {
    // Only check once when menu items are loaded and user is authenticated
    if (hasCheckedAutoExpand || !menuItems || menuItems.length === 0 || !isSidebarOpen || !isAuthenticated) return;

    // Wait for the nav element to be rendered
    const checkAutoExpand = () => {
      if (!navRef.current) return;

      // Build set of permitted hrefs from menuItems
      const permittedSet = new Set(menuItems.map((m: any) => m.href));

      // Compute permitted nav groups (same logic as permittedNavGroups)
      const computedGroups = navGroups.map((item: any) => {
        if (!item.children) {
          return permittedSet.has(item.href) ? item : null;
        }
        const permittedChildren = item.children.filter((child: any) => permittedSet.has(child.href));
        if (permittedChildren.length > 0) {
          return { ...item, children: permittedChildren };
        }
        return null;
      }).filter(Boolean);

      // Count groups with children in the computed structure
      const groupCount = computedGroups.filter((item: any) => item.children).length;
      const totalItemCount = computedGroups.reduce((acc: number, item: any) => {
        if (item.children) {
          return acc + 1 + item.children.length; // Parent + children
        }
        return acc + 1; // Single item
      }, 0);

      // Estimate height: ~44px per item (including padding/margin)
      const estimatedExpandedHeight = totalItemCount * 44;
      const availableHeight = navRef.current.clientHeight;

      // If expanded content would fit without scrolling, auto-expand all groups
      if (estimatedExpandedHeight <= availableHeight && groupCount > 0) {
        const allGroupIds = computedGroups.filter((item: any) => item.children).map((item: any) => item.id);
        setExpandedGroups(allGroupIds);
      }

      setHasCheckedAutoExpand(true);
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkAutoExpand, 100);
    return () => clearTimeout(timeoutId);
  }, [menuItems, hasCheckedAutoExpand, isSidebarOpen, isAuthenticated]);

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
      const response = await fetch('${API_URL}/users/change-password', {
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
    orgChart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    amc: Icons.amc,
    quotes: Icons.quotes,
    receipts: Icons.receipts,
    estimates: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    collections: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    // Property icons
    building: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    unit: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    room: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    asset: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    // Reference Data icons
    database: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    zone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    block: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    road: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4m6 16h4a2 2 0 002-2V6a2 2 0 00-2-2h-4m-3 0v16m0-16l-3 4m3-4l3 4m-3 12l-3-4m3 4l3-4" />
      </svg>
    ),
    globe: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    state: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    district: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    governorate: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
    area: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    jobTitle: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    propertyType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    buildingType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    unitType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    roomType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    assetType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    complaintType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    laborRateType: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    // Administration icons
    admin: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    roleMenu: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  };

  // Grouped navigation structure
  const navGroups = [
    { href: '/dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: Icons.dashboard },
    {
      id: 'operations',
      label: 'Operations',
      labelAr: 'العمليات',
      icon: Icons.requests,
      children: [
        { href: '/requests', label: 'Service Requests', labelAr: 'طلبات الخدمة', icon: Icons.requests },
        { href: '/amc', label: 'AMC Contracts', labelAr: 'عقود الصيانة السنوية', icon: Icons.amc },
      ],
    },
    {
      id: 'customers',
      label: 'Customers',
      labelAr: 'العملاء',
      icon: Icons.customers,
      children: [
        { href: '/customers', label: 'Customers List', labelAr: 'قائمة العملاء', icon: Icons.customers },
        { href: '/customer-properties', label: 'Customer Properties', labelAr: 'عقارات العملاء', icon: Icons.properties },
      ],
    },
    {
      id: 'property',
      label: 'Property',
      labelAr: 'العقارات',
      icon: Icons.properties,
      children: [
        { href: '/properties', label: 'Properties', labelAr: 'العقارات', icon: Icons.properties },
        { href: '/buildings', label: 'Buildings', labelAr: 'المباني', icon: iconMap.building },
        { href: '/units', label: 'Units', labelAr: 'الوحدات', icon: iconMap.unit },
        { href: '/rooms', label: 'Rooms', labelAr: 'الغرف', icon: iconMap.room },
        { href: '/assets', label: 'Assets', labelAr: 'الأصول', icon: iconMap.asset },
      ],
    },
    {
      id: 'sales',
      label: 'Sales & Billing',
      labelAr: 'المبيعات والفواتير',
      icon: Icons.invoices,
      children: [
        { href: '/estimates', label: 'Estimates', labelAr: 'التقديرات', icon: iconMap.estimates },
        { href: '/quotes', label: 'Quotes', labelAr: 'عروض الأسعار', icon: Icons.quotes },
        { href: '/invoices', label: 'Invoices', labelAr: 'الفواتير', icon: Icons.invoices },
        { href: '/collections', label: 'Collections', labelAr: 'التحصيلات', icon: iconMap.collections },
        { href: '/receipts', label: 'Receipts', labelAr: 'الإيصالات', icon: Icons.receipts },
      ],
    },
    {
      id: 'hr',
      label: 'HR',
      labelAr: 'الموارد البشرية',
      icon: Icons.employees,
      children: [
        { href: '/employees', label: 'Employees', labelAr: 'الموظفين', icon: Icons.employees },
        { href: '/org-chart', label: 'Organization Chart', labelAr: 'الهيكل التنظيمي', icon: iconMap.orgChart },
        { href: '/leaves', label: 'Leave Management', labelAr: 'إدارة الإجازات', icon: iconMap.calendar },
      ],
    },
    { href: '/reports', label: 'Reports', labelAr: 'التقارير', icon: Icons.reports },
    {
      id: 'reference',
      label: 'Reference Data',
      labelAr: 'البيانات المرجعية',
      icon: iconMap.database,
      children: [
        { href: '/reference/zones', label: 'Zones', labelAr: 'المناطق', icon: iconMap.zone },
        { href: '/reference/blocks', label: 'Blocks', labelAr: 'الكتل', icon: iconMap.block },
        { href: '/reference/roads', label: 'Roads', labelAr: 'الطرق', icon: iconMap.road },
        { href: '/reference/countries', label: 'Countries', labelAr: 'الدول', icon: iconMap.globe },
        { href: '/reference/states', label: 'States', labelAr: 'الولايات', icon: iconMap.state },
        { href: '/reference/districts', label: 'Districts', labelAr: 'الأحياء', icon: iconMap.district },
        { href: '/reference/governorates', label: 'Governorates', labelAr: 'المحافظات', icon: iconMap.governorate },
        { href: '/reference/areas', label: 'Areas', labelAr: 'المناطق الفرعية', icon: iconMap.area },
        { href: '/reference/job-titles', label: 'Job Titles', labelAr: 'المسميات الوظيفية', icon: iconMap.jobTitle },
        { href: '/reference/property-types', label: 'Property Types', labelAr: 'أنواع العقارات', icon: iconMap.propertyType },
        { href: '/reference/building-types', label: 'Building Types', labelAr: 'أنواع المباني', icon: iconMap.buildingType },
        { href: '/reference/unit-types', label: 'Unit Types', labelAr: 'أنواع الوحدات', icon: iconMap.unitType },
        { href: '/reference/room-types', label: 'Room Types', labelAr: 'أنواع الغرف', icon: iconMap.roomType },
        { href: '/reference/asset-types', label: 'Asset Types', labelAr: 'أنواع الأصول', icon: iconMap.assetType },
        { href: '/reference/service-types', label: 'Service Types', labelAr: 'أنواع الخدمات', icon: iconMap.complaintType },
        { href: '/reference/labor-rate-types', label: 'Labor Rate Types', labelAr: 'أنواع أسعار العمالة', icon: iconMap.laborRateType },
      ],
    },
    {
      id: 'organization',
      label: 'Organization',
      labelAr: 'المنظمة',
      icon: iconMap.building,
      children: [
        { href: '/settings/companies', label: 'Companies', labelAr: 'الشركات', icon: iconMap.building },
        { href: '/settings/divisions', label: 'Divisions', labelAr: 'الأقسام', icon: iconMap.database },
        { href: '/settings/departments', label: 'Departments', labelAr: 'الإدارات', icon: iconMap.database },
        { href: '/settings/sections', label: 'Sections', labelAr: 'الأقسام الفرعية', icon: iconMap.database },
      ],
    },
    {
      id: 'admin',
      label: 'Administration',
      labelAr: 'الإدارة',
      icon: iconMap.admin,
      children: [
        { href: '/admin/users', label: 'Users', labelAr: 'المستخدمين', icon: iconMap.users },
        { href: '/admin/roles', label: 'Roles', labelAr: 'الأدوار', icon: iconMap.roles },
        { href: '/admin/role-menus', label: 'Role Menu Mapping', labelAr: 'ربط القوائم بالأدوار', icon: iconMap.roleMenu },
        { href: '/admin/settings', label: 'Settings', labelAr: 'الإعدادات', icon: Icons.settings },
      ],
    },
  ];

  // Build set of permitted hrefs from menuItems (role-based permissions)
  const permittedHrefs = new Set(menuItems.map((menu) => menu.href));

  // Filter menu items based on role permissions
  const filterByPermissions = (items: any[]) => {
    // If no menuItems loaded yet, show nothing (will load from API)
    if (menuItems.length === 0) return [];

    return items.map((item: any) => {
      // Single item (no children)
      if (!item.children) {
        return permittedHrefs.has(item.href) ? item : null;
      }

      // Group with children - filter children first
      const permittedChildren = item.children.filter((child: any) =>
        permittedHrefs.has(child.href)
      );

      // Only include group if it has at least one permitted child
      if (permittedChildren.length > 0) {
        return {
          ...item,
          children: permittedChildren,
        };
      }
      return null;
    }).filter(Boolean);
  };

  // Apply permission filter to navGroups
  const permittedNavGroups = filterByPermissions(navGroups);


  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Expand all groups (only permitted ones)
  const expandAllGroups = () => {
    const allGroupIds = permittedNavGroups.filter((g: any) => g.children).map((g: any) => g.id);
    setExpandedGroups(allGroupIds);
  };

  // Collapse all groups
  const collapseAllGroups = () => {
    setExpandedGroups([]);
  };

  // Filter menu items based on search
  const filterMenuItems = (items: any[]) => {
    if (!menuSearch.trim()) return items;

    const searchLower = menuSearch.toLowerCase();
    return items.map((item: any) => {
      const label = (language === 'ar' && item.labelAr ? item.labelAr : item.label).toLowerCase();
      const parentMatches = label.includes(searchLower);

      if (item.children) {
        const filteredChildren = item.children.filter((child: any) => {
          const childLabel = (language === 'ar' && child.labelAr ? child.labelAr : child.label).toLowerCase();
          return childLabel.includes(searchLower);
        });

        // Include parent if it matches or if it has matching children
        if (parentMatches || filteredChildren.length > 0) {
          return {
            ...item,
            children: parentMatches ? item.children : filteredChildren,
          };
        }
        return null;
      }

      return parentMatches ? item : null;
    }).filter(Boolean);
  };

  // Apply search filter on top of permission filter
  const filteredNavGroups = filterMenuItems(permittedNavGroups);

  // Auto-expand groups when searching
  const shouldShowExpanded = (groupId: string) => {
    if (menuSearch.trim()) return true; // Expand all when searching
    return expandedGroups.includes(groupId);
  };

  // Flatten for legacy compatibility - only used if API returns flat menu items
  const defaultNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { href: '/requests', label: 'Service Requests', icon: Icons.requests },
    { href: '/customers', label: 'Customers', icon: Icons.customers },
    { href: '/customer-properties', label: 'Customer Properties', icon: Icons.properties },
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
        className={`fixed left-0 top-0 z-50 h-screen bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-700 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
          ${isMobileSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:z-40
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-dark-200 dark:border-dark-700">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-dark-800 dark:text-white">AgentCare</h1>
                  <p className="text-[10px] text-dark-500 dark:text-dark-400 -mt-0.5">Back Office</p>
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
              className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-dark-800 dark:hover:text-white transition-colors"
            >
              {isSidebarOpen ? Icons.close : Icons.menu}
            </button>
          </div>

          {/* Search and Expand/Collapse controls - Fixed at top */}
          {isSidebarOpen && (
            <div className="sticky top-0 z-10 bg-white dark:bg-dark-900 px-3 py-3 space-y-2 border-b border-dark-100 dark:border-dark-700">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder={language === 'ar' ? 'بحث في القائمة...' : 'Search menu...'}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-dark-100 dark:bg-dark-700 border-0 text-dark-800 dark:text-white placeholder-dark-400 dark:placeholder-dark-500 focus:ring-2 focus:ring-primary-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {menuSearch && (
                  <button
                    onClick={() => setMenuSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-dark-200 dark:hover:bg-dark-600"
                  >
                    <svg className="w-3 h-3 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Expand/Collapse buttons */}
              <div className="flex gap-1">
                <button
                  onClick={expandAllGroups}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors flex items-center justify-center gap-1"
                  title={language === 'ar' ? 'توسيع الكل' : 'Expand All'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>{language === 'ar' ? 'توسيع' : 'Expand'}</span>
                </button>
                <button
                  onClick={collapseAllGroups}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors flex items-center justify-center gap-1"
                  title={language === 'ar' ? 'طي الكل' : 'Collapse All'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>{language === 'ar' ? 'طي' : 'Collapse'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav ref={navRef} className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {filteredNavGroups.map((item: any) => (
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
                                shouldShowExpanded(item.id) ? 'rotate-180' : ''
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
                      {isSidebarOpen && shouldShowExpanded(item.id) && (
                        <ul className="mt-1 ml-4 space-y-1 border-l border-dark-200 dark:border-dark-700 pl-3">
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
                                <span className="font-medium">
                                  {language === 'ar' && child.labelAr ? child.labelAr : child.label}
                                </span>
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
                      title={!isSidebarOpen ? (language === 'ar' && item.labelAr ? item.labelAr : item.label) : undefined}
                      onClick={() => setIsMobileSidebarOpen(false)}
                    >
                      <span className={isActive(item.href) ? 'text-primary-400' : ''}>
                        {item.icon}
                      </span>
                      {isSidebarOpen && (
                        <span className="font-medium">
                          {language === 'ar' && item.labelAr ? item.labelAr : item.label}
                        </span>
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
          <div className="border-t border-dark-200 dark:border-dark-700 p-4">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-dark-600 dark:text-dark-300 hover:bg-red-500/10 hover:text-red-400 transition-colors ${
                !isSidebarOpen ? 'justify-center' : ''
              }`}
              title={!isSidebarOpen ? 'Sign out' : undefined}
            >
              {Icons.logout}
              {isSidebarOpen && <span className="font-medium">{t('sign-out')}</span>}
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
            {/* Company logo and name - Clickable to show details */}
            {companyInfo && (
              <button
                onClick={() => setShowCompanyDetails(true)}
                className="flex items-center gap-3 hover:bg-dark-50 dark:hover:bg-dark-700 rounded-xl px-2 py-1.5 transition-colors"
              >
                {companyInfo.logo && (
                  <img
                    src={companyInfo.logo}
                    alt={companyInfo.name}
                    className="h-8 w-auto object-contain"
                  />
                )}
                <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
                  {language === 'ar' && companyInfo.nameAr ? companyInfo.nameAr : companyInfo.name}
                </h2>
              </button>
            )}
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

      {/* Company Details Modal */}
      {showCompanyDetails && companyInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowCompanyDetails(false); setCopySuccess(false); }}
          />
          <div className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header with logo */}
            <div className="bg-gradient-to-r from-primary-500 to-accent-purple p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {companyInfo.logo ? (
                    <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur p-2 flex items-center justify-center">
                      <img
                        src={companyInfo.logo}
                        alt={companyInfo.name}
                        className="max-h-12 max-w-12 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{companyInfo.name}</h3>
                    {companyInfo.nameAr && (
                      <p className="text-white/80 text-sm" dir="rtl">{companyInfo.nameAr}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setShowCompanyDetails(false); setCopySuccess(false); }}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {Icons.close}
                </button>
              </div>
            </div>

            {/* Contact Details - Consolidated View */}
            <div className="p-6">
              {(companyInfo.email || companyInfo.phone || companyInfo.fax || companyInfo.website || companyInfo.address || companyInfo.plusCode) ? (
                <div className="relative">
                  {/* Copy Button */}
                  <button
                    onClick={() => {
                      const details = [
                        companyInfo.name,
                        companyInfo.nameAr,
                        companyInfo.email && `Email: ${companyInfo.email}`,
                        companyInfo.phone && `Phone: ${companyInfo.phone}`,
                        companyInfo.fax && `Fax: ${companyInfo.fax}`,
                        companyInfo.website && `Website: ${companyInfo.website}`,
                        companyInfo.address && `Address: ${companyInfo.address}`,
                        companyInfo.plusCode && `Plus Code: ${companyInfo.plusCode}`,
                      ].filter(Boolean).join('\n');
                      navigator.clipboard.writeText(details);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                      copySuccess
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : 'bg-dark-100 dark:bg-dark-600 text-dark-500 dark:text-dark-400 hover:bg-dark-200 dark:hover:bg-dark-500'
                    }`}
                    title={copySuccess ? 'Copied!' : 'Copy all details'}
                  >
                    {copySuccess ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>

                  {/* Consolidated Info Card */}
                  <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-700 pr-12 space-y-2">
                    {/* Company Name */}
                    <p className="font-semibold text-dark-800 dark:text-white text-lg">{companyInfo.name}</p>
                    {companyInfo.nameAr && (
                      <p className="text-dark-600 dark:text-dark-300" dir="rtl">{companyInfo.nameAr}</p>
                    )}

                    {/* Divider */}
                    <div className="border-t border-dark-200 dark:border-dark-600 my-3"></div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-sm">
                      {companyInfo.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 dark:text-dark-400 w-16 shrink-0">Email:</span>
                          <a href={`mailto:${companyInfo.email}`} className="text-dark-800 dark:text-white hover:text-primary-500">
                            {companyInfo.email}
                          </a>
                        </div>
                      )}
                      {companyInfo.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 dark:text-dark-400 w-16 shrink-0">Phone:</span>
                          <a href={`tel:${companyInfo.phone}`} className="text-dark-800 dark:text-white hover:text-primary-500">
                            {companyInfo.phone}
                          </a>
                        </div>
                      )}
                      {companyInfo.fax && (
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 dark:text-dark-400 w-16 shrink-0">Fax:</span>
                          <span className="text-dark-800 dark:text-white">{companyInfo.fax}</span>
                        </div>
                      )}
                      {companyInfo.website && (
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 dark:text-dark-400 w-16 shrink-0">Website:</span>
                          <a
                            href={companyInfo.website.startsWith('http') ? companyInfo.website : `https://${companyInfo.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-dark-800 dark:text-white hover:text-primary-500"
                          >
                            {companyInfo.website}
                          </a>
                        </div>
                      )}
                      {companyInfo.address && (
                        <div className="flex items-start gap-2">
                          <span className="text-dark-500 dark:text-dark-400 w-16 shrink-0">Address:</span>
                          <span className="text-dark-800 dark:text-white whitespace-pre-line">{companyInfo.address}</span>
                        </div>
                      )}
                      {companyInfo.plusCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-dark-500 dark:text-dark-400 w-16 shrink-0">Plus Code:</span>
                          <a
                            href={`https://plus.codes/${encodeURIComponent(companyInfo.plusCode)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-dark-800 dark:text-white hover:text-primary-500 flex items-center gap-1"
                          >
                            {companyInfo.plusCode}
                            <svg className="w-3.5 h-3.5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Copy success message */}
                  {copySuccess && (
                    <p className="text-green-600 dark:text-green-400 text-sm mt-2 text-center">
                      Company details copied to clipboard!
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-dark-100 dark:bg-dark-700 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-dark-500 dark:text-dark-400">No contact information available</p>
                  <Link
                    href="/settings/companies"
                    onClick={() => setShowCompanyDetails(false)}
                    className="text-primary-500 hover:text-primary-600 text-sm mt-2 inline-block"
                  >
                    Add company details
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
