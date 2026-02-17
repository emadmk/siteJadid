'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Search,
  Filter,
  X,
  Package,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ProductVariantsManager } from '@/components/admin/ProductVariantsManager';

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

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  status: string;
  basePrice: number;
  salePrice: number | null;
  gsaPrice: number | null;
  costPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  minimumOrderQty: number;
  categoryId: string | null;
  brandId: string | null;
  defaultSupplierId: string | null;
  defaultWarehouseId: string | null;
  images: string[];
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  categories?: { categoryId: string }[];
}

function ProductReviewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brandId: searchParams.get('brand') || '',
    categoryId: searchParams.get('category') || '',
    supplierId: searchParams.get('supplier') || '',
    warehouseId: searchParams.get('warehouse') || '',
  });
  const [showFilters, setShowFilters] = useState(true);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Product list state
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingList, setLoadingList] = useState(true);

  // Current product edit state
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [catRes, brandRes, supRes, whRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/brands'),
          fetch('/api/admin/suppliers'),
          fetch('/api/admin/warehouses'),
        ]);

        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || data || []);
        }
        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrands(data.brands || data || []);
        }
        if (supRes.ok) {
          const data = await supRes.json();
          setSuppliers(data.suppliers || data || []);
        }
        if (whRes.ok) {
          const data = await whRes.json();
          // Warehouses API returns array directly, not { warehouses: [...] }
          setWarehouses(Array.isArray(data) ? data : (data.warehouses || []));
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch products based on filters
  const fetchProducts = useCallback(async () => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '500'); // Get all matching products
      if (filters.search) params.set('search', filters.search);
      if (filters.brandId) params.set('brand', filters.brandId);
      if (filters.categoryId) params.set('category', filters.categoryId);
      if (filters.supplierId) params.set('supplier', filters.supplierId);
      if (filters.warehouseId) params.set('warehouse', filters.warehouseId);

      const response = await fetch(`/api/admin/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        // Use pagination.total for accurate count (not limited by page size)
        setTotalProducts(data.pagination?.total || data.products?.length || 0);
        if (data.products?.length > 0) {
          setCurrentIndex(0);
          loadProductDetails(data.products[0].id);
        } else {
          setEditedProduct(null);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  // Load full product details
  const loadProductDetails = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const product = await response.json();
        setEditedProduct({
          ...product,
          basePrice: Number(product.basePrice) || 0,
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          gsaPrice: product.gsaPrice ? Number(product.gsaPrice) : null,
          costPrice: product.costPrice ? Number(product.costPrice) : null,
          weight: product.weight ? Number(product.weight) : null,
          length: product.length ? Number(product.length) : null,
          width: product.width ? Number(product.width) : null,
          height: product.height ? Number(product.height) : null,
        });
        // Set selected categories (including primary)
        const catIds = product.categories?.map((c: any) => c.categoryId) || [];
        if (product.categoryId && !catIds.includes(product.categoryId)) {
          catIds.unshift(product.categoryId);
        }
        setSelectedCategoryIds(catIds);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle filter apply
  const handleApplyFilters = () => {
    fetchProducts();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({
      search: '',
      brandId: '',
      categoryId: '',
      supplierId: '',
      warehouseId: '',
    });
  };

  // Navigate to next product
  const goToNextProduct = () => {
    if (currentIndex < products.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      loadProductDetails(products[newIndex].id);
    }
  };

  // Navigate to previous product
  const goToPrevProduct = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      loadProductDetails(products[newIndex].id);
    }
  };

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    if (!editedProduct) return;
    setEditedProduct({ ...editedProduct, [field]: value });
    setHasChanges(true);
  };

  // Handle category toggle
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
    setHasChanges(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editedProduct) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('productSku', editedProduct.sku);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setEditedProduct({
          ...editedProduct,
          images: [...editedProduct.images, ...data.urls],
        });
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    if (!editedProduct) return;
    const newImages = editedProduct.images.filter((_, i) => i !== index);
    setEditedProduct({ ...editedProduct, images: newImages });
    setHasChanges(true);
  };

  // Save product
  const handleSave = async () => {
    if (!editedProduct) return;

    setSaving(true);
    setMessage(null);

    try {
      // Determine primary category (first selected or existing)
      const primaryCategoryId = selectedCategoryIds[0] || editedProduct.categoryId;

      const response = await fetch(`/api/admin/products/${editedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedProduct.name,
          slug: editedProduct.slug,
          sku: editedProduct.sku,
          description: editedProduct.description,
          shortDescription: editedProduct.shortDescription,
          status: editedProduct.status,
          basePrice: editedProduct.basePrice,
          salePrice: editedProduct.salePrice,
          gsaPrice: editedProduct.gsaPrice,
          costPrice: editedProduct.costPrice,
          stockQuantity: editedProduct.stockQuantity,
          lowStockThreshold: editedProduct.lowStockThreshold,
          minimumOrderQty: editedProduct.minimumOrderQty,
          categoryId: primaryCategoryId,
          categoryIds: selectedCategoryIds, // All selected categories
          brandId: editedProduct.brandId,
          defaultSupplierId: editedProduct.defaultSupplierId,
          defaultWarehouseId: editedProduct.defaultWarehouseId,
          images: editedProduct.images,
          weight: editedProduct.weight,
          length: editedProduct.length,
          width: editedProduct.width,
          height: editedProduct.height,
          isFeatured: editedProduct.isFeatured,
          isBestSeller: editedProduct.isBestSeller,
          isNewArrival: editedProduct.isNewArrival,
          metaTitle: editedProduct.metaTitle,
          metaDescription: editedProduct.metaDescription,
          metaKeywords: editedProduct.metaKeywords,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Product saved successfully!' });
        setHasChanges(false);
        // Update the product in the list
        setProducts(prev =>
          prev.map(p => (p.id === editedProduct.id ? { ...p, ...editedProduct } : p))
        );
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save product' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save product' });
    } finally {
      setSaving(false);
    }
  };

  // Save and go to next
  const handleSaveAndNext = async () => {
    await handleSave();
    if (currentIndex < products.length - 1) {
      setTimeout(() => {
        goToNextProduct();
      }, 500);
    }
  };

  // Build category tree for display
  const buildCategoryTree = (parentId: string | null = null, level: number = 0): JSX.Element[] => {
    const items: JSX.Element[] = [];
    const children = categories.filter(c => c.parentId === parentId);

    children.forEach(cat => {
      items.push(
        <label
          key={cat.id}
          className={`flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer ${
            level > 0 ? `ml-${level * 4}` : ''
          }`}
          style={{ marginLeft: level * 16 }}
        >
          <input
            type="checkbox"
            checked={selectedCategoryIds.includes(cat.id)}
            onChange={() => handleCategoryToggle(cat.id)}
            className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
          />
          <span className="text-sm text-gray-700">{cat.name}</span>
          {selectedCategoryIds[0] === cat.id && (
            <span className="text-xs bg-safety-green-100 text-safety-green-800 px-1.5 py-0.5 rounded">
              Primary
            </span>
          )}
        </label>
      );
      items.push(...buildCategoryTree(cat.id, level + 1));
    });

    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-black">Product Review</h1>
              {totalProducts > 0 && (
                <span className="text-sm text-gray-500">
                  {currentIndex + 1} of {totalProducts}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Navigation */}
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevProduct}
                disabled={currentIndex === 0 || loadingList}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextProduct}
                disabled={currentIndex >= products.length - 1 || loadingList}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              {/* Save buttons */}
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="bg-safety-green-600 hover:bg-safety-green-700"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              <Button
                onClick={handleSaveAndNext}
                disabled={saving || currentIndex >= products.length - 1}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save & Next
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-3 px-4 py-2 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Filters Sidebar */}
        <div
          className={`${
            showFilters ? 'w-72' : 'w-0'
          } bg-white border-r transition-all duration-300 overflow-hidden flex-shrink-0`}
        >
          <div className="p-4 w-72">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-black">Filters</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                    placeholder="SKU, name..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
                  />
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={filters.brandId}
                  onChange={e => setFilters({ ...filters, brandId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
                >
                  <option value="">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.categoryId}
                  onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={filters.supplierId}
                  onChange={e => setFilters({ ...filters, supplierId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select
                  value={filters.warehouseId}
                  onChange={e => setFilters({ ...filters, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleApplyFilters} className="flex-1 bg-safety-green-600 hover:bg-safety-green-700">
                  Apply
                </Button>
                <Button variant="outline" onClick={handleResetFilters} className="flex-1">
                  Reset
                </Button>
              </div>
            </div>

            {/* Product List */}
            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium text-black mb-2">
                Products ({totalProducts})
              </h3>
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {loadingList ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-safety-green-600 animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No products found</p>
                ) : (
                  products.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        loadProductDetails(product.id);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-colors ${
                        index === currentIndex
                          ? 'bg-safety-green-50 border border-safety-green-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-black truncate">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.sku}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Filters Button */}
        {!showFilters && (
          <button
            onClick={() => setShowFilters(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 bg-white border border-l-0 rounded-r-lg p-2 shadow-lg z-20"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {!editedProduct ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
              <Package className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg">Select filters and apply to load products</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Product Images */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Images</h2>
                <div className="flex flex-wrap gap-4">
                  {editedProduct.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                  <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-safety-green-500 hover:bg-gray-50 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Add Image</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editedProduct.name}
                      onChange={e => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={editedProduct.sku}
                      onChange={e => handleFieldChange('sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      value={editedProduct.slug}
                      onChange={e => handleFieldChange('slug', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <input
                      type="text"
                      value={editedProduct.shortDescription || ''}
                      onChange={e => handleFieldChange('shortDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <RichTextEditor
                      value={editedProduct.description || ''}
                      onChange={value => handleFieldChange('description', value)}
                    />
                  </div>
                </div>
              </div>

              {/* Categories (Multi-select) */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">
                  Categories
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Select multiple, first selected is primary)
                  </span>
                </h2>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                  {buildCategoryTree()}
                </div>
                {selectedCategoryIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCategoryIds.map((catId, index) => {
                      const cat = categories.find(c => c.id === catId);
                      return cat ? (
                        <span
                          key={catId}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                            index === 0
                              ? 'bg-safety-green-100 text-safety-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {cat.name}
                          <button
                            onClick={() => handleCategoryToggle(catId)}
                            className="hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Pricing</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.basePrice}
                      onChange={e => handleFieldChange('basePrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.salePrice || ''}
                      onChange={e =>
                        handleFieldChange('salePrice', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GOV Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.gsaPrice || ''}
                      onChange={e =>
                        handleFieldChange('gsaPrice', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.costPrice || ''}
                      onChange={e =>
                        handleFieldChange('costPrice', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory & Status */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Inventory & Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={editedProduct.stockQuantity}
                      onChange={e => handleFieldChange('stockQuantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      value={editedProduct.lowStockThreshold}
                      onChange={e => handleFieldChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Qty</label>
                    <input
                      type="number"
                      value={editedProduct.minimumOrderQty}
                      onChange={e => handleFieldChange('minimumOrderQty', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editedProduct.status}
                      onChange={e => handleFieldChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DRAFT">Draft</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex gap-6 mt-4 pt-4 border-t">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedProduct.isFeatured}
                      onChange={e => handleFieldChange('isFeatured', e.target.checked)}
                      className="w-4 h-4 text-safety-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedProduct.isBestSeller}
                      onChange={e => handleFieldChange('isBestSeller', e.target.checked)}
                      className="w-4 h-4 text-safety-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm">Best Seller</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedProduct.isNewArrival}
                      onChange={e => handleFieldChange('isNewArrival', e.target.checked)}
                      className="w-4 h-4 text-safety-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm">New Arrival</span>
                  </label>
                </div>
              </div>

              {/* Brand & Relations */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Brand & Relations</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <select
                      value={editedProduct.brandId || ''}
                      onChange={e => handleFieldChange('brandId', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="">-- Select Brand --</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Supplier</label>
                    <select
                      value={editedProduct.defaultSupplierId || ''}
                      onChange={e => handleFieldChange('defaultSupplierId', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Warehouse</label>
                    <select
                      value={editedProduct.defaultWarehouseId || ''}
                      onChange={e => handleFieldChange('defaultWarehouseId', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    >
                      <option value="">-- Select Warehouse --</option>
                      {warehouses.map(wh => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Physical Dimensions */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Physical Dimensions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.weight || ''}
                      onChange={e =>
                        handleFieldChange('weight', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length (in)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.length || ''}
                      onChange={e =>
                        handleFieldChange('length', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width (in)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.width || ''}
                      onChange={e =>
                        handleFieldChange('width', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (in)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedProduct.height || ''}
                      onChange={e =>
                        handleFieldChange('height', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold text-black mb-4">SEO</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={editedProduct.metaTitle || ''}
                      onChange={e => handleFieldChange('metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={editedProduct.metaDescription || ''}
                      onChange={e => handleFieldChange('metaDescription', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={editedProduct.metaKeywords || ''}
                      onChange={e => handleFieldChange('metaKeywords', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Variants */}
              <div className="bg-white rounded-lg border p-6">
                <ProductVariantsManager
                  productId={editedProduct.id}
                  categoryId={editedProduct.categoryId || selectedCategoryIds[0] || undefined}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-safety-green-600 animate-spin" />
      </div>
    }>
      <ProductReviewPageContent />
    </Suspense>
  );
}
