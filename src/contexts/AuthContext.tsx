'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, MenuItem, UserZone } from '@/types';

interface CompanyInfo {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  address?: string;
  plusCode?: string;
}

interface OnboardingStatus {
  setupMode: 'none' | 'quick' | 'detailed';
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  isCompleted: boolean;
  minimumMet: boolean;
}

interface AuthContextType {
  user: User | null;
  menuItems: MenuItem[];
  userZones: UserZone[];
  companyInfo: CompanyInfo | null;
  onboardingStatus: OnboardingStatus | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isTechnician: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  handleAuthError: () => void;
  refreshMenuItems: () => Promise<void>;
  refreshCompanyInfo: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Event emitter for auth errors (to be used by API client)
type AuthErrorListener = () => void;
const authErrorListeners: Set<AuthErrorListener> = new Set();

export function subscribeToAuthErrors(listener: AuthErrorListener) {
  authErrorListeners.add(listener);
  return () => authErrorListeners.delete(listener);
}

export function emitAuthError() {
  authErrorListeners.forEach((listener) => listener());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [userZones, setUserZones] = useState<UserZone[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('menuItems');
    localStorage.removeItem('userZones');
    localStorage.removeItem('companyInfo');
    localStorage.removeItem('onboardingStatus');
    setUser(null);
    setMenuItems([]);
    setUserZones([]);
    setCompanyInfo(null);
    setOnboardingStatus(null);
    router.push('/login');
  }, [router]);

  const handleAuthError = useCallback(() => {
    logout();
  }, [logout]);

  // Fetch menu items from API
  const fetchMenuItems = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:4001/api/v1/menus/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMenuItems(data.data);
          localStorage.setItem('menuItems', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  }, []);

  // Fetch user zones from API
  const fetchUserZones = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:4001/api/v1/menus/me/zones', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserZones(data.data);
          localStorage.setItem('userZones', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('Failed to fetch user zones:', error);
    }
  }, []);

  // Fetch primary company info from API
  // Uses /companies/primary endpoint which returns primary company or fallback to first by name
  const fetchCompanyInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:4001/api/v1/companies/primary', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const company = data.data;
          const info: CompanyInfo = {
            id: company.id,
            name: company.name,
            nameAr: company.nameAr,
            logo: company.logo,
            email: company.email,
            phone: company.phone,
            fax: company.fax,
            website: company.website,
            address: company.address,
            plusCode: company.plusCode,
          };
          setCompanyInfo(info);
          localStorage.setItem('companyInfo', JSON.stringify(info));
        }
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
    }
  }, []);

  // Fetch onboarding status from API
  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:4001/api/v1/onboarding/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const status: OnboardingStatus = {
            setupMode: data.data.setupMode,
            currentStep: data.data.currentStep,
            totalSteps: data.data.totalSteps,
            completionPercentage: data.data.completionPercentage,
            isCompleted: data.data.isCompleted,
            minimumMet: data.data.minimumMet,
          };
          setOnboardingStatus(status);
          localStorage.setItem('onboardingStatus', JSON.stringify(status));
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error);
    }
  }, []);

  const refreshMenuItems = useCallback(async () => {
    await fetchMenuItems();
    await fetchUserZones();
  }, [fetchMenuItems, fetchUserZones]);

  const refreshCompanyInfo = useCallback(async () => {
    await fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const refreshOnboardingStatus = useCallback(async () => {
    await fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  // Subscribe to auth errors from API client
  useEffect(() => {
    const unsubscribe = subscribeToAuthErrors(handleAuthError);
    return () => {
      unsubscribe();
    };
  }, [handleAuthError]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      const storedMenuItems = localStorage.getItem('menuItems');
      const storedUserZones = localStorage.getItem('userZones');
      const storedCompanyInfo = localStorage.getItem('companyInfo');
      const storedOnboardingStatus = localStorage.getItem('onboardingStatus');

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));

          // Load cached menu items, zones, company info, and onboarding status
          if (storedMenuItems) {
            setMenuItems(JSON.parse(storedMenuItems));
          }
          if (storedUserZones) {
            setUserZones(JSON.parse(storedUserZones));
          }
          if (storedCompanyInfo) {
            setCompanyInfo(JSON.parse(storedCompanyInfo));
          }
          if (storedOnboardingStatus) {
            setOnboardingStatus(JSON.parse(storedOnboardingStatus));
          }

          // Refresh from API in background
          fetchMenuItems();
          fetchUserZones();
          fetchCompanyInfo();
          fetchOnboardingStatus();
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout, fetchMenuItems, fetchUserZones, fetchCompanyInfo, fetchOnboardingStatus]);

  const login = useCallback(async (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Fetch menu items, zones, company info, and onboarding status after login
    await fetchMenuItems();
    await fetchUserZones();
    await fetchCompanyInfo();
    await fetchOnboardingStatus();
  }, [fetchMenuItems, fetchUserZones, fetchCompanyInfo, fetchOnboardingStatus]);

  // Check if user is a technician
  const isTechnician = user?.role?.name === 'technician';

  const value: AuthContextType = {
    user,
    menuItems,
    userZones,
    companyInfo,
    onboardingStatus,
    isLoading,
    isAuthenticated: !!user,
    isTechnician,
    login,
    logout,
    handleAuthError,
    refreshMenuItems,
    refreshCompanyInfo,
    refreshOnboardingStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
