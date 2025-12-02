import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <span className="text-8xl font-bold text-gray-200 dark:text-gray-700">404</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Page not found
        </h1>
        <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
          The page you are looking for does not exist or has been moved.
          Please check the URL or navigate back to the dashboard.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/requests">View Requests</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
