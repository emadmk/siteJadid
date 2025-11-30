'use client';

import { usePathname } from 'next/navigation';
import { StorefrontFooter } from './storefront/layout/StorefrontFooter';

export function ConditionalFooter() {
  const pathname = usePathname();

  // Don't render footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <StorefrontFooter />;
}
