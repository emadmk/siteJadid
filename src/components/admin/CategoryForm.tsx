'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { CategoryVariantConfig } from './CategoryVariantConfig';

interface PriceRule {
  attribute: string;
  condition: '>=' | '<=' | '==' | 'in';
  value: string;
  modifier: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  displayOrder?: number | null;
  isActive?: boolean;
  showOnHomepage?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  variantAttributeIds?: string[];
  priceRules?: PriceRule[] | unknown | null;  // Accept JsonValue from Prisma
}

interface CategoryFormProps {
  category?: Category;
  categories: { id: string; name: string; parentId: string | null; slug: string }[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image: category?.image || '',
    parentId: category?.parentId || '',
    displayOrder: category?.displayOrder?.toString() || '0',
    isActive: category?.isActive ?? true,
    showOnHomepage: category?.showOnHomepage ?? false,
    metaTitle: category?.metaTitle || '',
    metaDescription: category?.metaDescription || '',
    metaKeywords: category?.metaKeywords || '',
    variantAttributeIds: category?.variantAttributeIds || [],
    priceRules: (category?.priceRules as PriceRule[]) || [],
  });

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'category');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.url }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-generate slug from name
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = category
        ? `/api/admin/categories/${category.id}`
        : '/api/admin/categories';

      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image: formData.image || null,
          parentId: formData.parentId || null,
          displayOrder: parseInt(formData.displayOrder) || 0,
          variantAttributeIds: formData.variantAttributeIds,
          priceRules: formData.priceRules.length > 0 ? formData.priceRules : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save category');
      }

      router.push('/admin/categories');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical category list for parent selection
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
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Basic Information</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              required
            />
          </div>

          {/* Slug */}
          <div className="md:col-span-2">
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
            <p className="text-xs text-gray-600 mt-1">
              URL-friendly identifier (e.g., safety-helmets)
            </p>
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">-- Root Category --</option>
              {buildCategoryOptions(categories)}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Leave blank to create a root category
            </p>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              min="0"
            />
            <p className="text-xs text-gray-600 mt-1">
              Lower numbers appear first
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          {/* Category Image */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <div className="flex items-start gap-4">
              {formData.image ? (
                <div className="relative">
                  <img
                    src={formData.image}
                    alt="Category"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="category-image"
                />
                <label
                  htmlFor="category-image"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 400x400px, Max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Active (visible to customers)
              </span>
            </label>
          </div>

          {/* Show on Homepage */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOnHomepage}
                onChange={(e) => setFormData(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                className="w-4 h-4 text-safety-green-600 border-gray-300 rounded focus:ring-safety-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Show on Homepage
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Display this category in the homepage "Shop by Category" section
            </p>
          </div>
        </div>
      </div>

      {/* SEO Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">SEO Settings</h2>

        <div className="space-y-6">
          {/* Meta Title */}
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
              {formData.metaTitle.length}/60 characters (recommended)
            </p>
          </div>

          {/* Meta Description */}
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
              {formData.metaDescription.length}/160 characters (recommended)
            </p>
          </div>

          {/* Meta Keywords */}
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
            <p className="text-xs text-gray-600 mt-1">
              Separate keywords with commas
            </p>
          </div>
        </div>
      </div>

      {/* Variant Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-black mb-6">Variant Configuration</h2>
        <CategoryVariantConfig
          selectedAttributeIds={formData.variantAttributeIds}
          priceRules={formData.priceRules}
          onChange={(config) => setFormData(prev => ({
            ...prev,
            variantAttributeIds: config.variantAttributeIds,
            priceRules: config.priceRules,
          }))}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Link href="/admin/categories">
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
          {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
