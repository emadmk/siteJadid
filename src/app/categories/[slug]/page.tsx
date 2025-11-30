'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  SlidersHorizontal,
  Grid3X3,
  List,
  ShieldCheck,
  X,
  ChevronDown,
  Star,
  ShoppingCart,
  Heart,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    _count: {
      products: number;
    };
  }[];
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
}

interface PageData {
  category: Category;
  products: Product[];
  total: number;
  pages: number;
  currentPage: number;
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist();

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch category and products
  const fetchData = useCallback(async (page: number, reset: boolean = false) => {
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

      if (priceRange.min) queryParams.set('minPrice', priceRange.min);
      if (priceRange.max) queryParams.set('maxPrice', priceRange.max);

      const response = await fetch(`/api/storefront/categories/${params.slug}?${queryParams}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/categories');
          return;
        }
        throw new Error('Failed to fetch category');
      }

      const result: PageData = await response.json();

      setData(result);

      if (reset || page === 1) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }

      setCurrentPage(result.currentPage);
      setHasMore(result.currentPage < result.pages);
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [params.slug, sortBy, priceRange, router]);

  // Initial fetch
  useEffect(() => {
    fetchData(1, true);
  }, [params.slug, sortBy]);

  // Infinite scroll for pages 1-5, then show pagination
  useEffect(() => {
    if (loading || loadingMore || !hasMore || currentPage >= 5) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && currentPage < 5 && !loadingMore) {
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
    await addToCart(product.id, 1);
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
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setCurrentPage(1);
    fetchData(1, true);
    setShowFilters(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-safety-green-600 animate-spin" />
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <Link href="/categories">
            <Button className="bg-safety-green-600 hover:bg-safety-green-700">
              Browse All Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { category } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
            <Link href="/" className="text-gray-600 hover:text-safety-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/categories" className="text-gray-600 hover:text-safety-green-600">
              Categories
            </Link>
            {category.parent && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link
                  href={`/categories/${category.parent.slug}`}
                  className="text-gray-600 hover:text-safety-green-600"
                >
                  {category.parent.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-black font-medium">{category.name}</span>
          </div>

          <div className="flex items-start gap-6">
            {category.image && (
              <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-600 max-w-2xl">{category.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {data.total.toLocaleString()} products available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-lg font-semibold text-black mb-4">Subcategories</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="flex-shrink-0 group"
                >
                  <div className="w-32 bg-gray-50 rounded-lg p-4 hover:bg-safety-green-50 border border-gray-200 hover:border-safety-green-300 transition-all text-center">
                    <div className="w-12 h-12 bg-white rounded-lg mx-auto mb-2 overflow-hidden shadow-sm">
                      {child.image ? (
                        <img
                          src={child.image}
                          alt={child.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-black group-hover:text-safety-green-600 transition-colors line-clamp-2">
                      {child.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {child._count.products} items
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {(priceRange.min || priceRange.max) && (
                  <span className="bg-safety-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                    1
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
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-sm text-gray-600">Sort by:</span>
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

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="$1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={applyFilters}
                    className="flex-1 bg-safety-green-600 hover:bg-safety-green-700"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-black mb-2">No Products Found</h2>
            <p className="text-gray-600 mb-6">
              {priceRange.min || priceRange.max
                ? 'Try adjusting your filters'
                : 'No products available in this category yet'}
            </p>
            {(priceRange.min || priceRange.max) && (
              <Button onClick={clearFilters} className="bg-safety-green-600 hover:bg-safety-green-700">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-xl cursor-pointer overflow-hidden h-full flex flex-col">
                      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShieldCheck className="w-16 h-16 text-gray-300" />
                          </div>
                        )}

                        {/* Badges */}
                        {product.salePrice && product.salePrice < product.basePrice && (
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
                            onClick={(e) => handleToggleWishlist(product.id, e)}
                            className={`p-2 rounded-full shadow-lg transition-colors ${
                              isInWishlist(product.id)
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={addingToCart === product.id || product.stockQuantity === 0}
                            className="p-2 bg-safety-green-600 text-white rounded-full shadow-lg hover:bg-safety-green-700 transition-colors disabled:opacity-50"
                          >
                            {addingToCart === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                          </button>
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
                            <span className="text-xs text-gray-500 ml-1">
                              ({product.reviewCount})
                            </span>
                          </div>
                        )}

                        <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:text-safety-green-700 transition-colors flex-1">
                          {product.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-auto">
                          <span className="text-lg font-bold text-black">
                            ${Number(product.salePrice || product.basePrice).toFixed(2)}
                          </span>
                          {product.salePrice && product.salePrice < product.basePrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${Number(product.basePrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group bg-white rounded-lg border border-gray-200 hover:border-safety-green-400 transition-all hover:shadow-lg cursor-pointer overflow-hidden flex">
                      <div className="relative w-48 h-48 flex-shrink-0 bg-gray-100 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        {product.salePrice && product.salePrice < product.basePrice && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            SALE
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">{product.sku}</div>
                            <h3 className="text-lg font-semibold text-black group-hover:text-safety-green-700 transition-colors">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                {product.description}
                              </p>
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
                                <span className="text-sm text-gray-500 ml-1">
                                  ({product.reviewCount} reviews)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-black">
                              ${Number(product.salePrice || product.basePrice).toFixed(2)}
                            </div>
                            {product.salePrice && product.salePrice < product.basePrice && (
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
                                {product.stockQuantity > 20
                                  ? 'In Stock'
                                  : `Only ${product.stockQuantity} left`}
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">Out of Stock</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleToggleWishlist(product.id, e)}
                              className={`p-2 rounded-lg border transition-colors ${
                                isInWishlist(product.id)
                                  ? 'bg-red-50 border-red-200 text-red-500'
                                  : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                            </button>
                            <Button
                              onClick={(e) => handleAddToCart(product, e)}
                              disabled={addingToCart === product.id || product.stockQuantity === 0}
                              className="bg-safety-green-600 hover:bg-safety-green-700"
                            >
                              {addingToCart === product.id ? (
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
                ))}
              </div>
            )}

            {/* Infinite Scroll Trigger / Load More */}
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
            {currentPage >= 5 && data.pages > 5 && (
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
                    {Array.from({ length: Math.min(data.pages - 4, 5) }, (_, i) => {
                      const pageNum = 5 + i;
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
      </div>
    </div>
  );
}
