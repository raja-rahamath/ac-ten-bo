'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for development
    console.error('Application error:', error);

    // TODO: Send to error logging service (e.g., Sentry, LogRocket)
    // In production, you would send this to your logging service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: sendToErrorService(error, error.digest);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
          We encountered an unexpected issue. Our team has been notified and is working to fix it.
          Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-500">
            Error Reference: {error.digest}
          </p>
        )}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go to Dashboard
          </Button>
        </div>
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          If this issue persists, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
