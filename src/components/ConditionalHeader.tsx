'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function ConditionalHeader() {
  const pathname = usePathname();

  // Don't render header on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <Header />;
}
