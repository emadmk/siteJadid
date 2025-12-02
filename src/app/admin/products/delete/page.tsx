'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Package,
  ShoppingCart,
  EyeOff,
  RefreshCw,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  basePrice: number;
  stockQuantity: number;
  images: string[];
  brand?: { name: string };
  category?: { name: string };
  _count?: {
    orderItems: number;
    warehouseStock: number;
    cartItems: number;
  };
}

interface DeleteResult {
  success: boolean;
  deleted: number;
  hidden: number;
  failed: number;
  errors: string[];
}

export default function DeleteProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [result, setResult] = useState<DeleteResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'delete' | 'hide'>('delete');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        includeOrderCount: 'true',
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Toggle single selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Toggle all selection
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  // Check if product has orders
  const hasOrders = (product: Product) => {
    return (product._count?.orderItems || 0) > 0;
  };

  // Get selected products info
  const getSelectedInfo = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    const withOrders = selected.filter(hasOrders);
    const withoutOrders = selected.filter((p) => !hasOrders(p));
    return { selected, withOrders, withoutOrders };
  };

  // Handle delete/hide
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          mode: deleteMode, // 'delete' or 'hide'
          forceDelete: deleteMode === 'delete',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success || data.deleted > 0 || data.hidden > 0) {
        // Refresh products and clear selection
        setSelectedIds(new Set());
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting products:', error);
      setResult({
        success: false,
        deleted: 0,
        hidden: 0,
        failed: selectedIds.size,
        errors: ['An unexpected error occurred'],
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  const { selected, withOrders, withoutOrders } = getSelectedInfo();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delete Products</h1>
            <p className="text-gray-600">
              Search, select and delete products from your catalog
            </p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Important Warning</h3>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>
                - Products with <strong>active orders</strong> cannot be deleted,
                but can be hidden (set to INACTIVE)
              </li>
              <li>
                - Deleting a product will also remove its images, inventory, and
                price history
              </li>
              <li>- This action is irreversible for products without orders</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, or brand..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Refresh */}
          <Button variant="outline" onClick={fetchProducts} disabled={isLoading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-red-800">
                {selectedIds.size} product(s) selected
              </p>
              {withOrders.length > 0 && (
                <p className="text-sm text-red-600">
                  <ShoppingCart className="w-4 h-4 inline mr-1" />
                  {withOrders.length} product(s) have orders and can only be
                  hidden
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {/* Hide Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteMode('hide');
                  setShowConfirmModal(true);
                }}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Selected ({selectedIds.size})
              </Button>

              {/* Delete Button */}
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteMode('delete');
                  setShowConfirmModal(true);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({withoutOrders.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Message */}
      {result && (
        <div
          className={`rounded-lg p-4 mb-6 ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success ? 'Operation Completed' : 'Operation Completed with Issues'}
              </p>
              <ul className="text-sm mt-1 space-y-1">
                {result.deleted > 0 && (
                  <li className="text-green-700">
                    {result.deleted} product(s) permanently deleted
                  </li>
                )}
                {result.hidden > 0 && (
                  <li className="text-orange-700">
                    {result.hidden} product(s) hidden (set to INACTIVE)
                  </li>
                )}
                {result.failed > 0 && (
                  <li className="text-red-700">
                    {result.failed} product(s) failed
                  </li>
                )}
                {result.errors?.map((err, i) => (
                  <li key={i} className="text-red-600">
                    - {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    {selectedIds.size === products.length && products.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span className="text-xs font-medium">Select All</span>
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="mt-2 text-gray-600">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const hasOrderItems = hasOrders(product);
                  const isSelected = selectedIds.has(product.id);

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 ${
                        isSelected ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(product.id)}
                          className="p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-red-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            {product.brand && (
                              <p className="text-sm text-gray-500">
                                {product.brand.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {product.sku}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        ${Number(product.basePrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {product.stockQuantity}
                      </td>
                      <td className="px-4 py-3">
                        {hasOrderItems ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            {product._count?.orderItems || 0}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} products
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {deleteMode === 'delete' ? (
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <EyeOff className="w-6 h-6 text-orange-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {deleteMode === 'delete'
                      ? 'Delete Products?'
                      : 'Hide Products?'}
                  </h3>
                  <p className="text-gray-600">
                    {deleteMode === 'delete'
                      ? 'This action cannot be undone'
                      : 'Products will be set to INACTIVE status'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>{selectedIds.size}</strong> product(s) selected
                </p>
                {deleteMode === 'delete' && withOrders.length > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {withOrders.length} product(s) have orders and will be{' '}
                    <strong>hidden instead</strong> of deleted
                  </p>
                )}
                {deleteMode === 'delete' && withoutOrders.length > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    {withoutOrders.length} product(s) will be{' '}
                    <strong>permanently deleted</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant={deleteMode === 'delete' ? 'destructive' : 'default'}
                onClick={handleDelete}
                disabled={isDeleting}
                className={
                  deleteMode === 'hide' ? 'bg-orange-600 hover:bg-orange-700' : ''
                }
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : deleteMode === 'delete' ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Products
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Products
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
