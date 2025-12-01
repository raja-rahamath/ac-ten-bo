'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, MenuItem, UserZone } from '@/types';

interface AuthContextType {
  user: User | null;
  menuItems: MenuItem[];
  userZones: UserZone[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isTechnician: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  handleAuthError: () => void;
  refreshMenuItems: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('menuItems');
    localStorage.removeItem('userZones');
    setUser(null);
    setMenuItems([]);
    setUserZones([]);
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

  const refreshMenuItems = useCallback(async () => {
    await fetchMenuItems();
    await fetchUserZones();
  }, [fetchMenuItems, fetchUserZones]);

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

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));

          // Load cached menu items and zones
          if (storedMenuItems) {
            setMenuItems(JSON.parse(storedMenuItems));
          }
          if (storedUserZones) {
            setUserZones(JSON.parse(storedUserZones));
          }

          // Refresh from API in background
          fetchMenuItems();
          fetchUserZones();
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout, fetchMenuItems, fetchUserZones]);

  const login = useCallback(async (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Fetch menu items and zones after login
    await fetchMenuItems();
    await fetchUserZones();
  }, [fetchMenuItems, fetchUserZones]);

  // Check if user is a technician
  const isTechnician = user?.role?.name === 'technician';

  const value: AuthContextType = {
    user,
    menuItems,
    userZones,
    isLoading,
    isAuthenticated: !!user,
    isTechnician,
    login,
    logout,
    handleAuthError,
    refreshMenuItems,
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
