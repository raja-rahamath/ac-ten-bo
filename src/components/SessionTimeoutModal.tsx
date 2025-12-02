'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

// Idle timeout: 5 minutes (300000 ms)
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
// Show warning 60 seconds before expiry
const WARNING_BEFORE_EXPIRY_MS = 60 * 1000;
// Countdown duration in seconds
const COUNTDOWN_SECONDS = 30;

function parseJwt(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function getTokenExpiry(): number | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload?.exp) return null;

  return payload.exp * 1000; // Convert to milliseconds
}

export function SessionTimeoutModal() {
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleWarningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (idleWarningTimerRef.current) {
      clearTimeout(idleWarningTimerRef.current);
      idleWarningTimerRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    logout();
  }, [clearAllTimers, logout]);

  const setupTimers = useCallback(() => {
    clearAllTimers();

    const expiry = getTokenExpiry();
    if (!expiry) return;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    const timeUntilWarning = timeUntilExpiry - WARNING_BEFORE_EXPIRY_MS;

    // If already past warning time, show warning immediately
    if (timeUntilWarning <= 0) {
      if (timeUntilExpiry > 0) {
        setShowWarning(true);
        setCountdown(Math.min(COUNTDOWN_SECONDS, Math.floor(timeUntilExpiry / 1000)));
      } else {
        // Token already expired
        handleLogout();
      }
      return;
    }

    // Set timer to show warning
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(COUNTDOWN_SECONDS);
    }, timeUntilWarning);
  }, [clearAllTimers, handleLogout]);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    // Don't reset if warning is already showing
    if (showWarning) return;

    // Clear existing idle timers
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (idleWarningTimerRef.current) {
      clearTimeout(idleWarningTimerRef.current);
    }

    // Set timer to show warning after idle timeout minus warning time
    const warningTime = IDLE_TIMEOUT_MS - (COUNTDOWN_SECONDS * 1000);
    idleWarningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(COUNTDOWN_SECONDS);
    }, warningTime);

    // Set timer to logout after full idle timeout (backup)
    idleTimerRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT_MS);
  }, [showWarning, handleLogout]);

  // Setup idle detection event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Start idle timer
    resetIdleTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (idleWarningTimerRef.current) {
        clearTimeout(idleWarningTimerRef.current);
      }
    };
  }, [isAuthenticated, resetIdleTimer]);

  // Start countdown when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    // Start countdown
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set logout timer as backup
    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, COUNTDOWN_SECONDS * 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [showWarning, handleLogout]);

  // Setup timers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setupTimers();
    } else {
      clearAllTimers();
      setShowWarning(false);
    }

    return () => clearAllTimers();
  }, [isAuthenticated, setupTimers, clearAllTimers]);

  // Handle stay logged in
  const handleStayLoggedIn = async () => {
    setIsRefreshing(true);

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        handleLogout();
        return;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        handleLogout();
        return;
      }

      const data = await response.json();
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }

        // Reset and hide warning
        setShowWarning(false);
        setCountdown(COUNTDOWN_SECONDS);

        // Setup new timers with refreshed token
        setupTimers();

        // Reset idle timer after successful refresh
        // Use setTimeout to ensure showWarning is false before resetting
        setTimeout(() => {
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          if (idleWarningTimerRef.current) clearTimeout(idleWarningTimerRef.current);
          const warningTime = IDLE_TIMEOUT_MS - (COUNTDOWN_SECONDS * 1000);
          idleWarningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setCountdown(COUNTDOWN_SECONDS);
          }, warningTime);
          idleTimerRef.current = setTimeout(() => {
            handleLogout();
          }, IDLE_TIMEOUT_MS);
        }, 100);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-dark-800 dark:text-white text-center mb-2">
          Session Timeout Warning
        </h2>

        {/* Message */}
        <p className="text-dark-600 dark:text-dark-300 text-center mb-6">
          Are you still working? Your session will expire due to inactivity.
        </p>

        {/* Countdown */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            {/* Background circle */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-dark-200 dark:text-dark-600"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 - (276.46 * countdown) / COUNTDOWN_SECONDS}
                className="text-amber-500 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            {/* Countdown number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-dark-800 dark:text-white">{countdown}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-dark-500 dark:text-dark-400 text-center mb-6">
          Logging out in <span className="font-semibold text-amber-600 dark:text-amber-400">{countdown} seconds</span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-3 rounded-xl border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 font-medium hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
          >
            Log Out Now
          </button>
          <button
            onClick={handleStayLoggedIn}
            disabled={isRefreshing}
            className="flex-1 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isRefreshing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Refreshing...
              </>
            ) : (
              'Stay Logged In'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
