'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Search,
  Filter,
  Check,
  Trash2,
  Package,
  DollarSign,
  Percent,
  Power,
  Upload,
  Download,
  AlertTriangle,
  Loader2,
  X,
  ChevronDown,
  Warehouse,
  Tag,
  FileSpreadsheet,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  basePrice: number;
  salePrice: number | null;
  gsaPrice: number | null;
  wholesalePrice: number | null;
  stockQuantity: number;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  defaultWarehouse: { id: string; name: string } | null;
  images: string[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

type BulkAction =
  | 'delete'
  | 'move_warehouse'
  | 'update_status'
  | 'apply_discount'
  | 'price_update';

export default function BulkEditPage() {
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter states
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState<BulkAction | null>(null);

  // Action params
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [priceField, setPriceField] = useState<'basePrice' | 'salePrice' | 'gsaPrice' | 'wholesalePrice'>('basePrice');
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Results
  const [result, setResult] = useState<{ success: boolean; message: string; affected?: number } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterCategory) params.set('category', filterCategory);
      if (filterBrand) params.set('brand', filterBrand);
      if (filterWarehouse) params.set('warehouse', filterWarehouse);
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', '500');

      const res = await fetch(`/api/admin/products/bulk?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterCategory, filterBrand, filterWarehouse, filterStatus]);

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [catRes, brandRes, whRes] = await Promise.all([
          fetch('/api/admin/categories?limit=100'),
          fetch('/api/admin/brands'),
          fetch('/api/admin/warehouses'),
        ]);

        // Parse responses
        const catData = await catRes.json();
        const brandData = await brandRes.json();
        const whData = await whRes.json();

        // Set categories with error check
        if (catRes.ok && catData.categories) {
          setCategories(catData.categories);
        } else {
          console.warn('Failed to fetch categories:', catData.error || 'Unknown error');
        }

        // Set brands with error check
        if (brandRes.ok && brandData.brands) {
          setBrands(brandData.brands);
        } else {
          console.warn('Failed to fetch brands:', brandData.error || 'Unknown error');
        }

        // Set warehouses with error check (warehouses API returns array directly)
        if (whRes.ok) {
          setWarehouses(Array.isArray(whData) ? whData : (whData.warehouses || []));
        } else {
          console.warn('Failed to fetch warehouses:', whData.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    }
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === products.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
    setSelectAll(!selectAll);
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (selectedIds.size === 0) return;

    setActionLoading(true);
    setResult(null);

    try {
      let endpoint = '/api/admin/products/bulk';
      let body: any = { productIds: Array.from(selectedIds) };

      switch (activeModal) {
        case 'delete':
          body.action = 'delete';
          break;

        case 'move_warehouse':
          body.action = 'move_warehouse';
          body.warehouseId = targetWarehouse;
          break;

        case 'update_status':
          body.action = 'update_status';
          body.status = targetStatus;
          break;

        case 'apply_discount':
          body.action = 'apply_discount';
          body.discountType = discountType;
          body.discountValue = parseFloat(discountValue);
          body.priceField = priceField;
          break;

        case 'price_update':
          // Handle Excel upload separately
          if (!excelFile) {
            setResult({ success: false, message: 'Please select an Excel file' });
            setActionLoading(false);
            return;
          }

          const formData = new FormData();
          formData.append('file', excelFile);
          formData.append('action', 'price_update');

          const uploadRes = await fetch('/api/admin/products/bulk/price-upload', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();
          setResult(uploadData);
          setActionLoading(false);
          if (uploadData.success) {
            fetchProducts();
            setSelectedIds(new Set());
            setSelectAll(false);
          }
          return;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResult(data);

      if (data.success) {
        fetchProducts();
        setSelectedIds(new Set());
        setSelectAll(false);
        setTimeout(() => setActiveModal(null), 2000);
      }
    } catch (error) {
      setResult({ success: false, message: 'Operation failed. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Download Excel template
  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/admin/products/bulk/template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'price_update_template.xlsx';
      a.click();
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  // Export selected products
  const exportSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      const res = await fetch('/api/admin/products/bulk/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedIds) }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setResult(null);
    setTargetWarehouse('');
    setTargetStatus('');
    setDiscountValue('');
    setExcelFile(null);
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    INACTIVE: 'bg-red-100 text-red-800',
    DISCONTINUED: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/products">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Bulk Edit Products</h1>
            <p className="text-gray-600">
              Select products and perform bulk operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-gray-300"
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button
              variant="outline"
              className="border-gray-300"
              onClick={exportSelected}
              disabled={selectedIds.size === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          {/* Warehouse Filter */}
          <div className="flex-1 max-w-xs">
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            className="border-gray-300"
            onClick={() => {
              setSearch('');
              setFilterCategory('');
              setFilterBrand('');
              setFilterWarehouse('');
              setFilterStatus('');
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Selection Bar */}
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {selectAll ? (
              <CheckSquare className="w-5 h-5 text-safety-green-400" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="font-medium">Select All</span>
          </button>
          <div className="h-6 w-px bg-white/20" />
          <span className="text-white/80">
            <span className="font-bold text-white">{selectedIds.size}</span> of {products.length} selected
          </span>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              onClick={() => setActiveModal('update_status')}
            >
              <Power className="w-4 h-4" />
              Change Status
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => setActiveModal('move_warehouse')}
            >
              <Warehouse className="w-4 h-4" />
              Move Warehouse
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-safety-green-600 hover:bg-safety-green-700 text-white rounded-lg transition-colors"
              onClick={() => setActiveModal('apply_discount')}
            >
              <Percent className="w-4 h-4" />
              Apply Discount
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              onClick={() => setActiveModal('price_update')}
            >
              <Upload className="w-4 h-4" />
              Price Upload
            </button>
            <div className="h-6 w-px bg-white/20 mx-2" />
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              onClick={() => setActiveModal('delete')}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {selectAll ? (
                        <CheckSquare className="w-5 h-5 text-safety-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Base Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sale Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Warehouse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${selectedIds.has(product.id) ? 'bg-safety-green-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(product.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {selectedIds.has(product.id) ? (
                          <CheckSquare className="w-5 h-5 text-safety-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate max-w-xs">
                            {product.name}
                          </div>
                          {product.brand && (
                            <div className="text-xs text-gray-500">{product.brand.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[product.status] || 'bg-gray-100 text-gray-800'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${Number(product.basePrice).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {product.salePrice ? (
                        <span className="font-medium text-safety-green-600">
                          ${Number(product.salePrice).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${product.stockQuantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {product.category?.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {product.defaultWarehouse?.name || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Delete Modal */}
            {activeModal === 'delete' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Products</h3>
                    <p className="text-sm text-gray-500">{selectedIds.size} products selected</p>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">This action cannot be undone</p>
                      <p className="text-sm text-red-600 mt-1">
                        All selected products and their variants, images, and related data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Move Warehouse Modal */}
            {activeModal === 'move_warehouse' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Warehouse className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Move to Warehouse</h3>
                    <p className="text-sm text-gray-500">{selectedIds.size} products selected</p>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Target Warehouse
                  </label>
                  <select
                    value={targetWarehouse}
                    onChange={(e) => setTargetWarehouse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Update Status Modal */}
            {activeModal === 'update_status' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Power className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Change Status</h3>
                    <p className="text-sm text-gray-500">{selectedIds.size} products selected</p>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ACTIVE', 'DRAFT', 'INACTIVE', 'DISCONTINUED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setTargetStatus(status)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          targetStatus === status
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Apply Discount Modal */}
            {activeModal === 'apply_discount' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-safety-green-100 rounded-xl flex items-center justify-center">
                    <Percent className="w-6 h-6 text-safety-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Apply Discount</h3>
                    <p className="text-sm text-gray-500">{selectedIds.size} products selected</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apply to Price Field
                    </label>
                    <select
                      value={priceField}
                      onChange={(e) => setPriceField(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="basePrice">Base Price → Sale Price</option>
                      <option value="salePrice">Update Sale Price</option>
                      <option value="gsaPrice">GSA Price</option>
                      <option value="wholesalePrice">Wholesale Price</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDiscountType('percentage')}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                          discountType === 'percentage'
                            ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        onClick={() => setDiscountType('fixed')}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                          discountType === 'fixed'
                            ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Fixed Amount ($)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {discountType === 'percentage' ? '%' : '$'}
                      </span>
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '10' : '5.00'}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Price Update (Excel) Modal */}
            {activeModal === 'price_update' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Update Prices via Excel</h3>
                    <p className="text-sm text-gray-500">Upload an Excel file with price updates</p>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-2">Excel Format</h4>
                    <p className="text-sm text-orange-700">
                      Your Excel file should have these columns:
                    </p>
                    <ul className="text-sm text-orange-700 mt-2 list-disc list-inside">
                      <li><strong>SKU</strong> (required)</li>
                      <li><strong>Base Price</strong> (optional)</li>
                      <li><strong>Sale Price</strong> (optional)</li>
                      <li><strong>GSA Price</strong> (optional)</li>
                      <li><strong>Wholesale Price</strong> (optional)</li>
                    </ul>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Excel File (.xlsx, .xls)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="excel-upload"
                      />
                      <label htmlFor="excel-upload" className="cursor-pointer">
                        {excelFile ? (
                          <div className="flex items-center justify-center gap-2 text-orange-600">
                            <FileSpreadsheet className="w-8 h-8" />
                            <span className="font-medium">{excelFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Click to upload Excel file</p>
                            <p className="text-xs text-gray-400 mt-1">Maximum 10MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download template file
                  </button>
                </div>
              </>
            )}

            {/* Result Message */}
            {result && (
              <div className={`mb-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.message}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-300"
                onClick={closeModal}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${
                  activeModal === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-safety-green-600 hover:bg-safety-green-700'
                }`}
                onClick={executeBulkAction}
                disabled={
                  actionLoading ||
                  (activeModal === 'move_warehouse' && !targetWarehouse) ||
                  (activeModal === 'update_status' && !targetStatus) ||
                  (activeModal === 'apply_discount' && !discountValue) ||
                  (activeModal === 'price_update' && !excelFile)
                }
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {activeModal === 'delete' ? 'Delete Products' : 'Apply Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
