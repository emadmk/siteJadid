'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatPrice } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Package, Search, Eye, Pencil, Rocket, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Loader2, FolderOpen, X, Filter, Shield,
  CheckSquare, Square, XCircle
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
  slug: string;
  parentId: string | null;
}

interface Brand {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

function SearchableSelect({
  value, onChange, options, placeholder, className
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 rounded-full text-sm font-medium border transition-colors text-left flex items-center justify-between gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selectedLabel || placeholder}
        </span>
        {value && (
          <X
            className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"
            onClick={(e) => { e.stopPropagation(); onChange(''); setSearchTerm(''); }}
          />
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-safety-green-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
            >
              {placeholder}
            </button>
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-safety-green-50 ${
                  opt.value === value ? 'bg-safety-green-50 text-safety-green-700 font-medium' : 'text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreReleasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL search params
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [taaFilter, setTaaFilter] = useState(searchParams.get('taaApproved') || '');
  const [hasCategoryFilter, setHasCategoryFilter] = useState(searchParams.get('hasCategory') || '');
  const [brandFilter, setBrandFilter] = useState(searchParams.get('brand') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [originalCategoryFilter, setOriginalCategoryFilter] = useState(searchParams.get('originalCategory') || '');
  const [warehouseFilter, setWarehouseFilter] = useState(searchParams.get('warehouse') || '');
  const [supplierFilter, setSupplierFilter] = useState(searchParams.get('supplier') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [goToPage, setGoToPage] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [originalCategories, setOriginalCategories] = useState<string[]>([]);
  const pageSize = 50;

  // Bulk selection state - persists across pages
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkBrandId, setBulkBrandId] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseResult, setReleaseResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update URL when filters change
  const updateURL = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const values = {
      search,
      taaApproved: taaFilter,
      hasCategory: hasCategoryFilter,
      brand: brandFilter,
      category: categoryFilter,
      originalCategory: originalCategoryFilter,
      warehouse: warehouseFilter,
      supplier: supplierFilter,
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
  }, [search, taaFilter, hasCategoryFilter, brandFilter, categoryFilter, originalCategoryFilter, warehouseFilter, supplierFilter, page, router]);

  // Fetch prerelease products
  const fetchProducts = useCallback(async (overrides?: {
    page?: number; search?: string; taaApproved?: string; hasCategory?: string;
    brand?: string; category?: string; originalCategory?: string;
    warehouse?: string; supplier?: string;
  }) => {
    setIsLoading(true);
    try {
      const p = overrides?.page ?? page;
      const s = overrides?.search ?? search;
      const t = overrides?.taaApproved ?? taaFilter;
      const h = overrides?.hasCategory ?? hasCategoryFilter;
      const b = overrides?.brand ?? brandFilter;
      const c = overrides?.category ?? categoryFilter;
      const oc = overrides?.originalCategory ?? originalCategoryFilter;
      const w = overrides?.warehouse ?? warehouseFilter;
      const sup = overrides?.supplier ?? supplierFilter;

      const params = new URLSearchParams({
        status: 'PRERELEASE',
        page: p.toString(),
        limit: pageSize.toString(),
      });

      if (s) params.set('search', s);
      if (t) params.set('taaApproved', t);
      if (h) params.set('hasCategory', h);
      if (b) params.set('brand', b);
      if (c) params.set('category', c);
      if (oc) params.set('originalCategory', oc);
      if (w) params.set('warehouse', w);
      if (sup) params.set('supplier', sup);

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
  }, [page, search, taaFilter, hasCategoryFilter, brandFilter, categoryFilter, originalCategoryFilter, warehouseFilter, supplierFilter]);

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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories?limit=500');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch distinct original categories for filter
  const fetchOriginalCategories = async () => {
    try {
      const res = await fetch('/api/admin/products?status=PRERELEASE&limit=5000');
      if (res.ok) {
        const data = await res.json();
        const cats = new Set<string>();
        (data.products || []).forEach((p: any) => {
          if (p.originalCategory) cats.add(p.originalCategory);
        });
        setOriginalCategories(Array.from(cats).sort());
      }
    } catch {}
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/admin/warehouses');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
    fetchOriginalCategories();
    fetchWarehouses();
    fetchSuppliers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when page changes (not on initial mount)
  useEffect(() => {
    fetchProducts({ page });
    updateURL();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts({ page: 1 });
    updateURL({ page: '1' });
  };

  const applyFilter = (filterName: string, value: string) => {
    setPage(1);
    const overrides: Record<string, string> = { page: '1' };
    const fetchOverrides: any = { page: 1 };

    if (filterName === 'taaApproved') {
      const v = taaFilter === value ? '' : value;
      setTaaFilter(v);
      overrides.taaApproved = v;
      fetchOverrides.taaApproved = v;
    } else if (filterName === 'hasCategory') {
      const v = hasCategoryFilter === value ? '' : value;
      setHasCategoryFilter(v);
      overrides.hasCategory = v;
      fetchOverrides.hasCategory = v;
    } else if (filterName === 'brand') {
      const v = brandFilter === value ? '' : value;
      setBrandFilter(v);
      overrides.brand = v;
      fetchOverrides.brand = v;
    } else if (filterName === 'category') {
      const v = categoryFilter === value ? '' : value;
      setCategoryFilter(v);
      overrides.category = v;
      fetchOverrides.category = v;
    } else if (filterName === 'originalCategory') {
      const v = originalCategoryFilter === value ? '' : value;
      setOriginalCategoryFilter(v);
      overrides.originalCategory = v;
      fetchOverrides.originalCategory = v;
    } else if (filterName === 'warehouse') {
      const v = warehouseFilter === value ? '' : value;
      setWarehouseFilter(v);
      overrides.warehouse = v;
      fetchOverrides.warehouse = v;
    } else if (filterName === 'supplier') {
      const v = supplierFilter === value ? '' : value;
      setSupplierFilter(v);
      overrides.supplier = v;
      fetchOverrides.supplier = v;
    }

    fetchProducts(fetchOverrides);
    updateURL(overrides);
  };

  const clearAllFilters = () => {
    setSearch('');
    setTaaFilter('');
    setHasCategoryFilter('');
    setBrandFilter('');
    setCategoryFilter('');
    setOriginalCategoryFilter('');
    setWarehouseFilter('');
    setSupplierFilter('');
    setPage(1);
    fetchProducts({ page: 1, search: '', taaApproved: '', hasCategory: '', brand: '', category: '', originalCategory: '', warehouse: '', supplier: '' });
    router.replace('/admin/products/prerelease', { scroll: false });
  };

  const hasActiveFilters = search || taaFilter || hasCategoryFilter || brandFilter || categoryFilter || originalCategoryFilter || warehouseFilter || supplierFilter;

  // ---- Bulk selection helpers ----
  const currentPageIds = products.map((p) => p.id);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentPageSelected = currentPageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        // Deselect all on current page
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        // Select all on current page
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkCategoryId('');
    setBulkBrandId('');
    setReleaseResult(null);
  };

  const handleBulkRelease = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkCategoryId) {
      setReleaseResult({ type: 'error', message: 'Please select a category before releasing.' });
      return;
    }

    setIsReleasing(true);
    setReleaseResult(null);

    try {
      const payload: any = {
        productIds: Array.from(selectedIds),
        categoryId: bulkCategoryId,
      };
      if (bulkBrandId) {
        payload.brandId = bulkBrandId;
      }

      const res = await fetch('/api/admin/products/bulk-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReleaseResult({ type: 'success', message: data.message || `Released ${data.affected} product(s).` });
        // Clear selection and refresh
        setSelectedIds(new Set());
        setBulkCategoryId('');
        setBulkBrandId('');
        fetchProducts();
      } else {
        setReleaseResult({ type: 'error', message: data.message || 'Bulk release failed.' });
      }
    } catch (error) {
      console.error('Bulk release error:', error);
      setReleaseResult({ type: 'error', message: 'Network error during bulk release.' });
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="p-8">
      {/* Bulk Action Bar - sticky at top when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-50 -mx-8 -mt-8 mb-4 bg-blue-600 text-white px-8 py-4 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 font-medium">
              <CheckSquare className="w-5 h-5" />
              <span>{selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected</span>
            </div>

            <div className="h-6 w-px bg-blue-400" />

            {/* Category dropdown (required) */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-100">Category *</label>
              <SearchableSelect
                value={bulkCategoryId}
                onChange={(v) => setBulkCategoryId(v)}
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                placeholder="Select category..."
                className="min-w-[200px]"
              />
            </div>

            {/* Brand dropdown (optional) */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-blue-100">Brand</label>
              <SearchableSelect
                value={bulkBrandId}
                onChange={(v) => setBulkBrandId(v)}
                options={brands.map(b => ({ value: b.id, label: b.name }))}
                placeholder="Keep existing"
                className="min-w-[160px]"
              />
            </div>

            <div className="h-6 w-px bg-blue-400" />

            {/* Release button */}
            <Button
              onClick={handleBulkRelease}
              disabled={isReleasing}
              className="bg-green-500 hover:bg-green-600 text-white border-0"
            >
              {isReleasing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Release Selected
                </>
              )}
            </Button>

            {/* Clear selection */}
            <button
              onClick={clearSelection}
              className="text-blue-100 hover:text-white text-sm flex items-center gap-1 ml-auto"
            >
              <XCircle className="w-4 h-4" />
              Clear Selection
            </button>
          </div>

          {/* Release result message */}
          {releaseResult && (
            <div className={`mt-3 text-sm px-3 py-2 rounded ${
              releaseResult.type === 'success'
                ? 'bg-green-500/20 text-green-100'
                : 'bg-red-500/20 text-red-100'
            }`}>
              {releaseResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
              ) : (
                <AlertCircle className="w-4 h-4 inline mr-1" />
              )}
              {releaseResult.message}
            </div>
          )}
        </div>
      )}

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
          <SearchableSelect
            value={brandFilter}
            onChange={(v) => applyFilter('brand', v)}
            options={brands.map(b => ({ value: b.id, label: b.name }))}
            placeholder="All Brands"
          />

          <span className="text-gray-300">|</span>

          {/* Assigned Category Filter */}
          <SearchableSelect
            value={categoryFilter}
            onChange={(v) => applyFilter('category', v)}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="All Categories"
          />

          {/* Original Category Filter */}
          {originalCategories.length > 0 && (
            <SearchableSelect
              value={originalCategoryFilter}
              onChange={(v) => applyFilter('originalCategory', v)}
              options={originalCategories.map(cat => ({ value: cat, label: cat }))}
              placeholder="Original Category"
            />
          )}

          <span className="text-gray-300">|</span>

          {/* Warehouse Filter */}
          <SearchableSelect
            value={warehouseFilter}
            onChange={(v) => applyFilter('warehouse', v)}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
            placeholder="All Warehouses"
          />

          {/* Supplier Filter */}
          <SearchableSelect
            value={supplierFilter}
            onChange={(v) => applyFilter('supplier', v)}
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            placeholder="All Suppliers"
          />

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
                    <th className="px-4 py-3 text-center w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        title={allCurrentPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                      >
                        {allCurrentPageSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : someCurrentPageSelected ? (
                          <div className="relative">
                            <Square className="w-5 h-5 text-blue-400" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2.5 h-0.5 bg-blue-400 rounded" />
                            </div>
                          </div>
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
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
                  {products.map((product) => {
                    const isSelected = selectedIds.has(product.id);
                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleSelectOne(product.id)}
                            className="focus:outline-none"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </td>
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
                          <span className="font-medium">${formatPrice(product.basePrice)}</span>
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
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} products
                  {selectedIds.size > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({selectedIds.size} selected across all pages)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {/* First page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="border-gray-300 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-4 h-4 -ml-2" />
                  </Button>
                  {/* Previous */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-300 px-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Page numbers */}
                  {(() => {
                    const pages: (number | string)[] = [];
                    const range = 2;
                    const start = Math.max(2, page - range);
                    const end = Math.min(totalPages - 1, page + range);

                    pages.push(1);
                    if (start > 2) pages.push('...');
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < totalPages - 1) pages.push('...');
                    if (totalPages > 1) pages.push(totalPages);

                    return pages.map((p, idx) =>
                      typeof p === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-sm text-gray-400">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`min-w-[32px] h-8 px-2 text-sm rounded border transition-colors ${
                            p === page
                              ? 'bg-safety-green-600 text-white border-safety-green-600 font-medium'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    );
                  })()}

                  {/* Next */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-gray-300 px-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  {/* Last page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="border-gray-300 px-2"
                  >
                    <ChevronRight className="w-4 h-4" /><ChevronRight className="w-4 h-4 -ml-2" />
                  </Button>

                  {/* Go to page */}
                  <div className="flex items-center gap-1 ml-3">
                    <span className="text-sm text-gray-500">Go to:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={goToPage}
                      onChange={(e) => setGoToPage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const target = parseInt(goToPage);
                          if (target >= 1 && target <= totalPages) {
                            setPage(target);
                            setGoToPage('');
                          }
                        }
                      }}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-safety-green-500"
                      placeholder={page.toString()}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
