'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  SlidersHorizontal,
  Grid3X3,
  List,
  Package,
  Star,
  ShoppingCart,
  Heart,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { getImageSize } from '@/lib/image-utils';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  salePrice: number | null;
  images: string[];
  isFeatured: boolean;
  stockQuantity: number;
  minimumOrderQty: number;
  averageRating: number;
  reviewCount: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface PageData {
  brand: Brand;
  products: Product[];
  total: number;
  pages: number;
  currentPage: number;
  categories: Category[];
  smartFilters: Record<string, string[]>;
  smartFilterLabels: Record<string, string>;
}

export default function BrandPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('price-desc');
  const [taaFilter, setTaaFilter] = useState(false);
  const [activeSmartFilters, setActiveSmartFilters] = useState<Record<string, string[]>>({});
  const [expandedFilterSections, setExpandedFilterSections] = useState<Record<string, boolean>>({});

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch brand and products
  const fetchData = useCallback(async (page: number, reset: boolean = false, overrideTaaFilter?: boolean) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort: sortBy,
      });

      if (searchQuery) queryParams.set('search', searchQuery);
      if (selectedCategory) queryParams.set('category', selectedCategory);
      if (priceRange.min) queryParams.set('minPrice', priceRange.min);
      if (priceRange.max) queryParams.set('maxPrice', priceRange.max);

      // Use override value if provided, otherwise use state
      const taaValue = overrideTaaFilter !== undefined ? overrideTaaFilter : taaFilter;
      if (taaValue) queryParams.set('taaApproved', 'true');

      const hasActiveFilters = Object.values(activeSmartFilters).some(arr => arr.length > 0);
      if (hasActiveFilters) {
        queryParams.set('filters', JSON.stringify(activeSmartFilters));
      }

      const response = await fetch(`/api/storefront/brands/${params.slug}?${queryParams}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/brands');
          return;
        }
        throw new Error('Failed to fetch brand');
      }

      const result: PageData = await response.json();

      setData(result);

      if (reset || page === 1) {
        setProducts(result.products);
        const expanded: Record<string, boolean> = {};
        Object.keys(result.smartFilters || {}).forEach((key, index) => {
          expanded[key] = index < 3;
        });
        setExpandedFilterSections(expanded);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }

      setCurrentPage(result.currentPage);
      setHasMore(result.currentPage < result.pages);
    } catch (error) {
      console.error('Error fetching brand:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [params.slug, sortBy, searchQuery, selectedCategory, priceRange, taaFilter, activeSmartFilters, router]);

  useEffect(() => {
    fetchData(1, true);
  }, [params.slug]);

  useEffect(() => {
    if (data) {
      setCurrentPage(1);
      fetchData(1, true);
    }
  }, [sortBy]);

  // Infinite scroll for pages 1-4
  useEffect(() => {
    if (loading || loadingMore || !hasMore || currentPage >= 4) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && currentPage < 4 && !loadingMore) {
        fetchData(currentPage + 1);
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, currentPage, fetchData]);

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(product.id);
    await addToCart(product.id, product.minimumOrderQty || 1);
    setAddingToCart(null);
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchData(1, true);
    setShowMobileFilters(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSortBy('price-desc');
    setTaaFilter(false);
    setActiveSmartFilters({});
    setCurrentPage(1);
    fetchData(1, true);
    setShowMobileFilters(false);
  };

  const toggleSmartFilter = (filterKey: string, value: string) => {
    setActiveSmartFilters(prev => {
      const current = prev[filterKey] || [];
      const newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      const updated = { ...prev, [filterKey]: newValues };
      if (updated[filterKey].length === 0) {
        delete updated[filterKey];
      }
      return updated;
    });
  };

  const toggleFilterSection = (key: string) => {
    setExpandedFilterSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hasActiveFilters = searchQuery || selectedCategory || priceRange.min || priceRange.max || taaFilter ||
    Object.values(activeSmartFilters).some(arr => arr.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-safety-green-600 animate-spin" />
          <p className="text-gray-600">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">Brand Not Found</h1>
          <p className="text-gray-600 mb-6">The brand you're looking for doesn't exist.</p>
          <Link href="/brands">
            <Button className="bg-safety-green-600 hover:bg-safety-green-700">
              Browse All Brands
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { brand, categories, smartFilters, smartFilterLabels } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/brands" className="text-gray-600 hover:text-safety-green-600">
              Brands
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-black font-medium">{brand.name}</span>
          </div>

          {/* Brand Info */}
          <div className="flex items-center gap-6">
            {brand.logo && (
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                {brand.name}
              </h1>
              {brand.description && (
                <p className="text-gray-600 max-w-2xl">{brand.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {data.total} {data.total === 1 ? 'product' : 'products'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500 focus:border-transparent transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                      <button
                        onClick={() => {
                          setSelectedCategory('');
                          applyFilters();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          !selectedCategory
                            ? 'bg-safety-green-50 text-safety-green-700 font-medium border border-safety-green-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setTimeout(applyFilters, 0);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                            selectedCategory === cat.slug
                              ? 'bg-safety-green-50 text-safety-green-700 font-medium border border-safety-green-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{cat.name}</span>
                            <span className="text-xs text-gray-400">{cat._count.products}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* TAA/BAA Approved Filter */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 cursor-pointer hover:shadow-sm transition-shadow">
                    <input
                      type="checkbox"
                      checked={taaFilter}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setTaaFilter(newValue);
                        fetchData(1, true, newValue);
                      }}
                      className="w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-blue-900 text-sm">TAA/BAA Approved</div>
                      <div className="text-xs text-blue-600">Government compliant</div>
                    </div>
                  </label>
                </div>

                {/* Smart Filters */}
                {Object.entries(smartFilters || {}).map(([filterKey, values]) => (
                  <div key={filterKey} className="border-t border-gray-100 pt-4">
                    <button
                      onClick={() => toggleFilterSection(filterKey)}
                      className="flex items-center justify-between w-full text-left group"
                    >
                      <span className="text-sm font-medium text-gray-900 group-hover:text-safety-green-600 transition-colors">
                        {smartFilterLabels[filterKey] || filterKey}
                      </span>
                      <div className="flex items-center gap-2">
                        {(activeSmartFilters[filterKey] || []).length > 0 && (
                          <span className="bg-safety-green-100 text-safety-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {activeSmartFilters[filterKey].length}
                          </span>
                        )}
                        {expandedFilterSections[filterKey] ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {expandedFilterSections[filterKey] && (
                      <div className="mt-3 space-y-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                        {values.map((value) => (
                          <label
                            key={value}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={(activeSmartFilters[filterKey] || []).includes(value)}
                              onChange={() => toggleSmartFilter(filterKey, value)}
                              className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500 focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-700">{value}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <Button onClick={applyFilters} className="w-full bg-safety-green-600 hover:bg-safety-green-700 font-medium py-2.5 rounded-lg">
                  Apply Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-safety-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                        !
                      </span>
                    )}
                  </button>

                  <div className="hidden sm:flex items-center gap-2 border-l pl-4">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-safety-green-100 text-safety-green-600' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-safety-green-100 text-safety-green-600' : 'hover:bg-gray-100'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Showing {products.length} of {data.total}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>

              {/* Mobile Filters Panel */}
              {showMobileFilters && (
                <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {categories.length > 0 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.name} ({cat._count.products})
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder="Min Price"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder="Max Price"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>

                  {/* TAA/BAA Approved Filter (Mobile) */}
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      checked={taaFilter}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setTaaFilter(newValue);
                        fetchData(1, true, newValue);
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-blue-800 text-sm">TAA/BAA Approved</div>
                      <div className="text-xs text-blue-600">Government compliant products</div>
                    </div>
                  </label>

                  <div className="flex gap-2">
                    <Button onClick={applyFilters} className="flex-1 bg-safety-green-600 hover:bg-safety-green-700">
                      Apply Filters
                    </Button>
                    {hasActiveFilters && (
                      <Button onClick={clearFilters} variant="outline" className="border-red-500 text-red-500">
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-black mb-2">No Products Found</h2>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'No products available for this brand yet'}
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} className="bg-safety-green-600 hover:bg-safety-green-700">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductGridCard
                        key={product.id}
                        product={product}
                        brandLogo={data.brand.logo}
                        isInWishlist={isInWishlist(product.id)}
                        addingToCart={addingToCart === product.id}
                        onAddToCart={(e) => handleAddToCart(product, e)}
                        onToggleWishlist={(e) => handleToggleWishlist(product.id, e)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <ProductListCard
                        key={product.id}
                        product={product}
                        brandLogo={data.brand.logo}
                        isInWishlist={isInWishlist(product.id)}
                        addingToCart={addingToCart === product.id}
                        onAddToCart={(e) => handleAddToCart(product, e)}
                        onToggleWishlist={(e) => handleToggleWishlist(product.id, e)}
                      />
                    ))}
                  </div>
                )}

                {currentPage < 4 && hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading more products...
                      </div>
                    )}
                  </div>
                )}

                {currentPage >= 4 && data.pages > 4 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fetchData(currentPage - 1, true)}
                        disabled={currentPage === 1}
                        className="border-gray-300"
                      >
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(data.pages - 3, 5) }, (_, i) => {
                          const pageNum = 4 + i;
                          if (pageNum > data.pages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? 'default' : 'outline'}
                              onClick={() => fetchData(pageNum, true)}
                              className={
                                pageNum === currentPage
                                  ? 'bg-safety-green-600 hover:bg-safety-green-700'
                                  : 'border-gray-300'
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => fetchData(currentPage + 1, true)}
                        disabled={currentPage >= data.pages}
                        className="border-gray-300"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductGridCard({
  product,
  brandLogo,
  isInWishlist,
  addingToCart,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
  brandLogo?: string | null;
  isInWishlist: boolean;
  addingToCart: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
  onToggleWishlist: (e: React.MouseEvent) => void;
}) {
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer overflow-hidden h-full flex flex-col">
        <div className="relative w-full h-56 bg-white overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={getImageSize(product.images[0], 'medium')}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
            />
          ) : brandLogo ? (
            <img
              src={brandLogo}
              alt="Brand"
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform opacity-70"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Package className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 left-2 bg-safety-green-600 text-white text-xs font-bold px-2 py-1 rounded">
              FEATURED
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onToggleWishlist}
              className={`p-2 rounded-full shadow-lg transition-colors ${
                isInWishlist
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onAddToCart}
              disabled={addingToCart || product.stockQuantity === 0}
              className="p-2 bg-safety-green-600 text-white rounded-full shadow-lg hover:bg-safety-green-700 transition-colors disabled:opacity-50"
            >
              {addingToCart ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          </div>

          {product.stockQuantity < 10 && product.stockQuantity > 0 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              Only {product.stockQuantity} left
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="text-xs text-gray-500 mb-1">{product.sku}</div>
          {product.category && (
            <div className="text-xs text-safety-green-600 font-medium mb-1">
              {product.category.name}
            </div>
          )}

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(product.averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
            </div>
          )}

          <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors flex-1">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 mt-auto">
            <span className="text-lg font-bold text-black">
              ${Number(product.salePrice || product.basePrice).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${Number(product.basePrice).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductListCard({
  product,
  brandLogo,
  isInWishlist,
  addingToCart,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
  brandLogo?: string | null;
  isInWishlist: boolean;
  addingToCart: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
  onToggleWishlist: (e: React.MouseEvent) => void;
}) {
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-lg cursor-pointer overflow-hidden flex">
        <div className="relative w-48 h-48 flex-shrink-0 bg-white overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={getImageSize(product.images[0], 'medium')}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
            />
          ) : brandLogo ? (
            <img
              src={brandLogo}
              alt="Brand"
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform opacity-70"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}
        </div>

        <div className="flex-1 p-6 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500">{product.sku}</span>
                {product.category && (
                  <span className="text-xs text-safety-green-600 font-medium">
                    {product.category.name}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-black group-hover:text-safety-green-700 transition-colors">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description}</p>
              )}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">({product.reviewCount} reviews)</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-black">
                ${Number(product.salePrice || product.basePrice).toFixed(2)}
              </div>
              {hasDiscount && (
                <div className="text-sm text-gray-500 line-through">
                  ${Number(product.basePrice).toFixed(2)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-sm">
              {product.stockQuantity > 0 ? (
                <span className="text-safety-green-600 font-medium">
                  {product.stockQuantity > 20 ? 'In Stock' : `Only ${product.stockQuantity} left`}
                </span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleWishlist}
                className={`p-2 rounded-lg border transition-colors ${
                  isInWishlist
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
              <Button
                onClick={onAddToCart}
                disabled={addingToCart || product.stockQuantity === 0}
                className="bg-safety-green-600 hover:bg-safety-green-700"
              >
                {addingToCart ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
