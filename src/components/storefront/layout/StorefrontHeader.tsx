'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Home,
  Mail,
} from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { MegaMenu } from './MegaMenu';
import { QuickOrderPad } from './QuickOrderPad';
import { useCart } from '@/contexts/CartContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useSearch } from '@/contexts/SearchContext';

export function StorefrontHeader() {
  const { data: session, status, update: updateSession } = useSession();
  const { cart, openCart } = useCart();
  const { openModal: openAuthModal } = useAuthModal();
  const { openSearch } = useSearch();
  const router = useRouter();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationResent, setVerificationResent] = useState(false);
  const [emailJustVerified, setEmailJustVerified] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle email verification redirect - refresh session immediately
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('email-verified');
    if (verified === 'true') {
      setEmailJustVerified(true);
      // Force session refresh to get updated emailVerified
      updateSession();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('email-verified');
      router.replace(url.pathname + url.search, { scroll: false });
      // Hide success message after 8 seconds
      setTimeout(() => setEmailJustVerified(false), 8000);
    }
  }, [updateSession, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/wishlist/count')
        .then(res => res.json())
        .then(data => setWishlistCount(data.count || 0))
        .catch(() => {});
    }
  }, [status]);

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  const isB2B = session?.user?.accountType === 'B2B' || session?.user?.accountType === 'VOLUME_BUYER';
  const isGSA = session?.user?.accountType === 'GSA' || session?.user?.accountType === 'GOVERNMENT';
  const accountType = session?.user?.accountType;
  const approvalStatus = (session?.user as any)?.approvalStatus || (session?.user as any)?.gsaApprovalStatus;
  const isPendingApproval = (isB2B || isGSA) && approvalStatus === 'PENDING';
  const isEmailUnverified = status === 'authenticated' && !(session?.user as any)?.emailVerified && !emailJustVerified;

  const handleResendVerification = async () => {
    if (resendingVerification || !session?.user?.email) return;
    setResendingVerification(true);
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });
      setVerificationResent(true);
      setTimeout(() => setVerificationResent(false), 10000);
    } catch {
      // silently fail
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <header className={`sticky top-0 z-40 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
      {/* Email Verified Success Banner */}
      {emailJustVerified && (
        <div className="bg-green-600 text-white py-2.5 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Email verified successfully! You now have full access to all features.</span>
          </div>
        </div>
      )}

      {/* Email Verification Warning Banner */}
      {isEmailUnverified && (
        <div className="bg-orange-500 text-white py-2.5 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>Please verify your email to access all features.</span>
            {verificationResent ? (
              <span className="ml-2 text-orange-100">Verification email sent! Check your inbox.</span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification}
                className="ml-2 underline hover:no-underline disabled:opacity-50"
              >
                {resendingVerification ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Approval Warning Banner */}
      {isPendingApproval && (
        <div className="bg-yellow-500 text-yellow-900 py-2 px-4">
          <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Your {isGSA ? 'Government' : 'Volume Buyer'} account is pending approval. Some features may be limited.
            <Link href="/account" className="underline hover:no-underline ml-2">
              View Status
            </Link>
          </div>
        </div>
      )}
      <AnnouncementBar />

      {/* Main Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Left - Logo & Tagline */}
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
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/imagesite/logo.png"
                  alt="ADA Supplies"
                  width={60}
                  height={60}
                  className="w-12 h-12 lg:w-14 lg:h-14 object-contain"
                  quality={100}
                  unoptimized
                />
                {/* Separator & Tagline */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-px h-10 bg-gray-300"></div>
                  <span className="text-lg lg:text-xl font-medium text-safety-green-600 italic">
                    Safety Done Right!
                  </span>
                </div>
              </Link>
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
                              isGSA ? 'bg-safety-green-100 text-safety-green-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {isGSA ? 'Government' : 'Volume Buyer'}
                            </span>
                          )}
                          {isPendingApproval && (
                            <span className="inline-block mt-1 ml-1 px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                              Pending Approval
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
                  <span className="hidden lg:inline">Sign In / Register</span>
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
      </div>

      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 hidden lg:block">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center gap-1">
            {/* Home */}
            <Link
              href="/"
              className="px-4 py-3 font-medium text-gray-700 hover:text-safety-green-600 hover:bg-gray-50 transition-colors"
            >
              Home
            </Link>

            {/* Quick Order */}
            <button
              onClick={() => setIsQuickOrderOpen(!isQuickOrderOpen)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                isQuickOrderOpen
                  ? 'text-safety-green-600 bg-safety-green-50'
                  : 'text-gray-700 hover:text-safety-green-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              Quick Order
            </button>

            {/* All Categories Mega Menu */}
            <button
              onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                isMegaMenuOpen
                  ? 'text-safety-green-600 bg-safety-green-50'
                  : 'text-gray-700 hover:text-safety-green-600 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              All Categories
              <ChevronDown className={`w-4 h-4 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Brands Link */}
            <Link
              href="/brands"
              className="px-4 py-3 font-medium text-gray-700 hover:text-safety-green-600 hover:bg-gray-50 transition-colors"
            >
              Brands
            </Link>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200 mx-2"></div>

            {/* Navigation Links */}
            <Link
              href="/about"
              className="px-4 py-3 font-medium text-gray-700 hover:text-safety-green-600 hover:bg-gray-50 transition-colors"
            >
              About us
            </Link>
            <Link
              href="/gsa"
              className="px-4 py-3 font-medium text-gray-700 hover:text-safety-green-600 hover:bg-gray-50 transition-colors"
            >
              Government Buyer
            </Link>
            <Link
              href="/contact"
              className="px-4 py-3 font-medium text-gray-700 hover:text-safety-green-600 hover:bg-gray-50 transition-colors"
            >
              Contact us
            </Link>

            {/* B2B Portal - Only for B2B users */}
            {isB2B && (
              <>
                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                <Link
                  href="/b2b/dashboard"
                  className="flex items-center gap-2 px-4 py-3 font-medium text-gray-700 hover:text-safety-green-600 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="w-5 h-5" />
                  B2B Portal
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mega Menu */}
        <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />

        {/* Quick Order Pad */}
        <QuickOrderPad isOpen={isQuickOrderOpen} onClose={() => setIsQuickOrderOpen(false)} />
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Image
                  src="/images/imagesite/logo.png"
                  alt="ADA Supplies"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  quality={100}
                  unoptimized
                />
                <span className="text-lg font-bold text-safety-green-600">ADA Supplies</span>
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

              <div className="space-y-1">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <Home className="w-5 h-5" />
                  Home
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <LayoutGrid className="w-5 h-5" />
                  Categories
                </Link>
                <Link
                  href="/brands"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Brands
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  About us
                </Link>
                <Link
                  href="/gsa"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Government Buyer
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Contact us
                </Link>
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
                  <Link
                    href="/account/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    <Package className="w-5 h-5" />
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
