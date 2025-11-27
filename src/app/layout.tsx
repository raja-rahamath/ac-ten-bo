import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
