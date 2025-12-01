import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal';

export const metadata: Metadata = {
  title: 'AgentCare Backoffice',
  description: 'Admin panel for AgentCare service management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <SessionTimeoutModal />
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
