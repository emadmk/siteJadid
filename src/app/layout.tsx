import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ConditionalHeader } from '@/components/ConditionalHeader';

export const metadata: Metadata = {
  title: 'SafetyPro Store - Professional Safety Equipment',
  description: 'Premium safety equipment for professionals. ANSI certified products including safety footwear, head protection, hi-vis clothing, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <ConditionalHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
