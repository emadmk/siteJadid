'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Plus, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ProductVariantsManager } from './ProductVariantsManager';

interface ProductFormProps {
  product?: any;
  categories: { id: string; name: string; parentId: string | null; slug: string }[];
  brands?: { id: string; name: string }[];
  suppliers?: { id: string; name: string; code: string }[];
  warehouses?: { id: string; name: string; code: string }[];
}

export function ProductForm({ product, categories, brands = [], suppliers = [], warehouses = [] }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Basic
    name: product?.name || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    shortDescription: product?.shortDescription || '',
    description: product?.description || '',

    // Pricing
    basePrice: product?.basePrice?.toString() || '',
    salePrice: product?.salePrice?.toString() || '',
    gsaPrice: product?.gsaPrice?.toString() || '',
    costPrice: product?.costPrice?.toString() || '',

    // Inventory
    stockQuantity: product?.stockQuantity?.toString() || '0',
    lowStockThreshold: product?.lowStockThreshold?.toString() || '10',

    // Category, Brand & Status
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    defaultSupplierId: product?.defaultSupplierId || '',
    defaultWarehouseId: product?.defaultWarehouseId || '',
    status: product?.status || 'ACTIVE',

    // Physical
    weight: product?.weight?.toString() || '',
    length: product?.length?.toString() || '',
    width: product?.width?.toString() || '',
    height: product?.height?.toString() || '',

    // Features
    isFeatured: product?.isFeatured ?? false,
    isBestSeller: product?.isBestSeller ?? false,
    isNewArrival: product?.isNewArrival ?? false,

    // SEO
    metaTitle: product?.metaTitle || '',
    metaDescription: product?.metaDescription || '',
    metaKeywords: product?.metaKeywords || '',

    // Compliance
    complianceCertifications: product?.complianceCertifications || [],
  });

  const [images, setImages] = useState<string[]>(
    (product?.images as string[]) || []
  );
  const [imageInput, setImageInput] = useState('');

  // Tier pricing state
  const [tierPricing, setTierPricing] = useState(
    product?.tierPricing || []
  );

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    }));
  };

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setImages([...images, imageInput.trim()]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach(file => {
        uploadFormData.append('files', file);
      });

      // Add brand and sku for organized folder structure
      const selectedBrand = brands.find(b => b.id === formData.brandId);
      if (selectedBrand) {
        uploadFormData.append('brandSlug', selectedBrand.name);
      }
      if (formData.sku) {
        uploadFormData.append('productSku', formData.sku);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      setImages([...images, ...data.urls]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          uploadFormData.append('files', file);
        }
      });

      // Add brand and sku for organized folder structure
      const selectedBrand = brands.find(b => b.id === formData.brandId);
      if (selectedBrand) {
        uploadFormData.append('brandSlug', selectedBrand.name);
      }
      if (formData.sku) {
        uploadFormData.append('productSku', formData.sku);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      setImages([...images, ...data.urls]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleAddTierPrice = () => {
    setTierPricing([
      ...tierPricing,
      { minQuantity: 1, maxQuantity: null, price: 0, accountType: 'B2C' },
    ]);
  };

  const handleRemoveTierPrice = (index: number) => {
    setTierPricing(tierPricing.filter((_: any, i: number) => i !== index));
  };

  const handleUpdateTierPrice = (index: number, field: string, value: any) => {
    const updated = [...tierPricing];
    updated[index] = { ...updated[index], [field]: value };
    setTierPricing(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';

      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(formData.basePrice) || 0,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          gsaPrice: formData.gsaPrice ? parseFloat(formData.gsaPrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          categoryId: formData.categoryId || null,
          brandId: formData.brandId || null,
          defaultSupplierId: formData.defaultSupplierId || null,
          defaultWarehouseId: formData.defaultWarehouseId || null,
          images,
          tierPricing,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function buildCategoryOptions(
    cats: typeof categories,
    parentId: string | null = null,
    level: number = 0
  ): JSX.Element[] {
    const options: JSX.Element[] = [];
    const children = cats.filter(c => c.parentId === parentId);

    children.forEach(cat => {
      options.push(
        <option key={cat.id} value={cat.id}>
          {'\u00A0'.repeat(level * 4)}{cat.name}
        </option>
      );
      options.push(...buildCategoryOptions(cats, cat.id, level + 1));
    });

    return options;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              maxLength={200}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sale Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSA Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.gsaPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, gsaPrice: e.target.value }))}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>
        </div>

        {/* Tier Pricing */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Tier Pricing</h3>
            <Button
              type="button"
              onClick={handleAddTierPrice}
              size="sm"
              variant="outline"
              className="border-safety-green-600 text-safety-green-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tier
            </Button>
          </div>

          {tierPricing.length > 0 && (
            <div className="space-y-3">
              {tierPricing.map((tier: any, index: number) => (
                <div key={index} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min Qty
                      </label>
                      <input
                        type="number"
                        value={tier.minQuantity}
                        onChange={(e) => handleUpdateTierPrice(index, 'minQuantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Qty
                      </label>
                      <input
                        type="number"
                        value={tier.maxQuantity || ''}
                        onChange={(e) => handleUpdateTierPrice(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Unlimited"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => handleUpdateTierPrice(index, 'price', parseFloat(e.target.value))}
                          className="w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={tier.accountType}
                        onChange={(e) => handleUpdateTierPrice(index, 'accountType', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                      >
                        <option value="B2C">B2C</option>
                        <option value="B2B">B2B</option>
                        <option value="GSA">GSA</option>
                      </select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleRemoveTierPrice(index)}
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Product Images</h2>

        <div className="space-y-4">
          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-safety-green-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-safety-green-600 animate-spin mb-3" />
                <p className="text-gray-600">Uploading images...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium mb-1">
                  Drop images here or click to upload
                </p>
                <p className="text-sm text-gray-500">
                  Supports: JPEG, PNG, GIF, WebP (max 5MB each)
                </p>
              </div>
            )}
          </div>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Product ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 bg-safety-green-600 text-white text-xs rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* URL Input (alternative method) */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-600 mb-2">Or add image by URL:</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Enter image URL..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
              <Button
                type="button"
                onClick={handleAddImage}
                variant="outline"
                className="border-safety-green-600 text-safety-green-600 hover:bg-safety-green-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add URL
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            First image will be the primary product image. Drag images to reorder.
          </p>
        </div>
      </div>

      {/* Inventory & Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Inventory & Organization</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">-- Select Category --</option>
              {buildCategoryOptions(categories)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <select
              value={formData.brandId}
              onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">-- Select Brand --</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Supplier
            </label>
            <select
              value={formData.defaultSupplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultSupplierId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name} ({supplier.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Warehouse
            </label>
            <select
              value={formData.defaultWarehouseId}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultWarehouseId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">-- Select Warehouse --</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm text-gray-700">Featured Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) => setFormData(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm text-gray-700">Best Seller</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData(prev => ({ ...prev, isNewArrival: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm text-gray-700">New Arrival</span>
            </label>
          </div>
        </div>
      </div>

      {/* Product Variants - Only show for existing products */}
      {product?.id ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <ProductVariantsManager
            productId={product.id}
            categoryId={formData.categoryId || undefined}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">Product Variants</h2>
          <p className="text-gray-500 text-sm">
            Save the product first, then you can add variants.
          </p>
        </div>
      )}

      {/* Physical Attributes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Physical Attributes</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (lbs)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length (in)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.length}
              onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (in)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (in)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">SEO Settings</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              maxLength={60}
            />
            <p className="text-xs text-gray-600 mt-1">
              {formData.metaTitle.length}/60 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              maxLength={160}
            />
            <p className="text-xs text-gray-600 mt-1">
              {formData.metaDescription.length}/160 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={formData.metaKeywords}
              onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={loading}
          className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
