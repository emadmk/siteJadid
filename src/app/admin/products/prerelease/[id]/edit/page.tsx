'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Save, Rocket, Loader2, Package, X, Plus, AlertCircle,
  FolderOpen, Check, ImageIcon, Trash2
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  vendorPartNumber: string | null;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  salePrice: number | null;
  wholesalePrice: number | null;
  gsaPrice: number | null;
  images: string[];
  status: string;
  originalCategory: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  categories: { category: { id: string; name: string } }[];
  brandId: string | null;
  brand: { id: string; name: string } | null;
  stockQuantity: number;
  weight: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { name: string } | null;
}

interface Brand {
  id: string;
  name: string;
}

export default function PreReleaseEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    vendorPartNumber: '',
    description: '',
    shortDescription: '',
    basePrice: '',
    salePrice: '',
    wholesalePrice: '',
    gsaPrice: '',
    categoryId: '',
    brandId: '',
    stockQuantity: '',
    weight: '',
    metaTitle: '',
    metaDescription: '',
    images: [] as string[],
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productRes, categoriesRes, brandsRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`),
          fetch('/api/admin/categories'),
          fetch('/api/admin/brands'),
        ]);

        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
          setFormData({
            name: productData.name || '',
            slug: productData.slug || '',
            sku: productData.sku || '',
            vendorPartNumber: productData.vendorPartNumber || '',
            description: productData.description || '',
            shortDescription: productData.shortDescription || '',
            basePrice: productData.basePrice?.toString() || '',
            salePrice: productData.salePrice?.toString() || '',
            wholesalePrice: productData.wholesalePrice?.toString() || '',
            gsaPrice: productData.gsaPrice?.toString() || '',
            categoryId: productData.categoryId || '',
            brandId: productData.brandId || '',
            stockQuantity: productData.stockQuantity?.toString() || '0',
            weight: productData.weight?.toString() || '',
            metaTitle: productData.metaTitle || '',
            metaDescription: productData.metaDescription || '',
            images: productData.images || [],
          });

          // Set additional categories
          const additionalCats = productData.categories?.map((c: any) => c.category.id) || [];
          if (productData.categoryId) {
            setSelectedCategories([productData.categoryId, ...additionalCats]);
          } else {
            setSelectedCategories(additionalCats);
          }
        }

        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }

        if (brandsRes.ok) {
          setBrands(await brandsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async (release: boolean = false) => {
    if (release) {
      setIsReleasing(true);
    } else {
      setIsSaving(true);
    }
    setError('');
    setSuccess('');

    try {
      // Validate
      if (!formData.name.trim()) {
        setError('Product name is required');
        return;
      }
      if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
        setError('Base price must be greater than 0');
        return;
      }
      if (release && selectedCategories.length === 0) {
        setError('Please select at least one category before releasing');
        return;
      }

      const primaryCategoryId = selectedCategories[0] || null;
      const additionalCategoryIds = selectedCategories.slice(1);

      const updateData: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: formData.sku.trim(),
        vendorPartNumber: formData.vendorPartNumber.trim() || null,
        description: formData.description.trim() || null,
        shortDescription: formData.shortDescription.trim() || null,
        basePrice: parseFloat(formData.basePrice),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        gsaPrice: formData.gsaPrice ? parseFloat(formData.gsaPrice) : null,
        categoryId: primaryCategoryId,
        additionalCategoryIds,
        brandId: formData.brandId || null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        metaTitle: formData.metaTitle.trim() || null,
        metaDescription: formData.metaDescription.trim() || null,
        images: formData.images,
      };

      // If releasing, set status to ACTIVE
      if (release) {
        updateData.status = 'ACTIVE';
      }

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        if (release) {
          setSuccess('Product released successfully!');
          setTimeout(() => {
            router.push('/admin/products/prerelease');
          }, 1500);
        } else {
          setSuccess('Product saved successfully!');
          // Refresh product data
          const refreshRes = await fetch(`/api/admin/products/${productId}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setProduct(refreshData);
          }
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Save error:', error);
      setError('An error occurred while saving');
    } finally {
      setIsSaving(false);
      setIsReleasing(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Build hierarchical category display
  const getCategoryDisplay = (cat: Category) => {
    if (cat.parent) {
      return `${cat.parent.name} > ${cat.name}`;
    }
    return cat.name;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-safety-green-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-red-800 mb-2">Product Not Found</h2>
          <p className="text-red-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link href="/admin/products/prerelease">
            <Button variant="outline">Back to PreRelease</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/products/prerelease"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to PreRelease
          </Link>
          <h1 className="text-2xl font-bold text-black">Edit PreRelease Product</h1>
          <p className="text-gray-600 mt-1">Review and edit product details before releasing to the store.</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Original Category Notice */}
      {product.originalCategory && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-medium text-orange-800">Original Category from Import:</p>
              <p className="text-orange-700 text-lg">{product.originalCategory}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                  <input
                    type="text"
                    name="vendorPartNumber"
                    value={formData.vendorPartNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  placeholder="auto-generated-from-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="wholesalePrice"
                    value={formData.wholesalePrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSA Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="gsaPrice"
                    value={formData.gsaPrice}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Images</h2>
            {formData.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={img}
                        alt={`Product image ${idx + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-2 left-2 bg-safety-green-600 text-white text-xs px-2 py-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No images uploaded</p>
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving || isReleasing}
                variant="outline"
                className="w-full border-gray-300"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving || isReleasing}
                className="w-full bg-safety-green-600 hover:bg-safety-green-700 text-white"
              >
                {isReleasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Save & Release
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Release will make this product visible on the storefront
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">
              Categories
              {selectedCategories.length > 0 && (
                <span className="ml-2 text-sm font-normal text-safety-green-600">
                  ({selectedCategories.length} selected)
                </span>
              )}
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {categories.map(cat => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-safety-green-50 border border-safety-green-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
                  />
                  <span className="text-sm">{getCategoryDisplay(cat)}</span>
                </label>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Select at least one category to release
              </p>
            )}
          </div>

          {/* Brand */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Brand</h2>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">No Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
