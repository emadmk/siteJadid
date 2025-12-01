'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Clock, TrendingUp, ArrowRight, Package, Loader2 } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { getImageSize } from '@/lib/image-utils';

export function SearchModal() {
  const router = useRouter();
  const {
    query,
    results,
    isLoading,
    isOpen,
    recentSearches,
    setQuery,
    search,
    closeSearch,
    addToRecentSearches,
    clearRecentSearches,
  } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open search from context
          window.dispatchEvent(new CustomEvent('openSearch'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const maxIndex = results.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            addToRecentSearches(query);
            router.push(`/products/${results[selectedIndex].slug}`);
            closeSearch();
          } else if (query.trim()) {
            addToRecentSearches(query);
            router.push(`/products?search=${encodeURIComponent(query)}`);
            closeSearch();
          }
          break;
        case 'Escape':
          closeSearch();
          break;
      }
    },
    [results, selectedIndex, query, router, closeSearch, addToRecentSearches]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToRecentSearches(query);
      router.push(`/products?search=${encodeURIComponent(query)}`);
      closeSearch();
    }
  };

  const popularSearches = [
    'Hard hats',
    'Safety glasses',
    'Work gloves',
    'High-vis vests',
    'Steel toe boots',
    'Respirators',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSearch}
      />

      {/* Modal */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-2xl max-h-[80vh] overflow-hidden animate-slide-down">
        <div className="container mx-auto max-w-3xl">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search products, SKUs, categories..."
              className="w-full pl-16 pr-24 py-6 text-lg border-b border-gray-200 focus:outline-none"
              autoComplete="off"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
              <button
                type="button"
                onClick={closeSearch}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.trim() ? (
              // Search Results
              results.length > 0 ? (
                <div className="py-4">
                  <div className="px-6 py-2">
                    <p className="text-sm text-gray-500">
                      {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {results.map((product, index) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={() => {
                          addToRecentSearches(query);
                          closeSearch();
                        }}
                        className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                          index === selectedIndex ? 'bg-gray-50' : ''
                        }`}
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={getImageSize(product.images[0], 'thumb')}
                              alt={product.name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                            {product.category && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="text-sm text-gray-500">{product.category.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          {product.salePrice ? (
                            <div>
                              <span className="font-semibold text-safety-green-600">
                                ${Number(product.salePrice).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-400 line-through ml-2">
                                ${Number(product.basePrice).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-900">
                              ${Number(product.basePrice).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>

                  {/* View All Results */}
                  <div className="px-6 py-4 border-t border-gray-100">
                    <Link
                      href={`/products?search=${encodeURIComponent(query)}`}
                      onClick={() => {
                        addToRecentSearches(query);
                        closeSearch();
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors font-medium"
                    >
                      View all results for "{query}"
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                // No Results
                !isLoading && (
                  <div className="py-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">
                      We couldn't find any products matching "{query}"
                    </p>
                    <Link
                      href="/products"
                      onClick={closeSearch}
                      className="inline-flex items-center gap-2 text-safety-green-600 hover:text-safety-green-700 font-medium"
                    >
                      Browse all products
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )
              )
            ) : (
              // Default State - Recent & Popular
              <div className="py-6">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between px-6 mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-sm text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 px-6">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setQuery(term);
                            search(term);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div>
                  <div className="flex items-center gap-2 px-6 mb-3 text-sm font-medium text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    Popular Searches
                  </div>
                  <div className="flex flex-wrap gap-2 px-6">
                    {popularSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(term);
                          search(term);
                        }}
                        className="px-3 py-1.5 bg-safety-green-50 hover:bg-safety-green-100 rounded-full text-sm text-safety-green-700 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 px-6 pt-6 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-3">Quick Links</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/products?featured=true"
                      onClick={closeSearch}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      Featured Products
                    </Link>
                    <Link
                      href="/products?sale=true"
                      onClick={closeSearch}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      Sale Items
                    </Link>
                    <Link
                      href="/products?sort=newest"
                      onClick={closeSearch}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      New Arrivals
                    </Link>
                    <Link
                      href="/categories"
                      onClick={closeSearch}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                    >
                      All Categories
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
