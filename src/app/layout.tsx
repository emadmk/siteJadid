import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ConditionalHeader } from '@/components/ConditionalHeader';
import { ConditionalFooter } from '@/components/ConditionalFooter';
import { GlobalModals } from '@/components/GlobalModals';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'ADA Supplies - Professional Safety Equipment',
  description: 'Your trusted source for professional safety equipment. ANSI certified products for industrial, construction, and workplace safety needs. B2B and government approved.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <GoogleAnalytics />
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Providers>
          <ConditionalHeader />
          <main className="flex-1">{children}</main>
          <ConditionalFooter />
          <GlobalModals />
        </Providers>
      </body>
    </html>
  );
}
