// Date formatting utility with configurable formats
// Default format is dd/mm/yyyy (Bahrain locale)

export type DateFormat = 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';

// Application-wide date format setting
// This can be loaded from user settings, localStorage, or API in the future
const DEFAULT_DATE_FORMAT: DateFormat = 'dd/mm/yyyy';

let currentDateFormat: DateFormat = DEFAULT_DATE_FORMAT;

export function setDateFormat(format: DateFormat): void {
  currentDateFormat = format;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dateFormat', format);
  }
}

export function getDateFormat(): DateFormat {
  if (typeof window !== 'undefined') {
    const storedFormat = localStorage.getItem('dateFormat') as DateFormat | null;
    if (storedFormat && ['dd/mm/yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd'].includes(storedFormat)) {
      currentDateFormat = storedFormat;
    }
  }
  return currentDateFormat;
}

/**
 * Format a date string or Date object to the configured format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const format = getDateFormat();

  switch (format) {
    case 'dd/mm/yyyy':
      return `${day}/${month}/${year}`;
    case 'mm/dd/yyyy':
      return `${month}/${day}/${year}`;
    case 'yyyy-mm-dd':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Format a date with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format a date for display with optional relative time
 */
export function formatDateRelative(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) return 'Just now';
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return formatDate(d);
}

/**
 * Get available date format options for settings
 */
export function getDateFormatOptions(): { value: DateFormat; label: string; example: string }[] {
  const exampleDate = new Date(2024, 11, 25); // Dec 25, 2024

  return [
    {
      value: 'dd/mm/yyyy',
      label: 'DD/MM/YYYY',
      example: '25/12/2024',
    },
    {
      value: 'mm/dd/yyyy',
      label: 'MM/DD/YYYY',
      example: '12/25/2024',
    },
    {
      value: 'yyyy-mm-dd',
      label: 'YYYY-MM-DD',
      example: '2024-12-25',
    },
  ];
}
