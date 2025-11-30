'use client';

import { usePathname } from 'next/navigation';
import { CartDrawer } from './storefront/cart/CartDrawer';
import { AuthModal } from './storefront/auth/AuthModal';
import { SearchModal } from './storefront/search/SearchModal';
import { ToastProvider } from './storefront/common/Toast';

export function GlobalModals() {
  const pathname = usePathname();

  // Don't render on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <CartDrawer />
      <AuthModal />
      <SearchModal />
      <ToastProvider />
    </>
  );
}
