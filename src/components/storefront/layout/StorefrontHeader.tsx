'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  ClipboardList,
  LogOut,
  Settings,
  Building2,
  LayoutGrid,
} from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { MegaMenu } from './MegaMenu';
import { QuickOrderPad } from './QuickOrderPad';
import { useCart } from '@/contexts/CartContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useSearch } from '@/contexts/SearchContext';

export function StorefrontHeader() {
  const { data: session, status } = useSession();
  const { cart, openCart } = useCart();
  const { openModal: openAuthModal } = useAuthModal();
  const { openSearch } = useSearch();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/wishlist/count')
        .then(res => res.json())
        .then(data => setWishlistCount(data.count || 0))
        .catch(() => {});
    }
  }, [status]);

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const isB2B = session?.user?.accountType === 'B2B';
  const isGSA = session?.user?.accountType === 'GSA';

  return (
    <header className={`sticky top-0 z-40 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
      <AnnouncementBar />

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left - Logo & Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-safety-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-black">Ada</span>
                  <span className="text-xl font-bold text-safety-green-600">Supply</span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center ml-8">
                <button
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                    isMegaMenuOpen
                      ? 'text-safety-green-600'
                      : 'text-gray-700 hover:text-safety-green-600'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                  Categories
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setIsQuickOrderOpen(!isQuickOrderOpen)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                    isQuickOrderOpen
                      ? 'text-safety-green-600'
                      : 'text-gray-700 hover:text-safety-green-600'
                  }`}
                >
                  <ClipboardList className="w-5 h-5" />
                  Quick Order
                </button>
                {(isB2B || isGSA) && (
                  <Link
                    href={isB2B ? '/b2b/dashboard' : '/gsa/dashboard'}
                    className="flex items-center gap-2 px-4 py-2 font-medium text-gray-700 hover:text-safety-green-600 transition-colors"
                  >
                    <Building2 className="w-5 h-5" />
                    {isB2B ? 'B2B Portal' : 'GSA Portal'}
                  </Link>
                )}
              </nav>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <button
                onClick={openSearch}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <Search className="w-5 h-5" />
                <span className="text-sm">Search products, SKUs, categories...</span>
                <kbd className="hidden lg:inline-flex ml-auto px-2 py-0.5 text-xs bg-white rounded border border-gray-300">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Mobile Search */}
              <button
                onClick={openSearch}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-6 h-6" />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="hidden sm:flex relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-6 h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-safety-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {status === 'authenticated' ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-safety-green-100 rounded-full flex items-center justify-center">
                      <span className="text-safety-green-700 font-semibold text-sm">
                        {session.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 hidden lg:block" />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-black truncate">{session.user?.name}</p>
                          <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                          {(isB2B || isGSA) && (
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                              isGSA ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {isGSA ? 'GSA Account' : 'B2B Account'}
                            </span>
                          )}
                        </div>
                        <nav className="py-1">
                          <Link
                            href="/account"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            <User className="w-4 h-4" />
                            My Account
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            <Package className="w-4 h-4" />
                            My Orders
                          </Link>
                          <Link
                            href="/account/wishlist"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                          >
                            <Heart className="w-4 h-4" />
                            Wishlist
                          </Link>
                          {isAdmin && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-safety-green-600 hover:bg-gray-50"
                            >
                              <Settings className="w-4 h-4" />
                              Admin Panel
                            </Link>
                          )}
                        </nav>
                        <div className="border-t border-gray-100 pt-1">
                          <Link
                            href="/api/auth/signout"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-safety-green-600 font-medium transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">Sign In</span>
                </button>
              )}

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 p-2 lg:px-4 lg:py-2 bg-safety-green-600 text-white rounded-lg hover:bg-safety-green-700 transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden lg:inline font-medium">Cart</span>
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 lg:relative lg:top-0 lg:right-0 w-5 h-5 lg:w-auto lg:h-auto lg:px-2 lg:py-0.5 bg-black lg:bg-white/20 text-white text-xs font-bold rounded-full lg:rounded flex items-center justify-center">
                    {cart.itemCount > 99 ? '99+' : cart.itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu */}
        <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />

        {/* Quick Order Pad */}
        <QuickOrderPad isOpen={isQuickOrderOpen} onClose={() => setIsQuickOrderOpen(false)} />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-8 h-8 bg-safety-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-lg font-bold text-black">AdaSupply</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="p-4">
              {status !== 'authenticated' && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full py-3 bg-safety-green-600 text-white rounded-lg font-medium hover:bg-safety-green-700 transition-colors"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <LayoutGrid className="w-5 h-5" />
                  All Products
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Package className="w-5 h-5" />
                  Categories
                </Link>
                {status === 'authenticated' && (
                  <>
                    <Link
                      href="/account/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <ClipboardList className="w-5 h-5" />
                      My Orders
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Heart className="w-5 h-5" />
                      Wishlist
                    </Link>
                  </>
                )}
              </div>

              {status === 'authenticated' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="px-4 mb-2 text-xs font-medium text-gray-500 uppercase">Account</p>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <User className="w-5 h-5" />
                    My Account
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-safety-green-600 hover:bg-gray-50 rounded-lg"
                    >
                      <Settings className="w-5 h-5" />
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/api/auth/signout"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
