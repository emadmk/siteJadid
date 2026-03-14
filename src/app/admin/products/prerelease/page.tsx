'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Package, Search, Eye, Pencil, Rocket, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Loader2, FolderOpen, X, Filter, Shield
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  images: string[];
  status: string;
  originalCategory: string | null;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  taaApproved: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  level: number;
}

interface Brand {
  id: string;
  name: string;
}

export default function PreReleasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL search params
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [taaFilter, setTaaFilter] = useState(searchParams.get('taaApproved') || '');
  const [hasCategoryFilter, setHasCategoryFilter] = useState(searchParams.get('hasCategory') || '');
  const [brandFilter, setBrandFilter] = useState(searchParams.get('brand') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  // Update URL when filters change
  const updateURL = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const values = {
      search,
      taaApproved: taaFilter,
      hasCategory: hasCategoryFilter,
      brand: brandFilter,
      page: page.toString(),
      ...overrides,
    };

    Object.entries(values).forEach(([key, val]) => {
      if (val && val !== '' && val !== '1') {
        // Don't add page=1 to URL
        if (key === 'page' && val === '1') return;
        params.set(key, val);
      }
    });

    const qs = params.toString();
    router.replace(`/admin/products/prerelease${qs ? '?' + qs : ''}`, { scroll: false });
  }, [search, taaFilter, hasCategoryFilter, brandFilter, page, router]);

  // Fetch prerelease products
  const fetchProducts = useCallback(async (currentPage?: number, currentSearch?: string, currentTaa?: string, currentHasCategory?: string, currentBrand?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'PRERELEASE',
        page: (currentPage ?? page).toString(),
        pageSize: pageSize.toString(),
      });
      const s = currentSearch ?? search;
      const t = currentTaa ?? taaFilter;
      const h = currentHasCategory ?? hasCategoryFilter;
      const b = currentBrand ?? brandFilter;

      if (s) params.set('search', s);
      if (t) params.set('taaApproved', t);
      if (h) params.set('hasCategory', h);
      if (b) params.set('brand', b);

      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        const total = data.pagination?.total || 0;
        setTotalCount(total);
        setTotalPages(data.pagination?.totalPages || Math.ceil(total / pageSize));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, taaFilter, hasCategoryFilter, brandFilter]);

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when page changes (not on initial mount)
  useEffect(() => {
    fetchProducts();
    updateURL();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, search, taaFilter, hasCategoryFilter, brandFilter);
    updateURL({ page: '1' });
  };

  const applyFilter = (filterName: string, value: string) => {
    setPage(1);
    let newTaa = taaFilter;
    let newHasCategory = hasCategoryFilter;
    let newBrand = brandFilter;

    if (filterName === 'taaApproved') {
      newTaa = taaFilter === value ? '' : value;
      setTaaFilter(newTaa);
    } else if (filterName === 'hasCategory') {
      newHasCategory = hasCategoryFilter === value ? '' : value;
      setHasCategoryFilter(newHasCategory);
    } else if (filterName === 'brand') {
      newBrand = brandFilter === value ? '' : value;
      setBrandFilter(newBrand);
    }

    fetchProducts(1, search, newTaa, newHasCategory, newBrand);

    // Update URL
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (newTaa) params.set('taaApproved', newTaa);
    if (newHasCategory) params.set('hasCategory', newHasCategory);
    if (newBrand) params.set('brand', newBrand);
    const qs = params.toString();
    router.replace(`/admin/products/prerelease${qs ? '?' + qs : ''}`, { scroll: false });
  };

  const clearAllFilters = () => {
    setSearch('');
    setTaaFilter('');
    setHasCategoryFilter('');
    setBrandFilter('');
    setPage(1);
    fetchProducts(1, '', '', '', '');
    router.replace('/admin/products/prerelease', { scroll: false });
  };

  const hasActiveFilters = search || taaFilter || hasCategoryFilter || brandFilter;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/products" className="text-gray-500 hover:text-gray-700">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-3xl font-bold text-black">PreRelease</h1>
          </div>
          <p className="text-gray-600">
            Review and release imported products. These products are not yet visible on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{totalCount} products pending review</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or original category..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>
          <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
            Search
          </Button>
        </form>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Filters:
          </span>

          {/* TAA Approved */}
          <button
            onClick={() => applyFilter('taaApproved', 'true')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              taaFilter === 'true'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              TAA Approved
            </span>
          </button>

          <button
            onClick={() => applyFilter('taaApproved', 'false')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              taaFilter === 'false'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Not TAA
          </button>

          <span className="text-gray-300">|</span>

          {/* Has Category */}
          <button
            onClick={() => applyFilter('hasCategory', 'true')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              hasCategoryFilter === 'true'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Has Category
          </button>

          <button
            onClick={() => applyFilter('hasCategory', 'false')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              hasCategoryFilter === 'false'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            No Category
          </button>

          <span className="text-gray-300">|</span>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => applyFilter('brand', e.target.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              brandFilter
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-safety-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-safety-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              {hasActiveFilters ? 'No Matching Products' : 'No PreRelease Products'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'No products match your current filters. Try adjusting the filters.'
                : 'All imported products have been reviewed and released.'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearAllFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Link href="/admin/products/import">
                <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
                  Import Products
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Original Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Assigned Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                      TAA
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate max-w-xs">
                              {product.name}
                            </div>
                            {product.brand && (
                              <div className="text-sm text-gray-500">{product.brand.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        {product.originalCategory ? (
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded">
                              {product.originalCategory}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.category ? (
                          <span className="text-sm text-safety-green-700 bg-safety-green-50 px-2 py-1 rounded">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-red-500 text-sm flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">${Number(product.basePrice).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.taaApproved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                            <Shield className="w-3 h-3" />
                            TAA
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/prerelease/${product.id}/edit`}>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit & Release
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} products
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-gray-300"
                  >
                    <ChevronRight className="w-4 h-4" />
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
