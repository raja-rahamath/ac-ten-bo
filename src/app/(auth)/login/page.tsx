'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const DEV_CREDENTIALS = [
  { role: 'Admin', email: 'admin@fixitbh.com', password: 'Admin123' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const emailValue = email;
    const passwordValue = password;

    try {
      const response = await fetch('http://localhost:4001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Check if user has admin or employee role (case-insensitive)
      const allowedRoles = ['super_admin', 'admin', 'employee', 'manager', 'technician', 'receptionist'];
      const userRole = data.data.user.role?.name?.toLowerCase() || '';
      if (!allowedRoles.includes(userRole)) {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Use AuthContext login to properly set auth state
      login(data.data.accessToken, data.data.refreshToken, data.data.user);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AgentCare</h1>
              <p className="text-dark-400 text-sm">Back Office</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Manage your<br />
            <span className="gradient-text">service business</span><br />
            with ease
          </h2>
          <p className="mt-6 text-dark-300 text-lg max-w-md">
            Track requests, manage your team, and delight customers with our powerful back office platform.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-dark-500 text-sm">
            Trusted by service businesses worldwide
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-accent-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-accent-pink/10 rounded-full blur-2xl"></div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-dark-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-purple flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <h1 className="text-2xl font-bold text-dark-800">AgentCare</h1>
            </div>
            <p className="text-dark-500">Back Office</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-soft-lg">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-800">Welcome back</h2>
              <p className="text-dark-500 mt-2">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input-modern"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-dark-700">
                    Password
                  </label>
                  <button type="button" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="input-modern pr-12"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full btn-modern btn-primary h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-dark-100 text-center">
              <p className="text-dark-500 text-sm">
                Need help?{' '}
                <button className="text-primary-500 hover:text-primary-600 font-medium">
                  Contact support
                </button>
              </p>
            </div>

            {/* Dev Credentials - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm font-semibold text-amber-800">Dev Credentials</span>
                </div>
                <div className="space-y-2">
                  {DEV_CREDENTIALS.map((cred) => (
                    <button
                      key={cred.email}
                      type="button"
                      onClick={() => {
                        setEmail(cred.email);
                        setPassword(cred.password);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 transition-all text-left group"
                    >
                      <div>
                        <p className="text-sm font-medium text-dark-700">{cred.role}</p>
                        <p className="text-xs text-dark-500">{cred.email}</p>
                      </div>
                      <span className="text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to fill
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-dark-400 text-sm">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
}
