'use client';

import { useState, useEffect, useMemo } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  leaveType: {
    id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}

interface LeaveCalendarProps {
  zoneId?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-800 dark:text-green-300' },
  PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-300' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300 dark:border-red-700', text: 'text-red-800 dark:text-red-300' },
  CANCELLED: { bg: 'bg-gray-100 dark:bg-gray-900/30', border: 'border-gray-300 dark:border-gray-700', text: 'text-gray-800 dark:text-gray-300' },
};

export default function LeaveCalendar({ zoneId }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Fetch leave requests for the current month
  useEffect(() => {
    fetchLeaveRequests();
  }, [year, month, zoneId]);

  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();

      let url = `${API_URL}/leaves/requests?startDate=${startDate}&endDate=${endDate}`;
      if (zoneId) {
        url += `&zoneId=${zoneId}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLeaveRequests(data.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get leaves for a specific day
  const getLeavesForDay = (day: number) => {
    const date = new Date(year, month, day);
    return leaveRequests.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      date.setHours(12, 0, 0, 0);
      return date >= start && date <= end;
    });
  };

  // Get leaves for selected day (for detail view)
  const selectedDayLeaves = useMemo(() => {
    if (!selectedDay) return [];
    return leaveRequests.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const checkDate = new Date(selectedDay);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  }, [selectedDay, leaveRequests]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(year, month + direction, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDay) return false;
    return day === selectedDay.getDate() && month === selectedDay.getMonth() && year === selectedDay.getFullYear();
  };

  // Generate calendar grid
  const calendarDays = [];

  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-dark-100 dark:border-dark-700">
      {/* Header */}
      <div className="p-4 border-b border-dark-100 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-800 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Calendar Grid */}
        <div className="flex-1 p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-dark-500 dark:text-dark-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-24" />;
                }

                const dayLeaves = getLeavesForDay(day);
                const hasApproved = dayLeaves.some((l) => l.status === 'APPROVED');
                const hasPending = dayLeaves.some((l) => l.status === 'PENDING');

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(new Date(year, month, day))}
                    className={`h-24 p-1 rounded-lg border transition-colors text-left ${
                      isSelected(day)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : isToday(day)
                        ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'border-transparent hover:bg-dark-50 dark:hover:bg-dark-700'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(day)
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-dark-700 dark:text-dark-300'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {dayLeaves.slice(0, 3).map((leave) => (
                        <div
                          key={leave.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${STATUS_COLORS[leave.status].bg} ${STATUS_COLORS[leave.status].text}`}
                        >
                          {leave.employee.firstName}
                        </div>
                      ))}
                      {dayLeaves.length > 3 && (
                        <div className="text-xs text-dark-500 dark:text-dark-400 px-1">
                          +{dayLeaves.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Day Details */}
        <div className="w-72 border-l border-dark-100 dark:border-dark-700 p-4">
          <h3 className="font-medium text-dark-800 dark:text-white mb-3">
            {selectedDay
              ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Select a day'}
          </h3>

          {selectedDay && selectedDayLeaves.length === 0 && (
            <p className="text-sm text-dark-500 dark:text-dark-400">No leave requests for this day</p>
          )}

          <div className="space-y-3">
            {selectedDayLeaves.map((leave) => (
              <div
                key={leave.id}
                className={`p-3 rounded-lg border ${STATUS_COLORS[leave.status].border} ${STATUS_COLORS[leave.status].bg}`}
              >
                <div className={`font-medium ${STATUS_COLORS[leave.status].text}`}>
                  {leave.employee.firstName} {leave.employee.lastName}
                </div>
                <div className="text-xs text-dark-600 dark:text-dark-400 mt-1">
                  {leave.leaveType.name}
                </div>
                <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </div>
                <div className={`text-xs font-medium mt-2 ${STATUS_COLORS[leave.status].text}`}>
                  {leave.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-dark-100 dark:border-dark-700 flex items-center gap-4">
        <span className="text-sm text-dark-500 dark:text-dark-400">Status:</span>
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
            <span className="text-xs text-dark-600 dark:text-dark-400">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
