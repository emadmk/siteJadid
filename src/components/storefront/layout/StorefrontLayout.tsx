'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/contexts/CartContext';
import { AuthModalProvider } from '@/contexts/AuthModalContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { StorefrontHeader } from './StorefrontHeader';
import { StorefrontFooter } from './StorefrontFooter';
import { CartDrawer } from '../cart/CartDrawer';
import { AuthModal } from '../auth/AuthModal';
import { SearchModal } from '../search/SearchModal';
import { ToastProvider } from '../common/Toast';

interface StorefrontLayoutProps {
  children: ReactNode;
}

export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  return (
    <SessionProvider>
      <AuthModalProvider>
        <CartProvider>
          <SearchProvider>
            <div className="min-h-screen flex flex-col bg-white">
              <StorefrontHeader />
              <main className="flex-1">{children}</main>
              <StorefrontFooter />

              {/* Global Modals & Drawers */}
              <CartDrawer />
              <AuthModal />
              <SearchModal />
              <ToastProvider />
            </div>
          </SearchProvider>
        </CartProvider>
      </AuthModalProvider>
    </SessionProvider>
  );
}
