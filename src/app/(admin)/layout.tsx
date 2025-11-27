'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/requests', label: 'Service Requests', icon: '📋' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/employees', label: 'Employees', icon: '👷' },
    { href: '/invoices', label: 'Invoices', icon: '💰' },
    { href: '/email-templates', label: 'Email Templates', icon: '📧' },
    { href: '/reports', label: 'Reports', icon: '📈' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 h-screen bg-primary text-white transition-all ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-blue-700 p-4">
            {isSidebarOpen && (
              <div>
                <h1 className="text-xl font-bold">AgentCare</h1>
                <p className="text-xs text-blue-200">Backoffice</p>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded p-2 hover:bg-blue-700"
            >
              {isSidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-blue-700'
                        : 'hover:bg-blue-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-blue-700 p-4">
            {user && isSidebarOpen && (
              <div className="mb-4">
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-blue-200">{user.role?.name || 'Admin'}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm hover:bg-blue-600"
            >
              {isSidebarOpen ? 'Sign out' : '🚪'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 p-8 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </main>
    </div>
  );
}
