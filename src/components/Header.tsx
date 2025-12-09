'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ShoppingCart, User, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/search/SearchBar';
import { useState, useEffect } from 'react';

export function Header() {
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get cart count
  const fetchCartCount = () => {
    if (session?.user?.id) {
      fetch('/api/cart/count')
        .then(res => res.json())
        .then(data => setCartCount(data.count || 0))
        .catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [session]);

  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-safety-green-600" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-black">SafetyPro Supply</span>
              <span className="text-xs text-gray-600">Professional Safety Equipment</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/products" className="text-gray-700 hover:text-safety-green-600 font-medium transition-colors">
              Products
            </Link>
            <Link href="/compliance" className="text-gray-700 hover:text-safety-green-600 font-medium transition-colors">
              Compliance
            </Link>
            <Link href="/gsa" className="text-gray-700 hover:text-safety-green-600 font-medium transition-colors">
              GSA Contract
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-safety-green-600 font-medium transition-colors">
              Contact
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="animate-pulse flex gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : session ? (
              <>
                {/* Cart */}
                <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-safety-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-200">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    Hello, <span className="font-semibold">{session.user.name || session.user.email}</span>
                  </span>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <Link href="/account">
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                      My Account
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex py-3 border-t border-gray-100">
          <SearchBar />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            {/* Search Bar - Mobile */}
            <div className="px-4 mb-4">
              <SearchBar />
            </div>

            <nav className="flex flex-col gap-3">
              <Link
                href="/products"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/compliance"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compliance
              </Link>
              <Link
                href="/gsa"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                GSA Contract
              </Link>
              <Link
                href="/contact"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {session ? (
                <>
                  <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700 font-semibold">
                        {session.user.name || session.user.email}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          My Account
                        </Button>
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            Admin
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="w-full justify-start hover:bg-red-50 hover:text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-4 flex flex-col gap-2">
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-white">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
