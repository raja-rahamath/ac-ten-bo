'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
            <svg
              style={{ margin: '0 auto 1.5rem', height: '96px', width: '96px', color: '#9ca3af' }}
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
            <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
              Something went wrong
            </h1>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              We encountered an unexpected issue. Our team has been notified and is working to fix it.
              Please try again or contact support if the problem persists.
            </p>
            {error.digest && (
              <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                Error Reference: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Go to Dashboard
              </button>
            </div>
            <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              If this issue persists, please contact your system administrator.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
