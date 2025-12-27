'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  ShieldCheck,
  X,
  Star,
  ShoppingCart,
  Heart,
  Loader2,
  Search,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { getImageSize } from '@/lib/image-utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    products: number;
  };
}

interface Brand {
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
  averageRating: number;
  reviewCount: number;
  hasVariants?: boolean;
  _count?: {
    variants: number;
  };
  category?: {
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
  };
}

interface ProductsListingProps {
  initialProducts: Product[];
  initialTotal: number;
  initialPages: number;
  categories: Category[];
  brands: Brand[];
  initialFilters: {
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    featured?: string;
  };
}

export function ProductsListing({
  initialProducts,
  initialTotal,
  initialPages,
  categories,
  brands,
  initialFilters,
}: ProductsListingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [pages, setPages] = useState(initialPages);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPages > 1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedBrand, setSelectedBrand] = useState(initialFilters.brand || '');
  const [priceRange, setPriceRange] = useState({
    min: initialFilters.minPrice || '',
    max: initialFilters.maxPrice || '',
  });
  const [sortBy, setSortBy] = useState(initialFilters.sort || 'newest');
  const [featured, setFeatured] = useState(initialFilters.featured === 'true');
  const [taaApproved, setTaaApproved] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Track if this is initial mount
  const isInitialMount = useRef(true);
  const prevSearchParams = useRef(searchParams.toString());

  // Sync filter state with URL changes (when navigating from header search)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only run if URL actually changed
    const currentParams = searchParams.toString();
    if (currentParams === prevSearchParams.current) {
      return;
    }
    prevSearchParams.current = currentParams;

    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    const urlBrand = searchParams.get('brand') || '';
    const urlMinPrice = searchParams.get('minPrice') || '';
    const urlMaxPrice = searchParams.get('maxPrice') || '';
    const urlSort = searchParams.get('sort') || 'newest';
    const urlFeatured = searchParams.get('featured') === 'true';

    setSearchQuery(urlSearch);
    setSelectedCategory(urlCategory);
    setSelectedBrand(urlBrand);
    setPriceRange({ min: urlMinPrice, max: urlMaxPrice });
    setSortBy(urlSort);
    setFeatured(urlFeatured);
    setCurrentPage(1);
    setProducts([]);
    setLoading(true);

    // Fetch with new params directly
    const fetchNewProducts = async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '20');

        if (urlSearch) params.set('search', urlSearch);
        if (urlCategory) params.set('category', urlCategory);
        if (urlBrand) params.set('brand', urlBrand);
        if (urlMinPrice) params.set('minPrice', urlMinPrice);
        if (urlMaxPrice) params.set('maxPrice', urlMaxPrice);
        if (urlSort) params.set('sort', urlSort);
        if (urlFeatured) params.set('featured', 'true');

        const response = await fetch(`/api/storefront/products?${params}`);
        const data = await response.json();

        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
        setCurrentPage(data.currentPage);
        setHasMore(data.currentPage < data.pages);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewProducts();
  }, [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async (page: number, reset: boolean = false) => {
    if (page === 1 && reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');

      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedBrand) params.set('brand', selectedBrand);
      if (priceRange.min) params.set('minPrice', priceRange.min);
      if (priceRange.max) params.set('maxPrice', priceRange.max);
      if (sortBy) params.set('sort', sortBy);
      if (featured) params.set('featured', 'true');
      if (taaApproved) params.set('taaApproved', 'true');

      const response = await fetch(`/api/storefront/products?${params}`);
      const data = await response.json();

      if (reset || page === 1) {
        setProducts(data.products);
      } else {
        setProducts(prev => [...prev, ...data.products]);
      }

      setTotal(data.total);
      setPages(data.pages);
      setCurrentPage(data.currentPage);
      setHasMore(data.currentPage < data.pages);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedCategory, selectedBrand, priceRange, sortBy, featured, taaApproved]);

  // Infinite scroll for pages 1-5
  useEffect(() => {
    if (loading || loadingMore || !hasMore || currentPage >= 5) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && currentPage < 5 && !loadingMore) {
        fetchProducts(currentPage + 1);
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
  }, [loading, loadingMore, hasMore, currentPage, fetchProducts]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1, true);
    updateURL({
      search: searchQuery,
      category: selectedCategory,
      brand: selectedBrand,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      featured: featured ? 'true' : '',
    });
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    setTimeout(() => {
      fetchProducts(1, true);
      updateURL({
        search: searchQuery,
        category: slug,
        brand: selectedBrand,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sort: sortBy,
        featured: featured ? 'true' : '',
      });
    }, 0);
  };

  const handleBrandChange = (slug: string) => {
    setSelectedBrand(slug);
    setCurrentPage(1);
    setTimeout(() => {
      fetchProducts(1, true);
      updateURL({
        search: searchQuery,
        category: selectedCategory,
        brand: slug,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sort: sortBy,
        featured: featured ? 'true' : '',
      });
    }, 0);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
    setTimeout(() => {
      fetchProducts(1, true);
      updateURL({
        search: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sort: value,
        featured: featured ? 'true' : '',
      });
    }, 0);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchProducts(1, true);
    updateURL({
      search: searchQuery,
      category: selectedCategory,
      brand: selectedBrand,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      sort: sortBy,
      featured: featured ? 'true' : '',
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setFeatured(false);
    setTaaApproved(false);
    setCurrentPage(1);
    router.push('/products');
    setTimeout(() => fetchProducts(1, true), 0);
    setShowFilters(false);
  };

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(product.id);
    await addToCart(product.id, 1);
    setAddingToCart(null);
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand || priceRange.min || priceRange.max || featured || taaApproved;

  const activeCategory = categories.find(c => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-black font-medium">
              {activeCategory ? activeCategory.name : 'All Products'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">
            {activeCategory ? activeCategory.name : 'All Safety Equipment'}
          </h1>
          <p className="text-gray-600">
            {total.toLocaleString()} {total === 1 ? 'product' : 'products'} available
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-black">Filters</h2>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">Search</label>
                <form onSubmit={handleSearch}>
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
                  <Button type="submit" className="w-full mt-2 bg-safety-green-600 hover:bg-safety-green-700">
                    Search
                  </Button>
                </form>
              </div>

              {/* Brands - First filter after search */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Brands</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleBrandChange('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedBrand
                        ? 'bg-safety-green-100 text-safety-green-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Brands
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleBrandChange(brand.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedBrand === brand.slug
                          ? 'bg-safety-green-100 text-safety-green-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{brand.name}</span>
                        <span className="text-xs text-gray-500">{brand._count.products}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Categories</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !selectedCategory
                        ? 'bg-safety-green-100 text-safety-green-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.slug
                          ? 'bg-safety-green-100 text-safety-green-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">{category._count.products}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Price Range</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder="$0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder="$1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <Button onClick={applyFilters} className="w-full bg-safety-green-600 hover:bg-safety-green-700">
                    Apply Filter
                  </Button>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-black mb-3">Quick Filters</h3>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => {
                      setFeatured(e.target.checked);
                      setTimeout(applyFilters, 0);
                    }}
                    className="w-4 h-4 text-safety-green-600 rounded focus:ring-safety-green-500"
                  />
                  <span className="text-sm text-gray-700">Featured Products Only</span>
                </label>
              </div>

              {/* TAA/BAA Approved Filter */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taaApproved}
                    onChange={(e) => {
                      setTaaApproved(e.target.checked);
                      setTimeout(applyFilters, 0);
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-blue-800">TAA/BAA Approved</div>
                    <div className="text-xs text-blue-600">Government compliant products</div>
                  </div>
                </label>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full border-red-500 text-red-500 hover:bg-red-50"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {/* Mobile Filter Button & Sort Bar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
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

                  {/* View Mode Toggle */}
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
                    Showing {products.length} of {total}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                  </select>
                </div>
              </div>

              {/* Mobile Filters Panel */}
              {showFilters && (
                <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Search */}
                  <form onSubmit={handleSearch}>
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
                  </form>

                  {/* Brand Select */}
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.slug}>
                        {brand.name} ({brand._count.products})
                      </option>
                    ))}
                  </select>

                  {/* Category Select */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name} ({cat._count.products})
                      </option>
                    ))}
                  </select>

                  {/* Price Range */}
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

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-safety-green-600 animate-spin" />
                  <p className="text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search term
                </p>
                <Button onClick={clearFilters} className="bg-safety-green-600 hover:bg-safety-green-700">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductGridCard
                        key={product.id}
                        product={product}
                        isInWishlist={isInWishlist(product.id)}
                        addingToCart={addingToCart === product.id}
                        onAddToCart={(e) => handleAddToCart(product, e)}
                        onToggleWishlist={(e) => handleToggleWishlist(product.id, e)}
                      />
                    ))}
                  </div>
                ) : (
                  /* List View */
                  <div className="space-y-4">
                    {products.map((product) => (
                      <ProductListCard
                        key={product.id}
                        product={product}
                        isInWishlist={isInWishlist(product.id)}
                        addingToCart={addingToCart === product.id}
                        onAddToCart={(e) => handleAddToCart(product, e)}
                        onToggleWishlist={(e) => handleToggleWishlist(product.id, e)}
                      />
                    ))}
                  </div>
                )}

                {/* Infinite Scroll Trigger */}
                {currentPage < 5 && hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading more products...
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination for pages 6+ */}
                {currentPage >= 5 && pages > 5 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fetchProducts(currentPage - 1, true)}
                        disabled={currentPage === 1}
                        className="border-gray-300"
                      >
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(pages - 4, 5) }, (_, i) => {
                          const pageNum = 5 + i;
                          if (pageNum > pages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? 'default' : 'outline'}
                              onClick={() => fetchProducts(pageNum, true)}
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
                        onClick={() => fetchProducts(currentPage + 1, true)}
                        disabled={currentPage >= pages}
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
  isInWishlist,
  addingToCart,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
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
          ) : product.brand?.logo ? (
            <img
              src={product.brand.logo}
              alt={product.brand.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform opacity-70"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <ShieldCheck className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Badges */}
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

          {/* Quick Actions */}
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
            {product.hasVariants || (product._count?.variants && product._count.variants > 0) ? (
              // Product has variants - show "Select Options" indicator
              <span className="p-2 bg-safety-green-600 text-white rounded-full shadow-lg flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </span>
            ) : (
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
            )}
          </div>

          {/* Low Stock Warning */}
          {product.stockQuantity < 10 && product.stockQuantity > 0 && (
            <div className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              Only {product.stockQuantity} left
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="text-xs text-gray-500 mb-1">{product.sku}</div>
          <div className="flex items-center gap-2 mb-1">
            {product.category && (
              <span className="text-xs text-safety-green-600 font-medium">
                {product.category.name}
              </span>
            )}
            {product.brand && (
              <Link
                href={`/brands/${product.brand.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                {product.brand.name}
              </Link>
            )}
          </div>

          {/* Rating */}
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
  isInWishlist,
  addingToCart,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
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
          ) : product.brand?.logo ? (
            <img
              src={product.brand.logo}
              alt={product.brand.name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform opacity-70"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <ShieldCheck className="w-12 h-12 text-gray-300" />
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
                {product.brand && (
                  <Link
                    href={`/brands/${product.brand.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-blue-600 font-medium hover:underline"
                  >
                    {product.brand.name}
                  </Link>
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
              {product.hasVariants || (product._count?.variants && product._count.variants > 0) ? (
                // Product has variants - show "Select Options" button
                <span className="inline-flex items-center px-4 py-2 bg-safety-green-600 text-white rounded-lg font-medium">
                  <Eye className="w-4 h-4 mr-2" />
                  Select Options
                </span>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
