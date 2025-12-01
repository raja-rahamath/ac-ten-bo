'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ZoneCoverage {
  zoneId: string;
  zoneName: string;
  zoneNameAr?: string;
  coverageStatus: 'FULL' | 'SECONDARY' | 'PARTIAL' | 'CRITICAL';
  primaryHead?: {
    id: string;
    firstName: string;
    lastName: string;
    isOnLeave: boolean;
  };
  secondaryHead?: {
    id: string;
    firstName: string;
    lastName: string;
    isOnLeave: boolean;
  };
  activeHead?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  teamOnLeave: number;
  totalTeam: number;
}

const STATUS_CONFIG = {
  FULL: {
    color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Full Coverage',
  },
  SECONDARY: {
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    label: 'Secondary Covering',
  },
  PARTIAL: {
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    label: 'Partial Coverage',
  },
  CRITICAL: {
    color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Critical - No Coverage',
  },
};

export default function ZoneCoverageWidget() {
  const [coverageData, setCoverageData] = useState<ZoneCoverage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCoverageData();
  }, [selectedDate]);

  const fetchCoverageData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `http://localhost:4001/api/v1/zones/coverage?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCoverageData(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch coverage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Summary counts
  const summary = {
    total: coverageData.length,
    full: coverageData.filter((z) => z.coverageStatus === 'FULL').length,
    secondary: coverageData.filter((z) => z.coverageStatus === 'SECONDARY').length,
    partial: coverageData.filter((z) => z.coverageStatus === 'PARTIAL').length,
    critical: coverageData.filter((z) => z.coverageStatus === 'CRITICAL').length,
  };

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-dark-100 dark:border-dark-700">
      <div className="p-4 border-b border-dark-100 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-dark-800 dark:text-white">Zone Coverage Status</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">Real-time zone head availability</p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-700 px-3 py-1.5 text-sm text-dark-800 dark:text-white"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-dark-100 dark:border-dark-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.full}</div>
          <div className="text-xs text-dark-500 dark:text-dark-400">Full</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.secondary}</div>
          <div className="text-xs text-dark-500 dark:text-dark-400">Secondary</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.partial}</div>
          <div className="text-xs text-dark-500 dark:text-dark-400">Partial</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.critical}</div>
          <div className="text-xs text-dark-500 dark:text-dark-400">Critical</div>
        </div>
      </div>

      {/* Zone List */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : coverageData.length === 0 ? (
          <div className="text-center py-8 text-dark-500 dark:text-dark-400">
            <p>No zones configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coverageData.map((zone) => {
              const config = STATUS_CONFIG[zone.coverageStatus];
              return (
                <div
                  key={zone.zoneId}
                  className={`p-3 rounded-lg border ${config.border} ${config.color}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {config.icon}
                      <div>
                        <h4 className="font-medium">{zone.zoneName}</h4>
                        <p className="text-xs opacity-80">{config.label}</p>
                      </div>
                    </div>
                    {zone.teamOnLeave > 0 && (
                      <div className="text-xs px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                        {zone.teamOnLeave}/{zone.totalTeam} on leave
                      </div>
                    )}
                  </div>

                  {zone.activeHead && (
                    <div className="mt-2 text-xs">
                      <span className="opacity-70">Active Head: </span>
                      <span className="font-medium">
                        {zone.activeHead.firstName} {zone.activeHead.lastName}
                      </span>
                      {zone.activeHead.role === 'SECONDARY_HEAD' && (
                        <span className="ml-1 opacity-70">(Secondary)</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-dark-100 dark:border-dark-700 text-center">
        <Link
          href="/properties/zones"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          Manage Zones &rarr;
        </Link>
      </div>
    </div>
  );
}
